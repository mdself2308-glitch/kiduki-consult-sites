#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const envPath = path.resolve('.env');
const domain = 'kdkconslt-sngyouijm.com';
const expectedServername = 'kdk202308.xsrv.jp';
const apiBaseUrl = 'https://api.xserver.ne.jp';

function parseEnvFile(contents) {
  return new Map(
    contents
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const equals = line.indexOf('=');
        return [line.slice(0, equals), line.slice(equals + 1)];
      }),
  );
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

function fingerprint(value) {
  if (!value) return null;
  return crypto.createHash('sha256').update(value).digest('hex');
}

if (!fs.existsSync(envPath)) {
  throw new Error('.env is missing.');
}
const env = parseEnvFile(fs.readFileSync(envPath, 'utf8'));
const apiKey = String(env.get('XSERVER_API_KEY') || '').trim();
const servername = String(env.get('XSERVER_SERVERNAME') || '').trim();
if (!apiKey) throw new Error('XSERVER_API_KEY is missing.');
if (servername !== expectedServername) {
  throw new Error('XSERVER_SERVERNAME does not match the approved server.');
}

const encodedServername = encodeURIComponent(servername);
const encodedDomain = encodeURIComponent(domain);
const [dkimList, dkimDetail, dmarc, dns] = await Promise.all([
  xserverGet(
    apiKey,
    `/v1/server/${encodedServername}/dkim?domain=${encodedDomain}`,
  ),
  xserverGet(
    apiKey,
    `/v1/server/${encodedServername}/dkim/${encodedDomain}`,
  ),
  xserverGet(
    apiKey,
    `/v1/server/${encodedServername}/dmarc?domain=${encodedDomain}`,
  ),
  xserverGet(
    apiKey,
    `/v1/server/${encodedServername}/dns?domain=${encodedDomain}`,
  ),
]);

const records = Array.isArray(dns?.records) ? dns.records : [];
const dkimRecord = dkimDetail?.dkim_record || null;
const selectRecords = (predicate) =>
  records.filter(predicate).map(({ id, host, type, content, ttl }) => ({
    id,
    host,
    type,
    content,
    ttl,
  }));

console.log(
  JSON.stringify(
    {
      ok: true,
      servername,
      domain,
      dkim: {
        settings: dkimList?.dkim_settings || [],
        detail: {
          fqdn: dkimDetail?.fqdn || domain,
          enabled: Boolean(dkimDetail?.enabled),
          record: dkimRecord
            ? {
                hostname: dkimRecord.hostname,
                type: dkimRecord.type,
                contentSha256: fingerprint(dkimRecord.content),
                contentLength: String(dkimRecord.content || '').length,
              }
            : null,
        },
      },
      dmarcSettings: dmarc?.dmarc_settings || [],
      dmarcRecords: selectRecords(
        (record) =>
          record.type === 'TXT' &&
          String(record.host).toLowerCase() === `_dmarc.${domain}`,
      ),
      spfRecords: selectRecords(
        (record) =>
          record.type === 'TXT' &&
          String(record.content).toLowerCase().startsWith('v=spf1'),
      ),
      ownershipRecords: selectRecords(
        (record) =>
          record.type === 'TXT' &&
          String(record.host).toLowerCase() ===
            `_xserver-verify.${domain}`,
      ),
      protectedCnames: selectRecords(
        (record) =>
          record.type === 'CNAME' &&
          [`consult.${domain}`, `reserve.${domain}`].includes(record.host),
      ),
    },
    null,
    2,
  ),
);
