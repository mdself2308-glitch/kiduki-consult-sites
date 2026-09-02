import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from './wordpress-rest-utils.mjs';
import { verifySeoApprovalBinding } from './seo-approval-binding.mjs';

const args = parseArgs(process.argv.slice(2));
const manifestPath = path.resolve(
  args.manifest || 'kiduki/config/seo-spot-ctr-2026-09-01-v2.json',
);
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const requestedIds = args.ids
  ? new Set(String(args.ids).split(',').map((value) => Number(value.trim())))
  : null;
const selectedItems = (manifest.items || []).filter(
  (item) => !requestedIds || requestedIds.has(Number(item.id)),
);

if (!selectedItems.length) throw new Error('No SEO approval items were selected.');

const approvalBinding = verifySeoApprovalBinding({
  manifest,
  manifestPath,
  selectedItems,
  args,
  apply: false,
});

if (!approvalBinding.required) {
  throw new Error('The selected SEO manifest does not require exact approval.');
}

console.log(
  JSON.stringify(
    {
      ok: true,
      manifestPath,
      release: manifest.release,
      approvalBinding,
    },
    null,
    2,
  ),
);
