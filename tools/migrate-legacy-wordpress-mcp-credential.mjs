import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const configPath = path.join(os.homedir(), '.codex', 'config.toml');
const keychainService = 'codex.wordpress.sleeprecovery-bancho.jp';
const text = fs.readFileSync(configPath, 'utf8');

const envSectionPattern =
  /\n\[mcp_servers\.wordpress\.env\]\n([\s\S]*?)(?=\n\[|$)/;
const envSection = text.match(envSectionPattern);
if (!envSection) {
  console.log(
    JSON.stringify(
      {
        ok: true,
        changed: false,
        note: 'No legacy WordPress MCP environment section was found.',
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

function value(name) {
  const match = envSection[1].match(
    new RegExp(`^${name}\\s*=\\s*"([^"]+)"\\s*$`, 'm'),
  );
  if (!match) {
    throw new Error(`Legacy ${name} is missing from WordPress MCP config.`);
  }
  return match[1];
}

const siteUrl = value('WORDPRESS_SITE_URL').replace(/\/$/, '');
const username = value('WORDPRESS_USERNAME');
const password = value('WORDPRESS_PASSWORD');

if (siteUrl !== 'https://sleeprecovery-bancho.jp' || username !== 'SRCB') {
  throw new Error(
    'Legacy WordPress MCP credential does not match the expected clinic site.',
  );
}

execFileSync(
  '/usr/bin/security',
  [
    'add-generic-password',
    '-U',
    '-a',
    username,
    '-s',
    keychainService,
    '-w',
    password,
  ],
  { stdio: ['ignore', 'ignore', 'ignore'] },
);

const roundTrip = execFileSync(
  '/usr/bin/security',
  [
    'find-generic-password',
    '-a',
    username,
    '-s',
    keychainService,
    '-w',
  ],
  {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  },
).trim();

if (roundTrip !== password) {
  throw new Error('Clinic Keychain credential verification failed.');
}

let envBody = envSection[1]
  .replace(/^WORDPRESS_SITE_URL\s*=.*\n?/m, '')
  .replace(/^WORDPRESS_USERNAME\s*=.*\n?/m, '')
  .replace(/^WORDPRESS_PASSWORD\s*=.*\n?/m, '');

let updated;
if (envBody.trim()) {
  updated = text.replace(
    envSectionPattern,
    `\n[mcp_servers.wordpress.env]\n${envBody}`,
  );
} else {
  updated = text.replace(envSectionPattern, '');
}

fs.writeFileSync(configPath, updated, { mode: 0o600 });

console.log(
  JSON.stringify(
    {
      ok: true,
      changed: true,
      configPath,
      keychainService,
      account: username,
      removedPlaintextCredential: true,
    },
    null,
    2,
  ),
);

