#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

import { parseArgs } from '../../tools/wordpress-rest-utils.mjs';

const args = parseArgs(process.argv.slice(2));
const keyFilePath = path.resolve('backups/xserver-forwarding-key.env');
const servername = 'kdk202308.xsrv.jp';
const sourceAddress = 'info@kdkconslt-sngyouijm.com';
const destinationAddress = 'answr202308@kdkconslt-sngyouijm.com';
const apiBaseUrl = 'https://api.xserver.ne.jp';

function readEnvValue(filePath, key) {
  if (!fs.existsSync(filePath)) {
    throw new Error('The forwarding API key file is missing.');
  }
  const line = fs
    .readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .find((entry) => entry.startsWith(`${key}=`));
  return line ? line.slice(line.indexOf('=') + 1).trim() : '';
}

function clearApiKeyFile() {
  const temporaryPath = `${keyFilePath}.tmp-${process.pid}`;
  fs.writeFileSync(
    temporaryPath,
    'XSERVER_FORWARDING_API_KEY=\n',
    { mode: 0o600 },
  );
  fs.chmodSync(temporaryPath, 0o600);
  fs.renameSync(temporaryPath, keyFilePath);
  fs.chmodSync(keyFilePath, 0o600);
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
    data = null;
  }
  if (!response.ok) {
    throw new Error(`XServer API failed with HTTP ${response.status}.`);
  }
  return data;
}

const apiKey = readEnvValue(
  keyFilePath,
  'XSERVER_FORWARDING_API_KEY',
);
if (!apiKey) {
  throw new Error('XSERVER_FORWARDING_API_KEY is empty.');
}

const encodedServername = encodeURIComponent(servername);
const encodedSource = encodeURIComponent(sourceAddress);
const forwardingPath =
  `/v1/server/${encodedServername}/mail/${encodedSource}/forwarding`;
const before = await xserverFetch(apiKey, 'GET', forwardingPath);
const beforeAddresses = Array.isArray(before?.forwarding_addresses)
  ? before.forwarding_addresses
  : [];
const desiredAddresses = [
  ...new Set([...beforeAddresses, destinationAddress]),
];
const desired = {
  forwarding_addresses: desiredAddresses,
  keep_in_mailbox: true,
};

if (!args.apply) {
  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: 'dry-run',
        sourceAddress,
        before: {
          forwardingAddresses: beforeAddresses,
          keepInMailbox: Boolean(before?.keep_in_mailbox),
        },
        after: {
          forwardingAddresses: desiredAddresses,
          keepInMailbox: true,
        },
        apiKeyDisplayed: false,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

if (!args.approved) {
  throw new Error('Refusing live forwarding update without --approved.');
}

const backupDirectory = path.resolve('backups');
fs.mkdirSync(backupDirectory, { recursive: true, mode: 0o700 });
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(
  backupDirectory,
  `xserver-info-forwarding-before-${timestamp}.json`,
);
fs.writeFileSync(
  backupPath,
  `${JSON.stringify(
    {
      capturedAt: new Date().toISOString(),
      servername,
      sourceAddress,
      forwardingAddresses: beforeAddresses,
      keepInMailbox: Boolean(before?.keep_in_mailbox),
    },
    null,
    2,
  )}\n`,
  { mode: 0o600 },
);
fs.chmodSync(backupPath, 0o600);

await xserverFetch(apiKey, 'PUT', forwardingPath, desired);
const verified = await xserverFetch(apiKey, 'GET', forwardingPath);
const verifiedAddresses = Array.isArray(verified?.forwarding_addresses)
  ? verified.forwarding_addresses
  : [];

if (
  !verifiedAddresses.includes(destinationAddress) ||
  !verified?.keep_in_mailbox
) {
  throw new Error('Forwarding read-back did not match the approved setting.');
}

clearApiKeyFile();

console.log(
  JSON.stringify(
    {
      ok: true,
      mode: 'apply',
      sourceAddress,
      forwardingAddresses: verifiedAddresses,
      keepInMailbox: true,
      backupPath: path.relative(process.cwd(), backupPath),
      localApiKeyCleared: true,
      apiKeyDisplayed: false,
    },
    null,
    2,
  ),
);
