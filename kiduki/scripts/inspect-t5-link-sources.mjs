#!/usr/bin/env node

import {
  getWordPressEnv,
  wpRequest,
} from '../../tools/wordpress-rest-utils.mjs';

const temporarySnippetName = 'Codex T5 legacy link inspection bridge';
const temporaryRoute = '/wp-json/kiduki-t5/v1/legacy-links';
const temporaryPurgeRoute = '/wp-json/kiduki-t5/v1/legacy-links-purge';
const env = getWordPressEnv();

function buildTemporarySnippetCode() {
  return `
add_action( 'rest_api_init', function () {
\t$permission = function () {
\t\treturn current_user_can( 'manage_options' );
\t};
\t$markers = array(
\t\t'reserve.kdkconslt-sngyouijm.com',
\t\t'kdkconslt-sngyouijm.com/question/',
\t);
\t$detect_markers = function ( $value ) use ( $markers ) {
\t\t$matched = array();
\t\tforeach ( $markers as $marker ) {
\t\t\tif ( false !== strpos( (string) $value, $marker ) ) {
\t\t\t\t$matched[] = $marker;
\t\t\t}
\t\t}
\t\treturn $matched;
\t};

\tregister_rest_route(
\t\t'kiduki-t5/v1',
\t\t'/legacy-links',
\t\tarray(
\t\t\t'methods'             => 'GET',
\t\t\t'permission_callback' => $permission,
\t\t\t'callback'            => function () use ( $markers, $detect_markers ) {
\t\t\t\tglobal $wpdb;
\t\t\t\t$post_like = array_map(
\t\t\t\t\tfunction ( $marker ) use ( $wpdb ) {
\t\t\t\t\t\treturn '%' . $wpdb->esc_like( $marker ) . '%';
\t\t\t\t\t},
\t\t\t\t\t$markers
\t\t\t\t);
\t\t\t\t$post_rows = $wpdb->get_results(
\t\t\t\t\t$wpdb->prepare(
\t\t\t\t\t\t"SELECT ID, post_type, post_status, post_title, post_content
\t\t\t\t\t\tFROM {$wpdb->posts}
\t\t\t\t\t\tWHERE post_type NOT IN ('revision', 'nav_menu_item')
\t\t\t\t\t\tAND (post_content LIKE %s OR post_content LIKE %s)
\t\t\t\t\t\tORDER BY ID ASC",
\t\t\t\t\t\t$post_like[0],
\t\t\t\t\t\t$post_like[1]
\t\t\t\t\t)
\t\t\t\t);
\t\t\t\t$post_matches = array_map(
\t\t\t\t\tfunction ( $row ) use ( $detect_markers ) {
\t\t\t\t\t\treturn array(
\t\t\t\t\t\t\t'id'      => (int) $row->ID,
\t\t\t\t\t\t\t'type'    => $row->post_type,
\t\t\t\t\t\t\t'status'  => $row->post_status,
\t\t\t\t\t\t\t'title'   => $row->post_title,
\t\t\t\t\t\t\t'url'     => get_permalink( $row->ID ),
\t\t\t\t\t\t\t'markers' => $detect_markers( $row->post_content ),
\t\t\t\t\t\t);
\t\t\t\t\t},
\t\t\t\t\t$post_rows
\t\t\t\t);

\t\t\t\t$meta_rows = $wpdb->get_results(
\t\t\t\t\t$wpdb->prepare(
\t\t\t\t\t\t"SELECT pm.post_id, pm.meta_key, pm.meta_value,
\t\t\t\t\t\tp.post_type, p.post_status, p.post_title
\t\t\t\t\t\tFROM {$wpdb->postmeta} pm
\t\t\t\t\t\tLEFT JOIN {$wpdb->posts} p ON p.ID = pm.post_id
\t\t\t\t\t\tWHERE pm.meta_value LIKE %s OR pm.meta_value LIKE %s
\t\t\t\t\t\tORDER BY pm.post_id ASC",
\t\t\t\t\t\t$post_like[0],
\t\t\t\t\t\t$post_like[1]
\t\t\t\t\t)
\t\t\t\t);
\t\t\t\t$meta_matches = array_map(
\t\t\t\t\tfunction ( $row ) use ( $detect_markers ) {
\t\t\t\t\t\treturn array(
\t\t\t\t\t\t\t'post_id' => (int) $row->post_id,
\t\t\t\t\t\t\t'meta_key' => $row->meta_key,
\t\t\t\t\t\t\t'type'    => $row->post_type,
\t\t\t\t\t\t\t'status'  => $row->post_status,
\t\t\t\t\t\t\t'title'   => $row->post_title,
\t\t\t\t\t\t\t'markers' => $detect_markers( $row->meta_value ),
\t\t\t\t\t\t);
\t\t\t\t\t},
\t\t\t\t\t$meta_rows
\t\t\t\t);

\t\t\t\t$option_rows = $wpdb->get_results(
\t\t\t\t\t$wpdb->prepare(
\t\t\t\t\t\t"SELECT option_name, option_value
\t\t\t\t\t\tFROM {$wpdb->options}
\t\t\t\t\t\tWHERE option_value LIKE %s OR option_value LIKE %s
\t\t\t\t\t\tORDER BY option_name ASC
\t\t\t\t\t\tLIMIT 100",
\t\t\t\t\t\t$post_like[0],
\t\t\t\t\t\t$post_like[1]
\t\t\t\t\t)
\t\t\t\t);
\t\t\t\t$option_matches = array_map(
\t\t\t\t\tfunction ( $row ) use ( $detect_markers ) {
\t\t\t\t\t\treturn array(
\t\t\t\t\t\t\t'option_name' => $row->option_name,
\t\t\t\t\t\t\t'markers'     => $detect_markers( $row->option_value ),
\t\t\t\t\t\t);
\t\t\t\t\t},
\t\t\t\t\t$option_rows
\t\t\t\t);

\t\t\t\t$menu_matches = array();
\t\t\t\tforeach ( wp_get_nav_menus() as $menu ) {
\t\t\t\t\tforeach ( wp_get_nav_menu_items( $menu->term_id ) as $item ) {
\t\t\t\t\t\t$item_markers = $detect_markers( $item->url );
\t\t\t\t\t\tif (
\t\t\t\t\t\t\tin_array( (int) $item->object_id, array( 37, 1741 ), true )
\t\t\t\t\t\t\t|| $item_markers
\t\t\t\t\t\t) {
\t\t\t\t\t\t\t$menu_matches[] = array(
\t\t\t\t\t\t\t\t'menu_id'   => (int) $menu->term_id,
\t\t\t\t\t\t\t\t'menu_name' => $menu->name,
\t\t\t\t\t\t\t\t'item_id'   => (int) $item->ID,
\t\t\t\t\t\t\t\t'title'     => $item->title,
\t\t\t\t\t\t\t\t'type'      => $item->type,
\t\t\t\t\t\t\t\t'object'    => $item->object,
\t\t\t\t\t\t\t\t'object_id' => (int) $item->object_id,
\t\t\t\t\t\t\t\t'menu_order' => (int) $item->menu_order,
\t\t\t\t\t\t\t\t'parent_id'  => (int) $item->menu_item_parent,
\t\t\t\t\t\t\t\t'url'       => $item->url,
\t\t\t\t\t\t\t\t'markers'   => $item_markers,
\t\t\t\t\t\t\t);
\t\t\t\t\t\t}
\t\t\t\t\t}
\t\t\t\t}

\t\t\t\treturn array(
\t\t\t\t\t'post_content_matches' => $post_matches,
\t\t\t\t\t'postmeta_matches'     => $meta_matches,
\t\t\t\t\t'option_matches'       => $option_matches,
\t\t\t\t\t'menu_matches'         => $menu_matches,
\t\t\t\t\t'menu_locations'       => get_nav_menu_locations(),
\t\t\t\t);
\t\t\t},
\t\t)
\t);

\tregister_rest_route(
\t\t'kiduki-t5/v1',
\t\t'/legacy-links-purge',
\t\tarray(
\t\t\t'methods'             => 'POST',
\t\t\t'permission_callback' => $permission,
\t\t\t'callback'            => function ( WP_REST_Request $request ) {
\t\t\t\t$id = absint( $request->get_param( 'snippet_id' ) );
\t\t\t\treturn array(
\t\t\t\t\t'deleted' => $id > 0 && \\Code_Snippets\\delete_snippet( $id, false ),
\t\t\t\t);
\t\t\t},
\t\t)
\t);
} );
`;
}

