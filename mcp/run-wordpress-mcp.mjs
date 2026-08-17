#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawn } from 'node:child_process';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const configuredSites = JSON.parse(
  fs.readFileSync(path.join(scriptDir, 'sites.json'), 'utf8'),
);

function keychainPassword(service, account) {
  try {
    return execFileSync(
      '/usr/bin/security',
      ['find-generic-password', '-s', service, '-a', account, '-w'],
      {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    ).trim();
  } catch {
    return '';
  }
}

const sites = [];

for (const site of configuredSites) {
  const password = keychainPassword(site.keychainService, site.username);
  if (!password) {
    if (site.required) {
      process.stderr.write(
        `Required WordPress Keychain credential is unavailable for site "${site.id}".\n`,
      );
      process.exit(1);
    }
    continue;
  }
  sites.push({
    id: site.id,
    url: site.url.replace(/\/$/, ''),
    username: site.username,
    password,
  });
}

if (process.argv.includes('--check')) {
  process.stdout.write(
    `${JSON.stringify({
      ok: sites.length > 0,
      sites: sites.map(({ id, url, username }) => ({ id, url, username })),
    }, null, 2)}\n`,
  );
  process.exit(sites.length > 0 ? 0 : 1);
}

if (sites.length === 0) {
  process.stderr.write('No WordPress sites are configured.\n');
  process.exit(1);
}

const child = spawn(
  'npx',
  ['-y', '@cavort-it-systems/wordpress-mcp@3.0.0'],
  {
    env: {
      ...process.env,
      WORDPRESS_SITES: JSON.stringify(sites),
    },
    stdio: 'inherit',
  },
);

child.on('error', () => process.exit(1));
child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
