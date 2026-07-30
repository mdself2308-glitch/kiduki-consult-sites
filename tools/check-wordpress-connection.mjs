import { getWordPressEnv, wpRequest } from './wordpress-rest-utils.mjs';
import { siteConfig } from './kdk-site-config.mjs';

const env = getWordPressEnv();

const [me, settings, pages] = await Promise.all([
  wpRequest(env, 'GET', '/wp-json/wp/v2/users/me?context=edit'),
  wpRequest(env, 'GET', '/wp-json/wp/v2/settings'),
  wpRequest(
    env,
    'GET',
    '/wp-json/wp/v2/pages?context=edit&per_page=100&_fields=id,slug,status,title,modified,parent',
  ),
]);

const payload = {
  ok: true,
  site: siteConfig.wordpressUrl,
  authenticatedUser: {
    id: me.data.id,
    username: me.data.username || me.data.slug,
    roles: me.data.roles || [],
    capabilities: {
      editPages: Boolean(me.data.capabilities?.edit_pages),
      editPosts: Boolean(me.data.capabilities?.edit_posts),
      publishPages: Boolean(me.data.capabilities?.publish_pages),
      publishPosts: Boolean(me.data.capabilities?.publish_posts),
    },
  },
  settings: {
    title: settings.data.title,
    url: settings.data.url,
    home: settings.data.home,
    pageOnFront: settings.data.page_on_front,
    pageForPosts: settings.data.page_for_posts,
  },
  counts: {
    pagesVisibleToAuthenticatedUser: pages.data.length,
  },
};

console.log(JSON.stringify(payload, null, 2));

