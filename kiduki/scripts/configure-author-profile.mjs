#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import {
  getWordPressEnv,
  safeStamp,
  wpRequest,
} from '../../tools/wordpress-rest-utils.mjs';

const apply = process.argv.includes('--apply');
const backup = process.argv.includes('--backup');
const backupConfirmed = process.argv.includes('--backup-confirmed');

if (apply && (!backup || !backupConfirmed)) {
  throw new Error(
    'Refusing author profile update without --backup --backup-confirmed.',
  );
}

const nextProfile = {
  name: '宮部 大輔',
  first_name: '大輔',
  last_name: '宮部',
  description:
    'KIDUKIコンサルティング産業医事務所代表。内科専門医、心療内科専門医、労働衛生コンサルタント。産業医として、睡眠、メンタルヘルス、休職・復職、治療と仕事の両立支援に取り組む。',
};

const env = getWordPressEnv();
const currentResponse = await wpRequest(
  env,
  'GET',
  '/wp-json/wp/v2/users/me?context=edit',
);
const current = currentResponse.data;

if (Number(current.id) !== 1 || current.slug !== 'kdk-sgj') {
  throw new Error(
    `Author identity mismatch: expected user 1 / kdk-sgj, found ${current.id} / ${current.slug}.`,
  );
}

const summary = {
  id: current.id,
  slug: current.slug,
  current: {
    name: current.name || '',
    first_name: current.first_name || '',
    last_name: current.last_name || '',
    description: current.description || '',
  },
  next: nextProfile,
};

if (!apply) {
  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: 'dry-run',
        persistentWrites: false,
        ...summary,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

const backupDir = path.resolve('backups');
fs.mkdirSync(backupDir, { recursive: true, mode: 0o700 });
fs.chmodSync(backupDir, 0o700);
const backupPath = path.join(
  backupDir,
  `wp-user-${current.id}-before-${safeStamp()}.json`,
);
fs.writeFileSync(backupPath, `${JSON.stringify(current, null, 2)}\n`, {
  mode: 0o600,
});
fs.chmodSync(backupPath, 0o600);

const updatedResponse = await wpRequest(
  env,
  'POST',
  `/wp-json/wp/v2/users/${current.id}`,
  nextProfile,
);
const updated = updatedResponse.data;

for (const [key, value] of Object.entries(nextProfile)) {
  if (updated[key] !== value) {
    throw new Error(
      `Author profile verification failed for ${key}. Backup: ${backupPath}`,
    );
  }
}

console.log(
  JSON.stringify(
    {
      ok: true,
      mode: 'apply',
      backupPath,
      id: updated.id,
      slug: updated.slug,
      name: updated.name,
      first_name: updated.first_name,
      last_name: updated.last_name,
      description: updated.description,
    },
    null,
    2,
  ),
);
