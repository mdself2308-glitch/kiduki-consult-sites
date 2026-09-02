#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  getWordPressEnv,
  wpRequest,
} from './wordpress-rest-utils.mjs';

const planArgIndex = process.argv.indexOf('--plan');
const planPath = path.resolve(
  planArgIndex >= 0 && process.argv[planArgIndex + 1]
    ? process.argv[planArgIndex + 1]
    : 'content/article-plan.json',
);
const plan = JSON.parse(await readFile(planPath, 'utf8'));
const env = getWordPressEnv();

const articles = await Promise.all(
  plan.articles.map(async (article) => {
    if (!article.wordpress_post_id) {
      return {
        slug: article.slug,
        ok: false,
        error: 'wordpress_post_id is missing',
      };
    }
    const endpoint =
      `/wp-json/wp/v2/posts/${article.wordpress_post_id}` +
      '?context=edit&_fields=id,slug,status,date,date_gmt,modified,link';
    try {
      const response = await wpRequest(env, 'GET', endpoint);
      const post = response.data;
      const expectedStatus =
        article.production_status === 'published' ? 'publish' : 'future';
      const checks = {
        id: post.id === article.wordpress_post_id,
        slug: post.slug === article.slug,
        status: post.status === expectedStatus,
        publishAt: post.date === article.publish_at,
      };
      return {
        slug: article.slug,
        postId: post.id,
        expectedStatus,
        actualStatus: post.status,
        expectedPublishAt: article.publish_at,
        actualPublishAt: post.date,
        modified: post.modified,
        link: post.link,
        checks,
        ok: Object.values(checks).every(Boolean),
      };
    } catch (error) {
      return { slug: article.slug, ok: false, error: error.message };
    }
  }),
);

const output = {
  ok: articles.every((article) => article.ok),
  writes: false,
  planPath,
  checkedAt: new Date().toISOString(),
  articles,
};

console.log(JSON.stringify(output, null, 2));
if (!output.ok) process.exitCode = 2;
