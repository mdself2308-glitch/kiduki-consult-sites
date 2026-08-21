#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  getWordPressEnv,
  parseArgs,
  safeStamp,
  wpRequest,
} from '../../tools/wordpress-rest-utils.mjs';

const formId = 1739;
const args = parseArgs(process.argv.slice(2));
const apply = Boolean(args.apply);
const backup = Boolean(args.backup);
const backupConfirmed = Boolean(args['backup-confirmed']);

if (apply && (!backup || !backupConfirmed)) {
  throw new Error(
    'Refusing contact-form update without --backup --backup-confirmed.',
  );
}

const oldSelect =
  '[select* inquiry-type "睡眠研修を検討したい" "SAS(睡眠時無呼吸)対策を相談したい" "交代勤務・夜勤の睡眠対策を相談したい" "嘱託産業医を探している" "顧問・労働衛生コンサルティング" "講演・執筆・取材の依頼" "その他"]';
const newSelect =
  '[select* inquiry-type "復職支援Pack（1案件・面談3回＋再評価）を相談したい" "復職・両立支援の単発面談を相談したい" "嘱託産業医（KIDUKI Retain）を探している" "既存産業医の専門補完（KIDUKI Basic）を相談したい" "睡眠研修を相談したい" "交代勤務・夜勤の睡眠対策を相談したい" "講演・執筆・取材の依頼" "その他"]';

function digest(value) {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(value))
    .digest('hex');
}

const env = getWordPressEnv();
const beforeResponse = await wpRequest(
  env,
  'GET',
  `/wp-json/contact-form-7/v1/contact-forms/${formId}`,
);
const before = beforeResponse.data;
const properties = before.properties || {};
const currentForm = String(properties.form?.content || properties.form || '');
const alreadyUpdated = currentForm.includes(newSelect);
const oldMatches = currentForm.split(oldSelect).length - 1;

if (!alreadyUpdated && oldMatches !== 1) {
  throw new Error(
    `Expected exactly one legacy inquiry select, found ${oldMatches}.`,
  );
}

const nextForm = alreadyUpdated
  ? currentForm
  : currentForm.replace(oldSelect, newSelect);
const mailDigestBefore = digest(properties.mail || {});
const mail2DigestBefore = digest(properties.mail_2 || {});

if (!apply) {
  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: 'dry-run',
        writes: false,
        formId,
        alreadyUpdated,
        legacyOptionRemoved: !nextForm.includes(
          'SAS(睡眠時無呼吸)対策を相談したい',
        ),
        nextOptions: [
          '復職支援Pack',
          '復職・両立支援の単発面談',
          'KIDUKI Retain',
          'KIDUKI Basic',
          '睡眠研修',
          '交代勤務・夜勤の睡眠対策',
          '講演・執筆・取材',
          'その他',
        ],
        mailTemplatesPreserved: true,
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
  `cf7-${formId}-before-inquiry-types-${safeStamp()}.json`,
);
fs.writeFileSync(backupPath, `${JSON.stringify(before, null, 2)}\n`, {
  mode: 0o600,
});
fs.chmodSync(backupPath, 0o600);

await wpRequest(
  env,
  'POST',
  `/wp-json/contact-form-7/v1/contact-forms/${formId}`,
  {
    id: formId,
    title: before.title,
    locale: before.locale || 'ja',
    form: nextForm,
    mail: properties.mail,
    mail_2: properties.mail_2,
    additional_settings:
      properties.additional_settings?.content ||
      properties.additional_settings ||
      '',
    messages: properties.messages,
    context: 'save',
  },
);

const afterResponse = await wpRequest(
  env,
  'GET',
  `/wp-json/contact-form-7/v1/contact-forms/${formId}`,
);
const after = afterResponse.data;
const afterProperties = after.properties || {};
const afterForm = String(
  afterProperties.form?.content || afterProperties.form || '',
);

if (
  !afterForm.includes(newSelect) ||
  afterForm.includes('SAS(睡眠時無呼吸)対策を相談したい') ||
  digest(afterProperties.mail || {}) !== mailDigestBefore ||
  digest(afterProperties.mail_2 || {}) !== mail2DigestBefore
) {
  throw new Error(`Contact-form verification failed. Backup: ${backupPath}`);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      mode: 'apply',
      formId,
      backupPath,
      legacyOptionRemoved: true,
      currentProductOptionsPresent: true,
      mailTemplatesPreserved: true,
    },
    null,
    2,
  ),
);
