#!/usr/bin/env node

import {
  getWordPressEnv,
  wpRequest,
} from '../../tools/wordpress-rest-utils.mjs';

const env = getWordPressEnv();

const [pluginsResponse, themesResponse, settingsResponse, questionResponse, indexResponse] =
  await Promise.all([
    wpRequest(
      env,
      'GET',
      '/wp-json/wp/v2/plugins?context=edit&per_page=100',
    ),
    wpRequest(env, 'GET', '/wp-json/wp/v2/themes?context=edit'),
    wpRequest(env, 'GET', '/wp-json/wp/v2/settings'),
    wpRequest(env, 'GET', '/wp-json/wp/v2/pages/37?context=edit'),
    wpRequest(env, 'GET', '/wp-json/'),
  ]);

const plugins = pluginsResponse.data
  .map((plugin) => ({
    plugin: plugin.plugin,
    status: plugin.status,
    name: plugin.name,
    version: plugin.version,
  }))
  .sort((left, right) => left.plugin.localeCompare(right.plugin));

const activeTheme = themesResponse.data.find(
  (theme) => theme.status === 'active',
);

const routeNames = Object.keys(indexResponse.data.routes || {});
const capabilityChecks = {
  pluginsRest: routeNames.includes('/wp/v2/plugins'),
  themesRest: routeNames.includes('/wp/v2/themes'),
  codeSnippetsRest: routeNames.some((route) =>
    route.startsWith('/code-snippets/v1/'),
  ),
  contactForm7Rest: routeNames.some((route) =>
    route.startsWith('/contact-form-7/v1/'),
  ),
  flamingoRest: routeNames.some((route) => route.startsWith('/flamingo/v1/')),
  siteKitRest: routeNames.some((route) =>
    route.startsWith('/google-site-kit/v1/'),
  ),
  w3TotalCacheRest: routeNames.some((route) =>
    route.toLowerCase().includes('w3tc'),
  ),
};

console.log(
  JSON.stringify(
    {
      ok: true,
      writes: false,
      site: env.siteUrl,
      activeTheme: activeTheme
        ? {
            stylesheet: activeTheme.stylesheet,
            name: activeTheme.name?.rendered || activeTheme.name || '',
            version: activeTheme.version || '',
          }
        : null,
      settings: {
        title: settingsResponse.data.title,
        pageOnFront: settingsResponse.data.page_on_front,
        pageForPosts: settingsResponse.data.page_for_posts,
      },
      questionPage: {
        id: questionResponse.data.id,
        slug: questionResponse.data.slug,
        status: questionResponse.data.status,
        title:
          questionResponse.data.title?.raw ||
          questionResponse.data.title?.rendered ||
          '',
        modified: questionResponse.data.modified,
        contentBytes: Buffer.byteLength(
          questionResponse.data.content?.raw || '',
        ),
      },
      plugins,
      capabilityChecks,
    },
    null,
    2,
  ),
);
