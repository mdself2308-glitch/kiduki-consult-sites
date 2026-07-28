#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { parseArgs } from '../../tools/wordpress-rest-utils.mjs';

const args = parseArgs(process.argv.slice(2));
const envPath = path.resolve('.env');
const mailAddress = 'info@kdkconslt-sngyouijm.com';
const domain = 'kdkconslt-sngyouijm.com';
const expectedServername = 'kdk202308.xsrv.jp';
const quotaMb = 2000;
const passwordEnvName = 'XSERVER_INFO_MAIL_PASSWORD';
const apiBaseUrl = 'https://api.xserver.ne.jp';

function parseEnvFile(contents) {
  const values = new Map();
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const equals = line.indexOf('=');
    if (equals < 1) continue;
    values.set(line.slice(0, equals), line.slice(equals + 1));
  }
  return values;
}

function upsertEnvValue(contents, key, value) {
  const lines = contents.split(/\r?\n/);
  let found = false;
  const next = lines.map((line) => {
    if (!line.startsWith(`${key}=`)) return line;
    found = true;
    return `${key}=${value}`;
  });
  if (!found) {
    while (next.length > 0 && next.at(-1) === '') next.pop();
    next.push(`${key}=${value}`);
  }
  return `${next.join('\n')}\n`;
}

function randomCharacter(alphabet) {
  return alphabet[crypto.randomInt(0, alphabet.length)];
}

function generateStrongPassword(length = 24) {
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';
  const alphabet = `${lower}${upper}${digits}`;
  const characters = [
    randomCharacter(lower),
    randomCharacter(upper),
    randomCharacter(digits),
  ];
  while (characters.length < length) {
    characters.push(randomCharacter(alphabet));
  }
  for (let index = characters.length - 1; index > 0; index -= 1) {
    const swapIndex = crypto.randomInt(0, index + 1);
    [characters[index], characters[swapIndex]] = [
      characters[swapIndex],
      characters[index],
    ];
  }
  return characters.join('');
}

function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      /password|api.?key|authorization/i.test(key)
        ? '<redacted>'
        : redact(entry),
    ]),
  );
}

async function xserverFetch(apiKey, method, endpoint, body) {
  const response = await fetch(`${apiBaseUrl}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
      ...(body === undefined
        ? {}
        : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text ? { message: 'XServer returned a non-JSON response.' } : null;
  }
  if (!response.ok) {
    throw new Error(
      `XServer API ${response.status}: ${JSON.stringify(redact(data))}`,
    );
  }
  return data;
}

function accountSummary(account) {
  return {
    mailAddress: account?.mail_address || mailAddress,
    quotaMb: account?.quota_mb ?? quotaMb,
    memo: account?.memo || '',
  };
}

if (!fs.existsSync(envPath)) {
  throw new Error('.env is missing.');
}

let envContents = fs.readFileSync(envPath, 'utf8');
let envValues = parseEnvFile(envContents);
const apiKey = String(envValues.get('XSERVER_API_KEY') || '').trim();
const servername = String(
  envValues.get('XSERVER_SERVERNAME') || '',
).trim();
if (!apiKey) {
  throw new Error('XSERVER_API_KEY is missing from .env.');
}
if (servername !== expectedServername) {
  throw new Error('XSERVER_SERVERNAME does not match the approved server.');
}

let password = String(envValues.get(passwordEnvName) || '').trim();
let passwordState = 'existing';
if (!password) {
  password = generateStrongPassword();
  envContents = upsertEnvValue(envContents, passwordEnvName, password);
  const temporaryPath = `${envPath}.tmp-${process.pid}`;
  fs.writeFileSync(temporaryPath, envContents, { mode: 0o600 });
  fs.chmodSync(temporaryPath, 0o600);
  fs.renameSync(temporaryPath, envPath);
  fs.chmodSync(envPath, 0o600);
  envValues = parseEnvFile(envContents);
  passwordState = 'generated';
} else {
  fs.chmodSync(envPath, 0o600);
}

if (password.length < 8) {
  throw new Error(`${passwordEnvName} does not meet the API minimum length.`);
}

const mailPath = `/v1/server/${encodeURIComponent(servername)}/mail`;
const existingResponse = await xserverFetch(
  apiKey,
  'GET',
  `${mailPath}?domain=${encodeURIComponent(domain)}`,
);
const accounts = Array.isArray(existingResponse?.accounts)
  ? existingResponse.accounts
  : [];
const existing = accounts.find(
  (account) => account.mail_address === mailAddress,
);

if (!args.apply) {
  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: 'dry-run',
        target: {
          mailAddress,
          servername,
          quotaMb,
        },
        before: {
          exists: Boolean(existing),
        },
        password: {
          state: passwordState,
          storedIn: '.env',
          envName: passwordEnvName,
          displayed: false,
        },
        plannedRequest: existing
          ? null
          : {
              method: 'POST',
              path: mailPath,
              body: {
                mail_address: mailAddress,
                password: '<redacted>',
                quota_mb: quotaMb,
              },
            },
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

if (!args.approved) {
  throw new Error('Refusing live creation without --approved.');
}

let created = false;
if (!existing) {
  await xserverFetch(apiKey, 'POST', mailPath, {
    mail_address: mailAddress,
    password,
    quota_mb: quotaMb,
  });
  created = true;
}

const verified = await xserverFetch(
  apiKey,
  'GET',
  `${mailPath}/${encodeURIComponent(mailAddress)}`,
);
console.log(
  JSON.stringify(
    {
      ok: true,
      mode: 'apply',
      created,
      account: accountSummary(verified),
      password: {
        state: passwordState,
        storedIn: '.env',
        envName: passwordEnvName,
        displayed: false,
      },
    },
    null,
    2,
  ),
);