const snippets = await wpRequest(
  env,
  'GET',
  '/wp-json/code-snippets/v1/snippets?context=edit&per_page=100',
);
const duplicate = snippets.data.find(
  (snippet) => snippet.name === temporarySnippetName,
);
if (duplicate) {
  throw new Error(
    `A previous temporary T5 inspection snippet still exists: ${duplicate.id}`,
  );
}

let snippetId = null;
let purged = false;

try {
  const created = await wpRequest(
    env,
    'POST',
    '/wp-json/code-snippets/v1/snippets',
    {
      name: temporarySnippetName,
      desc: 'Temporary read-only legacy-link inspection bridge. Remove immediately after use.',
      code: buildTemporarySnippetCode(),
      tags: ['codex', 'temporary', 't5'],
      scope: 'global',
      active: false,
      priority: 10,
      network: false,
      shared_network: false,
    },
  );
  snippetId = Number(created.data.id);
  if (!snippetId) {
    throw new Error('Code Snippets did not return a snippet id.');
  }
  await wpRequest(
    env,
    'POST',
    `/wp-json/code-snippets/v1/snippets/${snippetId}/activate`,
    {},
  );
  const state = await wpRequest(env, 'GET', temporaryRoute);
  const purge = await wpRequest(env, 'POST', temporaryPurgeRoute, {
    snippet_id: snippetId,
  });
  purged = purge.data.deleted === true;
  if (!purged) {
    throw new Error('Temporary T5 inspection bridge did not purge itself.');
  }
  console.log(
    JSON.stringify(
      {
        ok: true,
        persistentWrites: false,
        ...state.data,
        temporarySnippetPurged: true,
      },
      null,
      2,
    ),
  );
} finally {
  if (snippetId && !purged) {
    try {
      await wpRequest(
        env,
        'POST',
        `/wp-json/code-snippets/v1/snippets/${snippetId}/deactivate`,
        {},
      );
    } catch {
      // Best-effort cleanup continues below.
    }
    try {
      await wpRequest(
        env,
        'DELETE',
        `/wp-json/code-snippets/v1/snippets/${snippetId}`,
      );
    } catch {
      console.error(
        JSON.stringify(
          {
            ok: false,
            temporarySnippetCleanup: {
              id: snippetId,
              deleted: false,
            },
          },
          null,
          2,
        ),
      );
      process.exitCode = 1;
    }
  }
}
