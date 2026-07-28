#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import {
  getWordPressEnv,
  safeStamp,
  wpRequest,
} from '../../tools/wordpress-rest-utils.mjs';

const requiredPlugins = [
  {
    slug: 'contact-form-7',
    name: 'Contact Form 7',
  },
  {
    slug: 'flamingo',
    name: 'Flamingo',
  },
  {
    slug: 'wp-mail-smtp',
    name: 'WP Mail SMTP',
  },
  {
    slug: 'honeypot',
    name: 'WP Armour - Honeypot Anti Spam',
  },
];

const apply = process.argv.includes('--apply');
const backup = process.argv.includes('--backup');
const backupConfirmed = process.argv.includes('--backup-confirmed');

if (apply && (!backup || !backupConfirmed)) {
  throw new Error(
    'Refusing plugin installation without --backup --backup-confirmed.',
  );
}

const env = getWordPressEnv();

async function readPlugins() {
  const response = await wpRequest(
    env,
    'GET',
    '/wp-json/wp/v2/plugins?context=edit&per_page=100',
  );

  return response.data.map((plugin) => ({
    plugin: plugin.plugin,
    status: plugin.status,
    name: plugin.name,
    version: plugin.version,
  }));
}

function findInstalled(plugins, slug) {
  return plugins.find(
    (plugin) =>
      plugin.plugin === slug || plugin.plugin.startsWith(`${slug}/`),
  );
}

const before = await readPlugins();
const plan = requiredPlugins.map((required) => {
  const installed = findInstalled(before, required.slug);
  return {
    ...required,
    currentPlugin: installed?.plugin || null,
    currentStatus: installed?.status || 'not-installed',
    operation:
      installed?.status === 'active'
        ? 'none'
        : installed
          ? 'activate'
          : 'install-and-activate',
  };
});

if (!apply) {
  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: 'dry-run',
        writes: false,
        site: env.siteUrl,
        plan,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

const backupDir = path.resolve('backups');
fs.mkdirSync(backupDir, { recursive: true });
const backupPath = path.join(
  backupDir,
  `wp-plugins-before-t2b-${safeStamp()}.json`,
);
fs.writeFileSync(
  backupPath,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      site: env.siteUrl,
      plugins: before,
    },
    null,
    2,
  )}\n`,
  { mode: 0o600 },
);
fs.chmodSync(backupPath, 0o600);

const operations = [];

for (const required of requiredPlugins) {
  const currentPlugins = await readPlugins();
  const installed = findInstalled(currentPlugins, required.slug);

  if (installed?.status === 'active') {
    operations.push({
      slug: required.slug,
      operation: 'none',
      plugin: installed.plugin,
      status: installed.status,
      version: installed.version,
    });
    continue;
  }

  if (installed) {
    const activated = await wpRequest(
      env,
      'POST',
      `/wp-json/wp/v2/plugins/${installed.plugin}`,
      { status: 'active' },
    );
    operations.push({
      slug: required.slug,
      operation: 'activate',
      plugin: activated.data.plugin,
      status: activated.data.status,
      version: activated.data.version,
    });
    continue;
  }

  const created = await wpRequest(env, 'POST', '/wp-json/wp/v2/plugins', {
    slug: required.slug,
    status: 'active',
  });
  operations.push({
    slug: required.slug,
    operation: 'install-and-activate',
    plugin: created.data.plugin,
    status: created.data.status,
    version: created.data.version,
  });
}

const after = await readPlugins();
const verification = requiredPlugins.map((required) => {
  const installed = findInstalled(after, required.slug);
  return {
    slug: required.slug,
    plugin: installed?.plugin || null,
    status: installed?.status || 'missing',
    version: installed?.version || null,
  };
});

if (verification.some((plugin) => plugin.status !== 'active')) {
  throw new Error('One or more T2B plugins are not active after installation.');
}

console.log(
  JSON.stringify(
    {
      ok: true,
      mode: 'apply',
      backupPath,
      operations,
      verification,
    },
    null,
    2,
  ),
);
