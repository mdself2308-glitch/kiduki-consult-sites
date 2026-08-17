#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import {
  getWordPressEnv,
  parseArgs,
  safeStamp,
  wpRequest,
} from '../../tools/wordpress-rest-utils.mjs';

const args = parseArgs(process.argv.slice(2));
const apply = Boolean(args.apply);
const backup = Boolean(args.backup);
const backupConfirmed = Boolean(args['backup-confirmed']);
const postId = 1597;
const featuredMediaId = 133;
const expectedSlug = 'long-hours-occupational-physician-interview';
const expectedTitle =
  '長時間労働者の産業医面談｜会社が準備する資料と面談後の措置';

if (apply && (!backup || !backupConfirmed)) {
  throw new Error(
    'Refusing featured-media update without --backup --backup-confirmed.',
  );
}

const env = getWordPressEnv();
const [postResponse, mediaResponse] = await Promise.all([
  wpRequest(env, 'GET', `/wp-json/wp/v2/posts/${postId}?context=edit`),
  wpRequest(env, 'GET', `/wp-json/wp/v2/media/${featuredMediaId}?context=edit`),
]);
const post = postResponse.data;
const media = mediaResponse.data;
const currentTitle = post.title?.raw || post.title?.rendered || '';

if (
  post.slug !== expectedSlug ||
  currentTitle !== expectedTitle ||
  post.status !== 'publish'
) {
  throw new Error(
    `Post ${postId} does not match the approved long-hours article identity.`,
  );
}
if (
  media.media_type !== 'image' ||
  media.mime_type !== 'image/png' ||
  Number(media.media_details?.width) !== 1456 ||
  Number(media.media_details?.height) !== 832
) {
  throw new Error(`Media ${featuredMediaId} is not the reviewed 1456x832 PNG.`);
}

const comparison = {
  post: {
    id: post.id,
    modified: post.modified,
    slug: post.slug,
    status: post.status,
    title: currentTitle,
    currentFeaturedMedia: Number(post.featured_media || 0),
    nextFeaturedMedia: featuredMediaId,
  },
  media: {
    id: media.id,
    title: media.title?.raw || media.title?.rendered || '',
    sourceUrl: media.source_url,
    mimeType: media.mime_type,
    width: media.media_details.width,
    height: media.media_details.height,
  },
};

if (!apply) {
  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: 'dry-run',
        persistentWrites: false,
        changed: comparison.post.currentFeaturedMedia !== featuredMediaId,
        comparison,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

if (![0, featuredMediaId].includes(comparison.post.currentFeaturedMedia)) {
  throw new Error(
    `Post ${postId} already has an unreviewed featured image: ${comparison.post.currentFeaturedMedia}`,
  );
}

const backupDirectory = path.resolve('backups');
fs.mkdirSync(backupDirectory, { recursive: true, mode: 0o700 });
const backupPath = path.join(
  backupDirectory,
  `wp-long-hours-featured-media-before-${safeStamp()}.json`,
);
fs.writeFileSync(
  backupPath,
  `${JSON.stringify({ takenAt: new Date().toISOString(), post, selectedMedia: media }, null, 2)}\n`,
  { mode: 0o600 },
);
fs.chmodSync(backupPath, 0o600);

if (comparison.post.currentFeaturedMedia !== featuredMediaId) {
  await wpRequest(env, 'POST', `/wp-json/wp/v2/posts/${postId}`, {
    featured_media: featuredMediaId,
  });
}
const verifiedResponse = await wpRequest(
  env,
  'GET',
  `/wp-json/wp/v2/posts/${postId}?context=edit`,
);
const verified = verifiedResponse.data;
if (
  Number(verified.featured_media) !== featuredMediaId ||
  verified.slug !== expectedSlug ||
  verified.status !== 'publish'
) {
  throw new Error(`Featured-media verification failed. Backup: ${backupPath}`);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      mode: 'apply',
      backupPath: path.relative(process.cwd(), backupPath),
      post: {
        id: verified.id,
        modified: verified.modified,
        slug: verified.slug,
        status: verified.status,
        featuredMedia: verified.featured_media,
      },
      media: comparison.media,
    },
    null,
    2,
  ),
);
