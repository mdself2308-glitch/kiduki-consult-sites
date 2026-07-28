#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const envPath = path.resolve('.env');
const requiredKeys = ['T2A_TEST_GMAIL', 'T2A_TEST_OUTLOOK'];

if (!fs.existsSync(envPath)) {
  throw new Error('.env is missing.');
}

const original = fs.readFileSync(envPath, 'utf8');
const existingKeys = new Set(
  original
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => line.slice(0, line.indexOf('='))),
);
const addedKeys = requiredKeys.filter((key) => !existingKeys.has(key));

if (addedKeys.length > 0) {
  const lines = original.split(/\r?\n/);
  while (lines.length > 0 && lines.at(-1) === '') lines.pop();
  lines.push('', '# T2A test recipients (do not commit)');
  for (const key of addedKeys) lines.push(`${key}=`);

  const temporaryPath = `${envPath}.tmp-${process.pid}`;
  fs.writeFileSync(temporaryPath, `${lines.join('\n')}\n`, { mode: 0o600 });
  fs.chmodSync(temporaryPath, 0o600);
  fs.renameSync(temporaryPath, envPath);
}

fs.chmodSync(envPath, 0o600);

console.log(
  JSON.stringify(
    {
      ok: true,
      envPath: '.env',
      requiredKeys,
      addedKeys,
      valuesDisplayed: false,
      mode: '0600',
    },
    null,
    2,
  ),
);
