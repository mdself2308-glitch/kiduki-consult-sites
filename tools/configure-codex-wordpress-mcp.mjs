import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const configPath = path.join(os.homedir(), '.codex', 'config.toml');
const wrapperPath = path.resolve('mcp/run-wordpress-mcp.mjs');
const original = fs.readFileSync(configPath, 'utf8');

const sectionPattern =
  /(\[mcp_servers\.wordpress\]\n)([\s\S]*?)(?=\n\[mcp_servers\.wordpress(?:\.|\])|\n\[(?!mcp_servers\.wordpress(?:\.|\]))[^\]]+\]|\s*$)/;
const match = original.match(sectionPattern);
if (!match) {
  throw new Error('Could not find [mcp_servers.wordpress] in Codex config.');
}

let body = match[2];
body = body.replace(
  /^command\s*=.*$/m,
  'command = "/usr/bin/env"',
);
body = body.replace(
  /^args\s*=.*$/m,
  `args = ["node", ${JSON.stringify(wrapperPath)}]`,
);

const updated = original.replace(sectionPattern, `$1${body}`);
if (updated === original) {
  console.log(
    JSON.stringify(
      {
        ok: true,
        changed: false,
        configPath,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = `${configPath}.backup-${stamp}`;
fs.copyFileSync(configPath, backupPath);
fs.writeFileSync(configPath, updated, { mode: 0o600 });

console.log(
  JSON.stringify(
    {
      ok: true,
      changed: true,
      configPath,
      backupPath,
      note: 'Restart or open a new Codex task to load the updated WordPress MCP server.',
    },
    null,
    2,
  ),
);

