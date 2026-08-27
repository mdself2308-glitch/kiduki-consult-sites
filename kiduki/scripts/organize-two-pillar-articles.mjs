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
    'Refusing article taxonomy update without --backup --backup-confirmed.',
  );
}

const categorySpecs = [
  {
    key: 'sleep',
    name: '睡眠と産業衛生',
    slug: 'sleep-occupational-hygiene',
    description: '睡眠、夜勤、SAS、休復職など、睡眠と仕事の関係を扱う企業・事業所向けの記事です。',
  },
  {
    key: 'dx',
    name: '産業衛生DX',
    slug: 'occupational-hygiene-dx',
    description: '産業衛生業務の標準化、効率化、記録、進捗管理に関する記事です。',
  },
  {
    key: 'practice',
    name: '産業衛生実務',
    slug: 'occupational-hygiene-practice',
    description: '産業医面談、就業措置、体制づくりなど、企業・事業所の産業衛生実務に関する記事です。',
  },
];

const postPlan = [
  { id: 1809, categories: ['sleep', 'practice'] },
  { id: 1597, categories: ['sleep', 'practice'] },
  { id: 1064, categories: [27, 'dx'] },
  { id: 1062, categories: [27, 'dx'] },
  { id: 1598, categories: [27, 'practice'] },
];

const env = getWordPressEnv();
const categoriesResponse = await wpRequest(
  env,
  'GET',
  '/wp-json/wp/v2/categories?context=edit&per_page=100',
);
const categoriesBefore = categoriesResponse.data;
const existingBySlug = new Map(categoriesBefore.map((category) => [category.slug, category]));

const postsBefore = [];
for (const plan of postPlan) {
  const response = await wpRequest(
    env,
    'GET',
    `/wp-json/wp/v2/posts/${plan.id}?context=edit&_fields=id,slug,title,categories,modified`,
  );
  postsBefore.push(response.data);
}

const preview = categorySpecs.map((spec) => ({
  ...spec,
  existingId: existingBySlug.get(spec.slug)?.id || null,
  action: existingBySlug.has(spec.slug) ? 'reuse' : 'create',
}));

if (!apply) {
  console.log(JSON.stringify({
    ok: true,
    mode: 'dry-run',
    writes: false,
    categories: preview,
    posts: postsBefore.map((post) => ({
      id: post.id,
      title: post.title?.raw || post.title?.rendered,
      currentCategories: post.categories,
      plannedCategories: postPlan.find((plan) => plan.id === post.id).categories,
    })),
    uncategorizedRemovedFrom: [1809, 1597],
  }, null, 2));
  process.exit(0);
}

const backupDir = path.resolve('backups');
fs.mkdirSync(backupDir, { recursive: true, mode: 0o700 });
fs.chmodSync(backupDir, 0o700);
const backupPath = path.join(backupDir, `wp-article-taxonomy-before-two-pillars-${safeStamp()}.json`);
fs.writeFileSync(backupPath, `${JSON.stringify({ categories: categoriesBefore, posts: postsBefore }, null, 2)}\n`, { mode: 0o600 });
fs.chmodSync(backupPath, 0o600);

const categoryIds = new Map();
for (const spec of categorySpecs) {
  const existing = existingBySlug.get(spec.slug);
  if (existing) {
    categoryIds.set(spec.key, Number(existing.id));
    continue;
  }
  const created = await wpRequest(env, 'POST', '/wp-json/wp/v2/categories', {
    name: spec.name,
    slug: spec.slug,
    description: spec.description,
  });
  categoryIds.set(spec.key, Number(created.data.id));
}

for (const plan of postPlan) {
  const nextCategories = plan.categories.map((category) =>
    typeof category === 'number' ? category : categoryIds.get(category),
  );
  if (nextCategories.some((id) => !Number.isInteger(id))) {
    throw new Error(`Could not resolve categories for post ${plan.id}.`);
  }
  await wpRequest(env, 'POST', `/wp-json/wp/v2/posts/${plan.id}`, {
    categories: nextCategories,
  });
}

const verifiedPosts = [];
for (const plan of postPlan) {
  const response = await wpRequest(
    env,
    'GET',
    `/wp-json/wp/v2/posts/${plan.id}?context=edit&_fields=id,categories`,
  );
  const expected = plan.categories.map((category) =>
    typeof category === 'number' ? category : categoryIds.get(category),
  ).sort((a, b) => a - b);
  const actual = [...response.data.categories].sort((a, b) => a - b);
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Category verification failed for post ${plan.id}. Backup: ${backupPath}`);
  }
  verifiedPosts.push(response.data);
}

console.log(JSON.stringify({
  ok: true,
  mode: 'apply',
  backupPath,
  categoryIds: Object.fromEntries(categoryIds),
  updatedPosts: verifiedPosts,
  uncategorizedRemovedFrom: [1809, 1597],
}, null, 2));
