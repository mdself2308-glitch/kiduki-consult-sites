#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import tls from 'node:tls';

const envPath = path.resolve('.env');
const backupsPath = path.resolve('backups');
const imapHost = 'sv14329.xserver.jp';
const imapPort = 993;
const mailAddress = 'info@kdkconslt-sngyouijm.com';

function parseEnvFile(filePath) {
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

function latestReceipt() {
  const candidates = fs
    .readdirSync(backupsPath)
    .filter(
      (name) =>
        name.startsWith('t2a-mail-test-') && name.endsWith('.json'),
    )
    .sort();
  if (candidates.length === 0) {
    throw new Error('No T2A mail-test receipt was found.');
  }
  const receiptPath = path.join(backupsPath, candidates.at(-1));
  return {
    path: receiptPath,
    data: JSON.parse(fs.readFileSync(receiptPath, 'utf8')),
  };
}

function quoteImap(value) {
  return `"${String(value).replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`;
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

class ImapClient {
  constructor(socket) {
    this.socket = socket;
    this.lines = readline.createInterface({
      input: socket,
      crlfDelay: Infinity,
    })[Symbol.asyncIterator]();
  }

  async nextLine(label) {
    const next = await withTimeout(this.lines.next(), label);
    if (next.done) throw new Error(`${label} ended unexpectedly.`);
    return String(next.value);
  }

  async command(tag, command, label) {
    this.socket.write(`${tag} ${command}\r\n`);
    const lines = [];
    while (true) {
      const line = await this.nextLine(label);
      lines.push(line);
      if (line.startsWith(`${tag} `)) {
        if (!line.startsWith(`${tag} OK`)) {
          throw new Error(`${label} failed.`);
        }
        return lines;
      }
    }
  }
}

if (!fs.existsSync(envPath)) {
  throw new Error('.env is missing.');
}
const env = parseEnvFile(envPath);
const password = String(
  env.get('XSERVER_INFO_MAIL_PASSWORD') || '',
).trim();
if (!password) {
  throw new Error('XSERVER_INFO_MAIL_PASSWORD is missing.');
}

const receipt = latestReceipt();
const forwardingResult = receipt.data?.results?.find(
  (result) => result.label === 'forwarding',
);
if (!forwardingResult?.messageId) {
  throw new Error('The forwarding test Message-ID is missing.');
}

const socket = tls.connect({
  host: imapHost,
  port: imapPort,
  servername: imapHost,
  rejectUnauthorized: true,
  minVersion: 'TLSv1.2',
});
await withTimeout(
  new Promise((resolve, reject) => {
    socket.once('secureConnect', resolve);
    socket.once('error', reject);
  }),
  'IMAP TLS connection',
);

const client = new ImapClient(socket);
const greeting = await client.nextLine('IMAP greeting');
if (!greeting.startsWith('* OK')) {
  throw new Error('IMAP greeting was not OK.');
}

await client.command(
  'a001',
  `LOGIN ${quoteImap(mailAddress)} ${quoteImap(password)}`,
  'IMAP login',
);
const selectLines = await client.command(
  'a002',
  'SELECT INBOX',
  'IMAP select',
);
const existsLine = selectLines.find((line) => /^\* \d+ EXISTS$/.test(line));
const inboxMessageCount = existsLine
  ? Number(existsLine.split(' ')[1])
  : null;
const searchLines = await client.command(
  'a003',
  `SEARCH HEADER Message-ID ${quoteImap(forwardingResult.messageId)}`,
  'IMAP Message-ID search',
);
const searchLine = searchLines.find((line) => line.startsWith('* SEARCH'));
const matchedIds = searchLine
  ? searchLine
      .slice('* SEARCH'.length)
      .trim()
      .split(/\s+/)
      .filter(Boolean)
  : [];
await client.command('a004', 'LOGOUT', 'IMAP logout');
socket.end();

console.log(
  JSON.stringify(
    {
      ok: true,
      mailbox: mailAddress,
      tls: {
        authorized: socket.authorized,
        protocol: socket.getProtocol(),
      },
      inboxMessageCount,
      forwardingTestCopyFound: matchedIds.length > 0,
      matchingMessageCount: matchedIds.length,
      messageContentDisplayed: false,
      passwordDisplayed: false,
    },
    null,
    2,
  ),
);
