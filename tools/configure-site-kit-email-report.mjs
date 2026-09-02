import fs from 'node:fs';
import path from 'node:path';
import {
  getWordPressEnv,
  parseArgs,
  safeStamp,
  wpRequest,
} from './wordpress-rest-utils.mjs';

const args = parseArgs(process.argv.slice(2));
const endpoint = '/wp-json/google-site-kit/v1/core/user/data/email-reporting-settings';
const frequency = args.frequency || 'weekly';
const subscribed = !args.unsubscribe;
const apply = Boolean(args.apply);
const backup = Boolean(args.backup);
const backupConfirmed = Boolean(args['backup-confirmed']);

if (!['weekly', 'monthly', 'quarterly'].includes(frequency)) {
  throw new Error('Frequency must be weekly, monthly, or quarterly.');
}
if (apply && (!backup || !backupConfirmed)) {
  throw new Error('Refusing Site Kit email-reporting write without --backup --backup-confirmed.');
}

const env = getWordPressEnv(args.site || 'office');
const beforeResponse = await wpRequest(env, 'GET', endpoint);
const before = {
  subscribed: Boolean(beforeResponse.data?.subscribed),
  frequency: beforeResponse.data?.frequency || null,
};
const desired = { subscribed, frequency };
const changed =
  before.subscribed !== desired.subscribed
  || before.frequency !== desired.frequency;

if (!apply || !changed) {
  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: apply ? 'apply' : 'dry-run',
        writes: false,
        action: changed ? 'would_update' : 'unchanged',
        before,
        desired,
        backupPath: null,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

const backupDir = path.resolve('backups');
fs.mkdirSync(backupDir, { recursive: true, mode: 0o700 });
const backupPath = path.join(
  backupDir,
  `site-kit-email-report-before-${safeStamp()}.json`,
);
fs.writeFileSync(
  backupPath,
  `${JSON.stringify({ endpoint, settings: before }, null, 2)}\n`,
  { mode: 0o600 },
);
fs.chmodSync(backupPath, 0o600);

await wpRequest(env, 'POST', endpoint, {
  data: { settings: desired },
});
const afterResponse = await wpRequest(env, 'GET', endpoint);
const after = {
  subscribed: Boolean(afterResponse.data?.subscribed),
  frequency: afterResponse.data?.frequency || null,
};
if (
  after.subscribed !== desired.subscribed
  || after.frequency !== desired.frequency
) {
  throw new Error(`Site Kit email-reporting verification failed. Backup: ${backupPath}`);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      mode: 'apply',
      writes: true,
      action: 'updated_verified',
      before,
      after,
      backupPath,
    },
    null,
    2,
  ),
);
