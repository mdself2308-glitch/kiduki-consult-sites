#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { parseArgs } from '../../tools/wordpress-rest-utils.mjs';

const args = parseArgs(process.argv.slice(2));
const envPath = path.resolve('.env');
const domain = 'kdkconslt-sngyouijm.com';
const reportAddress = `info@${domain}`;
const expectedServername = 'kdk202308.xsrv.jp';
const apiBaseUrl = 'https://api.xserver.ne.jp';
const expectedSpf =
  'v=spf1 +a:sv14329.xserver.jp +a:kdkconslt-sngyouijm.com +mx include:spf.sender.xserver.jp ~all';
const expectedCnames = new Map([
  [
    `consult.${domain}`,
    'gentle-pond-00de74b00.2.azurestaticapps.net',
  ],
  [
    `reserve.${domain}`,
    'delightful-rock-0b1b91000.6.azurestaticapps.net',
  ],
]);

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

function fingerprint(value) {
  if (!value) return null;
  return crypto.createHash('sha256').update(value).digest('hex');
}

function selectedDnsRecords(dns) {
  const records = Array.isArray(dns?.records) ? dns.records : [];
  return {
    spf: records
      .filter(
        (record) =>
          record.type === 'TXT' &&
          String(record.content).toLowerCase().startsWith('v=spf1'),
      )
      .map(({ id, host, type, content, ttl }) => ({
        id,
        host,
        type,
        content,
        ttl,
      })),
    protectedCnames: records
      .filter(
        (record) =>
          record.type === 'CNAME' && expectedCnames.has(record.host),
      )
      .map(({ id, host, type, content, ttl }) => ({
        id,
        host,
        type,
        content,
        ttl,
      }))
      .sort((left, right) => left.host.localeCompare(right.host)),
    dkim: records
      .filter(
        (record) =>
          record.type === 'TXT' &&
          record.host === `default._domainkey.${domain}`,
      )
      .map(({ id, host, type, content, ttl }) => ({
        id,
        host,
        type,
        contentSha256: fingerprint(content),
        contentLength: String(content || '').length,
        ttl,
      })),
    dmarc: records
      .filter(
        (record) =>
          record.type === 'TXT' && record.host === `_dmarc.${domain}`,
      )
      .map(({ id, host, type, content, ttl }) => ({
        id,
        host,
        type,
        content,
        ttl,
      })),
  };
}

function assertProtectedRecords(records) {
  if (
    records.spf.length !== 1 ||
    records.spf[0].host !== domain ||
    records.spf[0].content !== expectedSpf
  ) {
    throw new Error('SPF guard failed; refusing to continue.');
  }
  if (records.protectedCnames.length !== expectedCnames.size) {
    throw new Error('Protected CNAME guard failed; refusing to continue.');
  }
  for (const record of records.protectedCnames) {
    if (record.content !== expectedCnames.get(record.host)) {
      throw new Error('Protected CNAME target mismatch; refusing to continue.');
    }
  }
}

function stableProtected(records) {
  return JSON.stringify({
    spf: records.spf,
    protectedCnames: records.protectedCnames,
  });
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
const dkimPath = `/v1/server/${encodedServername}/dkim/${encodedDomain}`;
const dmarcPath = `/v1/server/${encodedServername}/dmarc/${encodedDomain}`;
const dnsPath =
  `/v1/server/${encodedServername}/dns?domain=${encodedDomain}`;
const dmarcListPath =
  `/v1/server/${encodedServername}/dmarc?domain=${encodedDomain}`;

const [beforeDkim, beforeDmarcResponse, beforeDns] = await Promise.all([
  xserverFetch(apiKey, 'GET', dkimPath),
  xserverFetch(apiKey, 'GET', dmarcListPath),
  xserverFetch(apiKey, 'GET', dnsPath),
]);
const beforeDmarc = beforeDmarcResponse?.dmarc_settings?.[0] || null;
const beforeRecords = selectedDnsRecords(beforeDns);
assertProtectedRecords(beforeRecords);

const plan = {
  dkim: {
    method: 'PUT',
    path: dkimPath,
    body: { enabled: true },
  },
  dmarc: {
    method: 'PUT',
    path: dmarcPath,
    body: {
      policy: 'none',
      report_enabled: true,
      notification_mail_addresses: reportAddress,
    },
  },
};

if (!args.apply) {
  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: 'dry-run',
        target: { servername, domain },
        before: {
          dkimEnabled: Boolean(beforeDkim?.enabled),
          dmarc: beforeDmarc,
          dns: beforeRecords,
        },
        plan,
        guards: {
          spfUnchanged: true,
          protectedCnamesUnchanged: true,
        },
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

if (!args.approved) {
  throw new Error('Refusing live configuration without --approved.');
}

const backupDirectory = path.resolve('backups');
fs.mkdirSync(backupDirectory, { recursive: true, mode: 0o700 });
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(
  backupDirectory,
  `xserver-mail-auth-before-${timestamp}.json`,
);
fs.writeFileSync(
  backupPath,
  `${JSON.stringify(
    {
      capturedAt: new Date().toISOString(),
      servername,
      domain,
      dkim: beforeDkim,
      dmarc: beforeDmarc,
      dns: beforeRecords,
    },
    null,
    2,
  )}\n`,
  { mode: 0o600 },
);
fs.chmodSync(backupPath, 0o600);

await xserverFetch(apiKey, 'PUT', dkimPath, plan.dkim.body);
await xserverFetch(apiKey, 'PUT', dmarcPath, plan.dmarc.body);

const [afterDkim, afterDmarcResponse, afterDns] = await Promise.all([
  xserverFetch(apiKey, 'GET', dkimPath),
  xserverFetch(apiKey, 'GET', dmarcListPath),
  xserverFetch(apiKey, 'GET', dnsPath),
]);
const afterDmarc = afterDmarcResponse?.dmarc_settings?.[0] || null;
const afterRecords = selectedDnsRecords(afterDns);
assertProtectedRecords(afterRecords);

if (stableProtected(beforeRecords) !== stableProtected(afterRecords)) {
  throw new Error('A protected DNS record changed unexpectedly.');
}
if (!afterDkim?.enabled) {
  throw new Error('DKIM did not become enabled.');
}
if (
  afterDmarc?.policy !== 'none' ||
  !afterDmarc?.report_enabled ||
  !afterDmarc?.notification_mail_addresses?.includes(reportAddress)
) {
  throw new Error('DMARC read-back did not match the approved configuration.');
}

const dkimRecord = afterDkim?.dkim_record || null;
console.log(
  JSON.stringify(
    {
      ok: true,
      mode: 'apply',
      target: { servername, domain },
      backupPath: path.relative(process.cwd(), backupPath),
      after: {
        dkim: {
          enabled: Boolean(afterDkim?.enabled),
          record: dkimRecord
            ? {
                hostname: dkimRecord.hostname,
                type: dkimRecord.type,
                contentSha256: fingerprint(dkimRecord.content),
                contentLength: String(dkimRecord.content || '').length,
              }
            : null,
        },
        dmarc: afterDmarc,
        dns: afterRecords,
      },
      guards: {
        spfUnchanged: true,
        protectedCnamesUnchanged: true,
      },
      secretsDisplayed: false,
    },
    null,
    2,
  ),
);
