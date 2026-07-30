import fs from 'node:fs';
import path from 'node:path';
import {
  getWordPressEnv,
  parseArgs,
  safeStamp,
  wpRequest,
} from '../../tools/wordpress-rest-utils.mjs';

/**
 * Replace the site logo artwork.
 *
 * The logo in use (media 1621) reads 「東京KIDUKIコンサルティング事務所」, which
 * matches neither the registered name nor the rest of the site, and it is white
 * artwork sitting on the white page header, so the header branding was
 * effectively invisible. The footer widget uses the same white file on a dark
 * green background, where white is correct.
 *
 * So two files are needed: a dark one for the header and a light one for the
 * footer. Both are regenerated from the original in kiduki/assets/logo (the KD
 * monogram is lifted from it pixel-for-pixel; only the wordmark is re-set).
 *
 * The old media items are left in the library untouched, so reverting is a
 * matter of pointing site_logo and the widget back at 1621.
 */
const LEGACY_MEDIA_ID = 1621;
const WIDGET_ID = 'block-185';
const OFFICE_NAME = 'KIDUKIコンサルティング産業医事務所';

const assets = [
  {
    key: 'dark',
    file: 'kiduki/assets/logo/kiduki-logo-dark.png',
    uploadName: 'kiduki-logo-dark.png',
    title: `${OFFICE_NAME} ロゴ（濃色・ヘッダー用）`,
    alt: OFFICE_NAME,
  },
  {
    key: 'light',
    file: 'kiduki/assets/logo/kiduki-logo-light.png',
    uploadName: 'kiduki-logo-light.png',
    title: `${OFFICE_NAME} ロゴ（白・フッター用）`,
    // Decorative: the office name already appears as text in the footer.
    alt: '',
  },
];

const args = parseArgs(process.argv.slice(2));
const apply = Boolean(args.apply);
const backup = Boolean(args.backup);
const backupConfirmed = Boolean(args['backup-confirmed']);

if (apply && (!backup || !backupConfirmed)) {
  throw new Error('Refusing to change the logo without --backup --backup-confirmed.');
}

const env = getWordPressEnv();

async function uploadMedia(asset) {
  const bytes = fs.readFileSync(path.resolve(asset.file));
  const response = await fetch(`${env.siteUrl}/wp-json/wp/v2/media`, {
    method: 'POST',
    redirect: 'manual',
    headers: {
      Authorization: `Basic ${Buffer.from(`${env.username}:${env.password}`).toString('base64')}`,
      Accept: 'application/json',
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="${asset.uploadName}"`,
      'User-Agent': 'kdk-wordpress-local-tools/1.0',
    },
    body: bytes,
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Media upload failed for ${asset.uploadName}: ${response.status} ${text}`);
  }
  return JSON.parse(text);
}

function widgetContent(sourceUrl, mediaId) {
  return `<!-- wp:image {"id":${mediaId},"sizeSlug":"full","linkDestination":"none"} -->
<figure class="wp-block-image size-full"><img src="${sourceUrl}" alt="" class="wp-image-${mediaId}"/></figure>
<!-- /wp:image -->`;
}

// --- read current state -----------------------------------------------------

const settingsBefore = await wpRequest(env, 'GET', '/wp-json/wp/v2/settings');
const widgetBefore = await wpRequest(env, 'GET', `/wp-json/wp/v2/widgets/${WIDGET_ID}?context=edit`);

for (const asset of assets) {
  const full = path.resolve(asset.file);
  if (!fs.existsSync(full)) {
    throw new Error(`Missing asset: ${asset.file}`);
  }
  asset.bytes = fs.statSync(full).size;
}

if (!apply) {
  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: 'dry-run',
        siteLogoNow: settingsBefore.data.site_logo,
        widgetReferencesLegacy: widgetBefore.data.rendered.includes(`wp-image-${LEGACY_MEDIA_ID}`),
        plannedUploads: assets.map((a) => ({ key: a.key, name: a.uploadName, bytes: a.bytes })),
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

// --- backup -----------------------------------------------------------------

const dir = path.resolve('backups');
fs.mkdirSync(dir, { recursive: true });
const backupPath = path.join(dir, `wp-site-logo-before-${safeStamp()}.json`);
fs.writeFileSync(
  backupPath,
  JSON.stringify(
    {
      takenAt: new Date().toISOString(),
      site_logo: settingsBefore.data.site_logo,
      widget: {
        id: WIDGET_ID,
        sidebar: widgetBefore.data.sidebar,
        instance: widgetBefore.data.instance,
        rendered: widgetBefore.data.rendered,
      },
    },
    null,
    2,
  ),
);

// --- upload -----------------------------------------------------------------

const uploaded = {};
for (const asset of assets) {
  const media = await uploadMedia(asset);
  uploaded[asset.key] = { id: media.id, url: media.source_url };

  await wpRequest(env, 'POST', `/wp-json/wp/v2/media/${media.id}`, {
    title: asset.title,
    alt_text: asset.alt,
  });
}

// --- point the header and footer at the new files ---------------------------

const settingsAfter = await wpRequest(env, 'POST', '/wp-json/wp/v2/settings', {
  site_logo: uploaded.dark.id,
});

const widgetAfter = await wpRequest(env, 'POST', `/wp-json/wp/v2/widgets/${WIDGET_ID}`, {
  id: WIDGET_ID,
  id_base: 'block',
  sidebar: widgetBefore.data.sidebar,
  instance: {
    raw: { content: widgetContent(uploaded.light.url, uploaded.light.id) },
  },
});

// --- verify -----------------------------------------------------------------

const problems = [];
if (settingsAfter.data.site_logo !== uploaded.dark.id) {
  problems.push(`site_logo is ${settingsAfter.data.site_logo}, expected ${uploaded.dark.id}`);
}
if (!widgetAfter.data.rendered.includes(`wp-image-${uploaded.light.id}`)) {
  problems.push('footer widget does not reference the new light logo');
}
if (widgetAfter.data.rendered.includes(`wp-image-${LEGACY_MEDIA_ID}`)) {
  problems.push('footer widget still references the legacy logo');
}
if (problems.length > 0) {
  throw new Error(`Verification failed: ${problems.join('; ')}`);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      mode: 'apply',
      backupPath,
      uploaded,
      siteLogo: { before: settingsBefore.data.site_logo, after: settingsAfter.data.site_logo },
      legacyMediaKept: LEGACY_MEDIA_ID,
    },
    null,
    2,
  ),
);
