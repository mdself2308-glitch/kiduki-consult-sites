#!/usr/bin/env node

import {
  getWordPressEnv,
  wpRequest,
} from '../../tools/wordpress-rest-utils.mjs';

const env = getWordPressEnv();

const [
  formsResponse,
  formsOptionsResponse,
  pagesResponse,
  restIndexResponse,
] = await Promise.all([
  wpRequest(env, 'GET', '/wp-json/contact-form-7/v1/contact-forms'),
  wpRequest(env, 'OPTIONS', '/wp-json/contact-form-7/v1/contact-forms'),
  wpRequest(
    env,
    'GET',
    '/wp-json/wp/v2/pages?context=edit&per_page=100&status=publish,draft,pending,private,future&_fields=id,slug,status,title,parent,link,modified',
  ),
  wpRequest(env, 'GET', '/wp-json/'),
]);

const siteKitRoutes = Object.keys(restIndexResponse.data.routes || {})
  .filter((route) => route.startsWith('/google-site-kit/v1/'))
  .sort();

const formItems = Array.isArray(formsResponse.data)
  ? formsResponse.data
  : formsResponse.data?.items || [];

console.log(
  JSON.stringify(
    {
      ok: true,
      writes: false,
      forms: formItems.map((form) => ({
        id: form.id,
        title: form.title,
        locale: form.locale,
      })),
      formsEndpointSchema:
        formsOptionsResponse.data?.endpoints ||
        formsOptionsResponse.data?.schema ||
        formsOptionsResponse.data,
      relevantPages: pagesResponse.data
        .filter((page) =>
          ['contact', 'thanks', 'question'].includes(page.slug),
        )
        .map((page) => ({
          id: page.id,
          slug: page.slug,
          status: page.status,
          title: page.title?.raw || page.title?.rendered || '',
          parent: page.parent,
          link: page.link,
          modified: page.modified,
        })),
      siteKitRoutes,
    },
    null,
    2,
  ),
);
