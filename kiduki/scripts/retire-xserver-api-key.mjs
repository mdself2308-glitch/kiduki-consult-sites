#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const envPath = path.resolve('.env');
const keyName = 'XSERVER_API_KEY';

if (!fs.existsSync(envPath)) {
  throw new Error('.env is missing.');
}

const original = fs.readFileSync(envPath, 'utf8');
let found = false;
let hadValue = false;
const updated = original
  .split(/\r?\n/)
  .map((line) => {
    if (!line.startsWith(`${keyName}=`)) return line;
    found = true;
    hadValue = line.length > `${keyName}=`.length;
    return `${keyName}=`;
  })
  .join('\n');

if (!found) {
  throw new Error(`${keyName} is missing from .env.`);
}

if (hadValue) {
  const temporaryPath = `${envPath}.tmp-${process.pid}`;
  fs.writeFileSync(temporaryPath, updated, { mode: 0o600 });
  fs.chmodSync(temporaryPath, 0o600);
  fs.renameSync(temporaryPath, envPath);
}

fs.chmodSync(envPath, 0o600);

console.log(
  JSON.stringify(
    {
      ok: true,
      keyName,
      cleared: hadValue,
      valueDisplayed: false,
      envMode: '0600',
    },
    null,
    2,
  ),
);
