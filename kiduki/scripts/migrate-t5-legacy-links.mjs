#!/usr/bin/env node

import crypto from 'node:crypto';
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
const temporarySnippetName = 'Codex T5 legacy link migration bridge';
const temporaryRoute = '/wp-json/kiduki-t5/v1/migrate-legacy-links';
const temporaryPurgeRoute =
  '/wp-json/kiduki-t5/v1/migrate-legacy-links-purge';
const legacyPageId = 37;
const contactPageId = 1741;
const expectedLegacyMenuIds = [1136, 1139];
const duplicateContactMenuId = 1742;

if (apply && (!backup || !backupConfirmed)) {
  throw new Error(
    'Refusing T5 link migration without --backup --backup-confirmed.',
  );
}

function buildTemporarySnippetCode() {
  return `
add_action( 'rest_api_init', function () {
\t$permission = function () {
\t\treturn current_user_can( 'manage_options' );
\t};
\t$legacy_url = 'https://kdkconslt-sngyouijm.com/question/';
\t$contact_url = 'https://kdkconslt-sngyouijm.com/contact/';
\t$target_options = array(
\t\t'theme_mods_emanon-premium',
\t\t'theme_mods_kiduki-child',
\t\t'widget_block',
\t);
\t$replace_recursive = function ( $value ) use ( &$replace_recursive, $legacy_url, $contact_url ) {
\t\tif ( is_string( $value ) ) {
\t\t\treturn str_replace( $legacy_url, $contact_url, $value );
\t\t}
\t\tif ( is_array( $value ) ) {
\t\t\tforeach ( $value as $key => $child ) {
\t\t\t\t$value[ $key ] = $replace_recursive( $child );
\t\t\t}
\t\t\treturn $value;
\t\t}
\t\tif ( is_object( $value ) ) {
\t\t\tforeach ( get_object_vars( $value ) as $key => $child ) {
\t\t\t\t$value->$key = $replace_recursive( $child );
\t\t\t}
\t\t}
\t\treturn $value;
\t};
\t$read_state = function () use ( $legacy_url, $target_options ) {
\t\tglobal $wpdb;
\t\t$like = '%' . $wpdb->esc_like( $legacy_url ) . '%';
\t\t$post_rows = $wpdb->get_results(
\t\t\t$wpdb->prepare(
\t\t\t\t"SELECT ID, post_type, post_status, post_title, post_content
\t\t\t\tFROM {$wpdb->posts}
\t\t\t\tWHERE post_type NOT IN ('revision', 'nav_menu_item')
\t\t\t\tAND post_content LIKE %s
\t\t\t\tORDER BY ID ASC",
\t\t\t\t$like
\t\t\t)
\t\t);
\t\t$posts = array_map(
\t\t\tfunction ( $row ) {
\t\t\t\treturn array(
\t\t\t\t\t'id'      => (int) $row->ID,
\t\t\t\t\t'type'    => $row->post_type,
\t\t\t\t\t'status'  => $row->post_status,
\t\t\t\t\t'title'   => $row->post_title,
\t\t\t\t\t'content' => $row->post_content,
\t\t\t\t);
\t\t\t},
\t\t\t$post_rows
\t\t);
\t\t$options = array();
\t\tforeach ( $target_options as $option_name ) {
\t\t\t$value = get_option( $option_name, null );
\t\t\tif ( null !== $value && false !== strpos( maybe_serialize( $value ), $legacy_url ) ) {
\t\t\t\t$options[ $option_name ] = $value;
\t\t\t}
\t\t}
\t\t$menus = array();
\t\tforeach ( array( 1136, 1139, 1742 ) as $item_id ) {
\t\t\t$item = wp_setup_nav_menu_item( get_post( $item_id ) );
\t\t\tif ( ! $item ) {
\t\t\t\t$menus[ (string) $item_id ] = null;
\t\t\t\tcontinue;
\t\t\t}
\t\t\t$menus[ (string) $item_id ] = array(
\t\t\t\t'id'          => (int) $item->ID,
\t\t\t\t'menu_id'     => (int) wp_get_object_terms( $item->ID, 'nav_menu', array( 'fields' => 'ids' ) )[0],
\t\t\t\t'title'       => $item->title,
\t\t\t\t'object_id'   => (int) $item->object_id,
\t\t\t\t'object'      => $item->object,
\t\t\t\t'type'        => $item->type,
\t\t\t\t'parent_id'   => (int) $item->menu_item_parent,
\t\t\t\t'menu_order'  => (int) $item->menu_order,
\t\t\t\t'url'         => $item->url,
\t\t\t\t'description' => $item->description,
\t\t\t\t'attr_title'  => $item->attr_title,
\t\t\t\t'target'      => $item->target,
\t\t\t\t'classes'     => array_values( array_filter( (array) $item->classes ) ),
\t\t\t\t'xfn'         => $item->xfn,
\t\t\t\t'status'      => $item->post_status,
\t\t\t);
\t\t}
\t\t$state = array(
\t\t\t'posts'   => $posts,
\t\t\t'options' => $options,
\t\t\t'menus'   => $menus,
\t\t);
\t\t$state['state_hash'] = hash( 'sha256', maybe_serialize( $state ) );
\t\treturn $state;
\t};
\t$validate_menu = function ( $state ) {
\t\tforeach ( array( 1136, 1139 ) as $item_id ) {
\t\t\t$item = $state['menus'][ (string) $item_id ];
\t\t\tif (
\t\t\t\t! is_array( $item )
\t\t\t\t|| 21 !== $item['menu_id']
\t\t\t\t|| 37 !== $item['object_id']
\t\t\t\t|| 'page' !== $item['object']
\t\t\t\t|| 'post_type' !== $item['type']
\t\t\t) {
\t\t\t\treturn new WP_Error(
\t\t\t\t\t'kiduki_t5_menu_mismatch',
\t\t\t\t\t'T5 legacy menu identity mismatch.',
\t\t\t\t\tarray( 'status' => 409, 'item_id' => $item_id )
\t\t\t\t);
\t\t\t}
\t\t}
\t\t$duplicate = $state['menus']['1742'];
\t\tif (
\t\t\t! is_array( $duplicate )
\t\t\t|| 21 !== $duplicate['menu_id']
\t\t\t|| 1741 !== $duplicate['object_id']
\t\t\t|| 'page' !== $duplicate['object']
\t\t\t|| 'post_type' !== $duplicate['type']
\t\t) {
\t\t\treturn new WP_Error(
\t\t\t\t'kiduki_t5_duplicate_menu_mismatch',
\t\t\t\t'T5 duplicate contact menu identity mismatch.',
\t\t\t\tarray( 'status' => 409 )
\t\t\t);
\t\t}
\t\treturn true;
\t};

\tregister_rest_route(
\t\t'kiduki-t5/v1',
\t\t'/migrate-legacy-links',
\t\tarray(
\t\t\tarray(
\t\t\t\t'methods'             => 'GET',
\t\t\t\t'permission_callback' => $permission,
\t\t\t\t'callback'            => $read_state,
\t\t\t),
\t\t\tarray(
\t\t\t\t'methods'             => 'POST',
\t\t\t\t'permission_callback' => $permission,
\t\t\t\t'callback'            => function ( WP_REST_Request $request ) use (
\t\t\t\t\t$legacy_url,
\t\t\t\t\t$contact_url,
\t\t\t\t\t$replace_recursive,
\t\t\t\t\t$read_state,
\t\t\t\t\t$validate_menu
\t\t\t\t) {
\t\t\t\t\t$before = $read_state();
\t\t\t\t\tif ( $request->get_param( 'state_hash' ) !== $before['state_hash'] ) {
\t\t\t\t\t\treturn new WP_Error(
\t\t\t\t\t\t\t'kiduki_t5_state_changed',
\t\t\t\t\t\t\t'T5 state changed after backup.',
\t\t\t\t\t\t\tarray( 'status' => 409 )
\t\t\t\t\t\t);
\t\t\t\t\t}
\t\t\t\t\t$menu_valid = $validate_menu( $before );
\t\t\t\t\tif ( is_wp_error( $menu_valid ) ) {
\t\t\t\t\t\treturn $menu_valid;
\t\t\t\t\t}
\t\t\t\t\tforeach ( $before['posts'] as $post ) {
\t\t\t\t\t\t$updated = wp_update_post(
\t\t\t\t\t\t\tarray(
\t\t\t\t\t\t\t\t'ID'           => $post['id'],
\t\t\t\t\t\t\t\t'post_content' => str_replace(
\t\t\t\t\t\t\t\t\t$legacy_url,
\t\t\t\t\t\t\t\t\t$contact_url,
\t\t\t\t\t\t\t\t\t$post['content']
\t\t\t\t\t\t\t\t),
\t\t\t\t\t\t\t),
\t\t\t\t\t\t\ttrue
\t\t\t\t\t\t);
\t\t\t\t\t\tif ( is_wp_error( $updated ) ) {
\t\t\t\t\t\t\treturn $updated;
\t\t\t\t\t\t}
\t\t\t\t\t}
\t\t\t\t\tforeach ( $before['options'] as $option_name => $value ) {
\t\t\t\t\t\tif ( ! update_option( $option_name, $replace_recursive( $value ) ) ) {
\t\t\t\t\t\t\t$current = get_option( $option_name, null );
\t\t\t\t\t\t\tif ( false !== strpos( maybe_serialize( $current ), $legacy_url ) ) {
\t\t\t\t\t\t\t\treturn new WP_Error(
\t\t\t\t\t\t\t\t\t'kiduki_t5_option_update_failed',
\t\t\t\t\t\t\t\t\t'T5 option update failed.',
\t\t\t\t\t\t\t\t\tarray( 'status' => 500, 'option_name' => $option_name )
\t\t\t\t\t\t\t\t);
\t\t\t\t\t\t\t}
\t\t\t\t\t\t}
\t\t\t\t\t}
\t\t\t\t\tforeach ( array( 1136, 1139 ) as $item_id ) {
\t\t\t\t\t\t$item = $before['menus'][ (string) $item_id ];
\t\t\t\t\t\t$result = wp_update_nav_menu_item(
\t\t\t\t\t\t\t$item['menu_id'],
\t\t\t\t\t\t\t$item_id,
\t\t\t\t\t\t\tarray(
\t\t\t\t\t\t\t\t'menu-item-db-id'       => $item_id,
\t\t\t\t\t\t\t\t'menu-item-object-id'   => 1741,
\t\t\t\t\t\t\t\t'menu-item-object'      => 'page',
\t\t\t\t\t\t\t\t'menu-item-parent-id'   => $item['parent_id'],
\t\t\t\t\t\t\t\t'menu-item-position'    => $item['menu_order'],
\t\t\t\t\t\t\t\t'menu-item-type'        => 'post_type',
\t\t\t\t\t\t\t\t'menu-item-title'       => $item['title'],
\t\t\t\t\t\t\t\t'menu-item-description' => $item['description'],
\t\t\t\t\t\t\t\t'menu-item-attr-title'  => $item['attr_title'],
\t\t\t\t\t\t\t\t'menu-item-target'      => $item['target'],
\t\t\t\t\t\t\t\t'menu-item-classes'     => implode( ' ', $item['classes'] ),
\t\t\t\t\t\t\t\t'menu-item-xfn'         => $item['xfn'],
\t\t\t\t\t\t\t\t'menu-item-status'      => 'publish',
\t\t\t\t\t\t\t)
\t\t\t\t\t\t);
\t\t\t\t\t\tif ( is_wp_error( $result ) ) {
\t\t\t\t\t\t\treturn $result;
\t\t\t\t\t\t}
\t\t\t\t\t}
\t\t\t\t\tif ( ! wp_delete_post( 1742, true ) ) {
\t\t\t\t\t\treturn new WP_Error(
\t\t\t\t\t\t\t'kiduki_t5_duplicate_delete_failed',
\t\t\t\t\t\t\t'T5 duplicate contact menu deletion failed.',
\t\t\t\t\t\t\tarray( 'status' => 500 )
\t\t\t\t\t\t);
\t\t\t\t\t}
\t\t\t\t\tif ( function_exists( 'w3tc_flush_all' ) ) {
\t\t\t\t\t\tw3tc_flush_all();
\t\t\t\t\t}
\t\t\t\t\t$after = $read_state();
\t\t\t\t\tif (
\t\t\t\t\t\t! empty( $after['posts'] )
\t\t\t\t\t\t|| ! empty( $after['options'] )
\t\t\t\t\t\t|| null !== $after['menus']['1742']
\t\t\t\t\t\t|| 1741 !== $after['menus']['1136']['object_id']
\t\t\t\t\t\t|| 1741 !== $after['menus']['1139']['object_id']
\t\t\t\t\t) {
\t\t\t\t\t\treturn new WP_Error(
\t\t\t\t\t\t\t'kiduki_t5_verification_failed',
\t\t\t\t\t\t\t'T5 post-update verification failed.',
\t\t\t\t\t\t\tarray( 'status' => 500 )
\t\t\t\t\t\t);
\t\t\t\t\t}
\t\t\t\t\treturn array(
\t\t\t\t\t\t'updated_post_ids'   => array_map(
\t\t\t\t\t\t\tfunction ( $post ) {
\t\t\t\t\t\t\t\treturn $post['id'];
\t\t\t\t\t\t\t},
\t\t\t\t\t\t\t$before['posts']
\t\t\t\t\t\t),
\t\t\t\t\t\t'updated_options'    => array_keys( $before['options'] ),
\t\t\t\t\t\t'updated_menu_ids'   => array( 1136, 1139 ),
\t\t\t\t\t\t'deleted_menu_id'    => 1742,
\t\t\t\t\t\t'legacy_links_left'  => 0,
\t\t\t\t\t);
\t\t\t\t},
\t\t\t),
\t\t)
\t);

\tregister_rest_route(
\t\t'kiduki-t5/v1',
\t\t'/migrate-legacy-links-purge',
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

const env = getWordPressEnv();
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
    `A previous temporary T5 migration snippet still exists: ${duplicate.id}`,
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
      desc: 'Temporary allowlisted T5 link migration with dry-run and backup gates.',
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

  const before = await wpRequest(env, 'GET', temporaryRoute);
  const legacyMenuIds = expectedLegacyMenuIds.filter(
    (id) => before.data.menus[String(id)]?.object_id === legacyPageId,
  );
  const duplicateIsExpected =
    before.data.menus[String(duplicateContactMenuId)]?.object_id ===
    contactPageId;
  if (
    legacyMenuIds.length !== expectedLegacyMenuIds.length ||
    !duplicateIsExpected
  ) {
    throw new Error('T5 menu preflight did not match the inspected structure.');
  }

  const dryRunSummary = {
    postCount: before.data.posts.length,
    postIds: before.data.posts.map((post) => post.id),
    options: Object.keys(before.data.options),
    menuPlan: {
      repointToContact: expectedLegacyMenuIds,
      removeDuplicate: duplicateContactMenuId,
    },
    stateHash: before.data.state_hash,
  };

  if (!apply) {
    const purge = await wpRequest(env, 'POST', temporaryPurgeRoute, {
      snippet_id: snippetId,
    });
    purged = purge.data.deleted === true;
    if (!purged) {
      throw new Error('Temporary T5 migration dry-run bridge was not purged.');
    }
    console.log(
      JSON.stringify(
        {
          ok: true,
          mode: 'dry-run',
          persistentWrites: false,
          ...dryRunSummary,
          temporarySnippetPurged: true,
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
    `wp-t5-legacy-links-before-${safeStamp()}.json`,
  );
  const backupDocument = {
    task: 'T5 legacy link migration',
    createdAt: new Date().toISOString(),
    sha256: crypto
      .createHash('sha256')
      .update(JSON.stringify(before.data))
      .digest('hex'),
    state: before.data,
  };
  fs.writeFileSync(
    backupPath,
    `${JSON.stringify(backupDocument, null, 2)}\n`,
    { mode: 0o600 },
  );
  fs.chmodSync(backupPath, 0o600);

  const updated = await wpRequest(env, 'POST', temporaryRoute, {
    state_hash: before.data.state_hash,
  });
  if (updated.data.legacy_links_left !== 0) {
    throw new Error('T5 link migration response failed verification.');
  }

  const purge = await wpRequest(env, 'POST', temporaryPurgeRoute, {
    snippet_id: snippetId,
  });
  purged = purge.data.deleted === true;
  if (!purged) {
    throw new Error('Temporary T5 migration bridge was not purged.');
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: 'apply',
        backupPath: path.relative(process.cwd(), backupPath),
        backupSha256: backupDocument.sha256,
        result: updated.data,
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
