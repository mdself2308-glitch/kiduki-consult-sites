#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const keyFilePath = path.resolve('backups/xserver-forwarding-key.env');
const servername = 'kdk202308.xsrv.jp';
const sourceAddress = 'info@kdkconslt-sngyouijm.com';
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

async function xserverGet(apiKey, endpoint) {
  const response = await fetch(`${apiBaseUrl}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!response.ok) {
    throw new Error(`XServer read failed with HTTP ${response.status}.`);
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
const [keyInfo, forwarding] = await Promise.all([
  xserverGet(apiKey, '/v1/me'),
  xserverGet(
    apiKey,
    `/v1/server/${encodedServername}/mail/${encodedSource}/forwarding`,
  ),
]);

if (keyInfo?.servername !== servername) {
  throw new Error('The API key targets a different server.');
}

console.log(
  JSON.stringify(
    {
      ok: true,
      apiKey: {
        servername: keyInfo?.servername,
        permissionType: keyInfo?.permission_type,
        expiresAt: keyInfo?.expires_at,
        valueDisplayed: false,
      },
      sourceAddress,
      forwarding: {
        addresses: Array.isArray(forwarding?.forwarding_addresses)
          ? forwarding.forwarding_addresses
          : [],
        keepInMailbox: Boolean(forwarding?.keep_in_mailbox),
      },
    },
    null,
    2,
  ),
);
