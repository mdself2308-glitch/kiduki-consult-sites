#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import tls from 'node:tls';

import { parseArgs } from '../../tools/wordpress-rest-utils.mjs';

const args = parseArgs(process.argv.slice(2));
const envPath = path.resolve('.env');
const recipientsPath = path.resolve('backups/t2a-test-recipients.env');
const smtpHost = 'sv14329.xserver.jp';
const smtpPort = 465;
const smtpUser = 'info@kdkconslt-sngyouijm.com';
const expectedServername = 'kdk202308.xsrv.jp';

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Required configuration file is missing: ${filePath}`);
  }
  return new Map(
    fs
      .readFileSync(filePath, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const equals = line.indexOf('=');
        return [line.slice(0, equals), line.slice(equals + 1)];
      }),
  );
}

function validateAddress(address, expectedDomain, label) {
  const parts = String(address || '').trim().split('@');
  if (
    parts.length !== 2 ||
    !parts[0] ||
    parts[1].toLowerCase() !== expectedDomain
  ) {
    throw new Error(`${label} test recipient is missing or invalid.`);
  }
  return `${parts[0]}@${parts[1].toLowerCase()}`;
}

function withTimeout(promise, label, timeoutMs = 15000) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(
        () => reject(new Error(`${label} timed out.`)),
        timeoutMs,
      );
    }),
  ]).finally(() => clearTimeout(timer));
}

class SmtpClient {
  constructor(socket) {
    this.socket = socket;
    this.lines = readline.createInterface({
      input: socket,
      crlfDelay: Infinity,
    })[Symbol.asyncIterator]();
  }

  async response(label) {
    const lines = [];
    while (true) {
      const next = await withTimeout(this.lines.next(), label);
      if (next.done) throw new Error(`${label} ended unexpectedly.`);
      const line = String(next.value);
      lines.push(line);
      if (/^\d{3} /.test(line)) {
        return {
          code: Number(line.slice(0, 3)),
          finalLine: line,
          lines,
        };
      }
    }
  }

  async command(command, label, expectedCodes) {
    this.socket.write(`${command}\r\n`);
    const response = await this.response(label);
    if (!expectedCodes.includes(response.code)) {
      throw new Error(`${label} failed with SMTP ${response.code}.`);
    }
    return response;
  }

  async close() {
    try {
      await this.command('QUIT', 'SMTP quit', [221]);
    } finally {
      this.socket.end();
    }
  }
}

async function connectAndAuthenticate(password) {
  const socket = tls.connect({
    host: smtpHost,
    port: smtpPort,
    servername: smtpHost,
    rejectUnauthorized: true,
    minVersion: 'TLSv1.2',
  });
  await withTimeout(
    new Promise((resolve, reject) => {
      socket.once('secureConnect', resolve);
      socket.once('error', reject);
    }),
    'SMTP TLS connection',
  );

  const client = new SmtpClient(socket);
  const greeting = await client.response('SMTP greeting');
  if (greeting.code !== 220) {
    throw new Error(`SMTP greeting failed with ${greeting.code}.`);
  }
  await client.command(
    `EHLO ${smtpUser.split('@')[1]}`,
    'SMTP EHLO',
    [250],
  );
  await client.command('AUTH LOGIN', 'SMTP authentication start', [334]);
  await client.command(
    Buffer.from(smtpUser).toString('base64'),
    'SMTP authentication username',
    [334],
  );
  await client.command(
    Buffer.from(password).toString('base64'),
    'SMTP authentication password',
    [235],
  );

  return {
    client,
    tls: {
      authorized: socket.authorized,
      protocol: socket.getProtocol(),
      cipher: socket.getCipher()?.name || null,
    },
  };
}

function base64Lines(text) {
  const encoded = Buffer.from(text, 'utf8').toString('base64');
  return encoded.match(/.{1,76}/g)?.join('\r\n') || '';
}

function buildMessage({ recipient, subject, messageId, sentAt }) {
  const body = [
    'KIDUKIコンサルティング産業医事務所のメール基盤テストです。',
    'このメールへの返信は不要です。',
    `送信日時: ${sentAt.toISOString()}`,
  ].join('\n');
  return [
    `Date: ${sentAt.toUTCString()}`,
    `From: KIDUKI Mail Test <${smtpUser}>`,
    `To: ${recipient}`,
    `Subject: ${subject}`,
    `Message-ID: <${messageId}>`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    base64Lines(body),
  ].join('\r\n');
}

async function sendMessage(client, test) {
  await client.command(
    `MAIL FROM:<${smtpUser}>`,
    `${test.label} MAIL FROM`,
    [250],
  );
  await client.command(
    `RCPT TO:<${test.recipient}>`,
    `${test.label} RCPT TO`,
    [250, 251],
  );
  await client.command('DATA', `${test.label} DATA`, [354]);
  const response = await client.command(
    `${buildMessage(test)}\r\n.`,
    `${test.label} message acceptance`,
    [250],
  );
  return {
    label: test.label,
    subject: test.subject,
    messageId: test.messageId,
    accepted: true,
    smtpCode: response.code,
  };
}

const env = parseEnvFile(envPath);
const recipients = parseEnvFile(recipientsPath);
const password = String(
  env.get('XSERVER_INFO_MAIL_PASSWORD') || '',
).trim();
if (!password) {
  throw new Error('XSERVER_INFO_MAIL_PASSWORD is missing.');
}
if (env.get('XSERVER_SERVERNAME') !== expectedServername) {
  throw new Error('XSERVER_SERVERNAME does not match the approved server.');
}

const gmail = validateAddress(
  recipients.get('T2A_TEST_GMAIL'),
  'gmail.com',
  'Gmail',
);
const outlook = validateAddress(
  recipients.get('T2A_TEST_OUTLOOK'),
  'sngyouijm.onmicrosoft.com',
  'Outlook',
);
const sentAt = new Date();
const stamp = sentAt.toISOString().replace(/[:.]/g, '-');
const tests = [
  {
    label: 'gmail',
    recipient: gmail,
    subject: `[KIDUKI T2A] Gmail delivery test ${stamp}`,
  },
  {
    label: 'outlook',
    recipient: outlook,
    subject: `[KIDUKI T2A] Outlook delivery test ${stamp}`,
  },
  {
    label: 'forwarding',
    recipient: smtpUser,
    subject: `[KIDUKI T2A] info-to-answr forwarding test ${stamp}`,
  },
].map((test) => ({
  ...test,
  sentAt,
  messageId:
    `t2a-${test.label}-${crypto.randomUUID()}@` +
    'kdkconslt-sngyouijm.com',
}));

const authenticated = await connectAndAuthenticate(password);

if (!args.apply) {
  await authenticated.client.close();
  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: 'dry-run',
        smtp: {
          host: smtpHost,
          port: smtpPort,
          secure: true,
          authenticated: true,
          tls: authenticated.tls,
        },
        plannedTests: tests.map(({ label, subject }) => ({
          label,
          subject,
          recipientConfigured: true,
        })),
        recipientValuesDisplayed: false,
        passwordDisplayed: false,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

if (!args.approved) {
  await authenticated.client.close();
  throw new Error('Refusing live test sends without --approved.');
}

const results = [];
try {
  for (const test of tests) {
    results.push(await sendMessage(authenticated.client, test));
  }
} finally {
  await authenticated.client.close();
}

const backupDirectory = path.resolve('backups');
fs.mkdirSync(backupDirectory, { recursive: true, mode: 0o700 });
const receiptPath = path.join(
  backupDirectory,
  `t2a-mail-test-${stamp}.json`,
);
fs.writeFileSync(
  receiptPath,
  `${JSON.stringify(
    {
      sentAt: sentAt.toISOString(),
      smtp: {
        host: smtpHost,
        port: smtpPort,
        secure: true,
        tls: authenticated.tls,
      },
      results,
      recipientValuesStored: false,
      passwordStored: false,
    },
    null,
    2,
  )}\n`,
  { mode: 0o600 },
);
fs.chmodSync(receiptPath, 0o600);

console.log(
  JSON.stringify(
    {
      ok: true,
      mode: 'apply',
      sentAt: sentAt.toISOString(),
      results,
      receiptPath: path.relative(process.cwd(), receiptPath),
      recipientValuesDisplayed: false,
      passwordDisplayed: false,
    },
    null,
    2,
  ),
);
