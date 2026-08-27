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
const menuId = 21;
const temporarySnippetName = 'Codex KIDUKI two pillar navigation';
const temporaryRoute = '/wp-json/kiduki-navigation/v1/menu';
const temporaryPurgeRoute = '/wp-json/kiduki-navigation/v1/purge';

const desired = [
  { id: 519, objectId: 24, title: '事務所について', position: 1 },
  { id: 557, objectId: 31, title: '睡眠に特化した産業医業務', position: 2 },
  { id: 1039, objectId: 166, title: '産業衛生DX・Casetra', position: 3 },
  { id: 1138, objectId: 164, title: '単発相談', position: 4 },
  { id: 1031, objectId: 1030, title: '記事', position: 5 },
  { id: 1136, objectId: 1741, title: 'お問い合わせ', position: 6 },
];
const obsoleteIds = [518, 1139];

if (apply && (!backup || !backupConfirmed)) {
  throw new Error(
    'Refusing navigation update without --backup --backup-confirmed.',
  );
}

function buildTemporarySnippetCode() {
  return `
add_action( 'rest_api_init', function () {
\t$permission = function () {
\t\treturn current_user_can( 'manage_options' );
\t};
\t$menu_id = ${menuId};
\t$read_state = function () use ( $menu_id ) {
\t\t$items = wp_get_nav_menu_items( $menu_id ) ?: array();
\t\t$state = array_map(
\t\t\tfunction ( $item ) {
\t\t\t\treturn array(
\t\t\t\t\t'id'          => (int) $item->ID,
\t\t\t\t\t'title'       => $item->title,
\t\t\t\t\t'object_id'   => (int) $item->object_id,
\t\t\t\t\t'object'      => $item->object,
\t\t\t\t\t'type'        => $item->type,
\t\t\t\t\t'parent_id'   => (int) $item->menu_item_parent,
\t\t\t\t\t'menu_order'  => (int) $item->menu_order,
\t\t\t\t\t'url'         => $item->url,
\t\t\t\t\t'description' => $item->description,
\t\t\t\t\t'attr_title'  => $item->attr_title,
\t\t\t\t\t'target'      => $item->target,
\t\t\t\t\t'classes'     => array_values( array_filter( (array) $item->classes ) ),
\t\t\t\t\t'xfn'         => $item->xfn,
\t\t\t\t\t'status'      => $item->post_status,
\t\t\t\t);
\t\t\t},
\t\t\t$items
\t\t);
\t\treturn array(
\t\t\t'menu_id'    => $menu_id,
\t\t\t'items'      => $state,
\t\t\t'state_hash' => hash( 'sha256', maybe_serialize( $state ) ),
\t\t);
\t};

\tregister_rest_route(
\t\t'kiduki-navigation/v1',
\t\t'/menu',
\t\tarray(
\t\t\tarray(
\t\t\t\t'methods'             => 'GET',
\t\t\t\t'permission_callback' => $permission,
\t\t\t\t'callback'            => $read_state,
\t\t\t),
\t\t\tarray(
\t\t\t\t'methods'             => 'POST',
\t\t\t\t'permission_callback' => $permission,
\t\t\t\t'callback'            => function ( WP_REST_Request $request ) use ( $menu_id, $read_state ) {
\t\t\t\t\t$before = $read_state();
\t\t\t\t\tif ( $request->get_param( 'state_hash' ) !== $before['state_hash'] ) {
\t\t\t\t\t\treturn new WP_Error( 'kiduki_navigation_changed', 'Navigation changed after backup.', array( 'status' => 409 ) );
\t\t\t\t\t}
\t\t\t\t\t$desired = array(
${desired.map((item) => `\t\t\t\t\t\t${item.id} => array( 'object_id' => ${item.objectId}, 'title' => '${item.title}', 'position' => ${item.position} ),`).join('\n')}
\t\t\t\t\t);
\t\t\t\t\t$by_id = array();
\t\t\t\t\tforeach ( $before['items'] as $item ) {
\t\t\t\t\t\t$by_id[ $item['id'] ] = $item;
\t\t\t\t\t}
\t\t\t\t\tforeach ( $desired as $item_id => $target ) {
\t\t\t\t\t\tif ( ! isset( $by_id[ $item_id ] ) ) {
\t\t\t\t\t\t\treturn new WP_Error( 'kiduki_navigation_item_missing', 'Expected menu item is missing.', array( 'status' => 409, 'item_id' => $item_id ) );
\t\t\t\t\t\t}
\t\t\t\t\t\t$item = $by_id[ $item_id ];
\t\t\t\t\t\t$result = wp_update_nav_menu_item(
\t\t\t\t\t\t\t$menu_id,
\t\t\t\t\t\t\t$item_id,
\t\t\t\t\t\t\tarray(
\t\t\t\t\t\t\t\t'menu-item-db-id'       => $item_id,
\t\t\t\t\t\t\t\t'menu-item-object-id'   => $target['object_id'],
\t\t\t\t\t\t\t\t'menu-item-object'      => 'page',
\t\t\t\t\t\t\t\t'menu-item-parent-id'   => 0,
\t\t\t\t\t\t\t\t'menu-item-position'    => $target['position'],
\t\t\t\t\t\t\t\t'menu-item-type'        => 'post_type',
\t\t\t\t\t\t\t\t'menu-item-title'       => $target['title'],
\t\t\t\t\t\t\t\t'menu-item-description' => '',
\t\t\t\t\t\t\t\t'menu-item-attr-title'  => '',
\t\t\t\t\t\t\t\t'menu-item-target'      => '',
\t\t\t\t\t\t\t\t'menu-item-classes'     => '',
\t\t\t\t\t\t\t\t'menu-item-xfn'         => '',
\t\t\t\t\t\t\t\t'menu-item-status'      => 'publish',
\t\t\t\t\t\t\t)
\t\t\t\t\t\t);
\t\t\t\t\t\tif ( is_wp_error( $result ) ) {
\t\t\t\t\t\t\treturn $result;
\t\t\t\t\t\t}
\t\t\t\t\t}
\t\t\t\t\tforeach ( array( ${obsoleteIds.join(', ')} ) as $obsolete_id ) {
\t\t\t\t\t\tif ( isset( $by_id[ $obsolete_id ] ) && ! wp_delete_post( $obsolete_id, true ) ) {
\t\t\t\t\t\t\treturn new WP_Error( 'kiduki_navigation_delete_failed', 'Could not remove obsolete menu item.', array( 'status' => 500, 'item_id' => $obsolete_id ) );
\t\t\t\t\t\t}
\t\t\t\t\t}
\t\t\t\t\tif ( function_exists( 'w3tc_flush_all' ) ) {
\t\t\t\t\t\tw3tc_flush_all();
\t\t\t\t\t}
\t\t\t\t\treturn $read_state();
\t\t\t\t},
\t\t\t),
\t\t)
\t);

\tregister_rest_route(
\t\t'kiduki-navigation/v1',
\t\t'/purge',
\t\tarray(
\t\t\t'methods'             => 'POST',
\t\t\t'permission_callback' => $permission,
\t\t\t'callback'            => function ( WP_REST_Request $request ) {
\t\t\t\t$id = absint( $request->get_param( 'snippet_id' ) );
\t\t\t\treturn array( 'deleted' => $id > 0 && \\Code_Snippets\\delete_snippet( $id, false ) );
\t\t\t},
\t\t)
\t);
} );
`;
}

function validateBefore(items) {
  const expected = new Map([
    [519, 24], [557, 31], [518, 29], [1039, 1038],
    [1031, 1030], [1136, 1741], [1138, 39], [1139, 1741],
  ]);
  const actual = new Map(items.map((item) => [Number(item.id), Number(item.object_id)]));
  for (const [id, objectId] of expected) {
    if (actual.get(id) !== objectId) {
      throw new Error(`Navigation preflight mismatch for item ${id}.`);
    }
  }
}

function validateAfter(items) {
  if (items.length !== desired.length) {
    throw new Error(`Expected ${desired.length} menu items, found ${items.length}.`);
  }
  const actual = new Map(items.map((item) => [Number(item.id), item]));
  for (const target of desired) {
    const item = actual.get(target.id);
    if (
      !item ||
      Number(item.object_id) !== target.objectId ||
      item.title !== target.title ||
      Number(item.parent_id) !== 0 ||
      Number(item.menu_order) !== target.position
    ) {
      throw new Error(`Navigation verification failed for item ${target.id}.`);
    }
  }
}

const env = getWordPressEnv();
const snippets = await wpRequest(
  env,
  'GET',
  '/wp-json/code-snippets/v1/snippets?context=edit&per_page=100',
);
if (snippets.data.some((snippet) => snippet.name === temporarySnippetName)) {
  throw new Error('A previous temporary navigation snippet still exists.');
}

let snippetId = null;
let purged = false;
try {
  const created = await wpRequest(env, 'POST', '/wp-json/code-snippets/v1/snippets', {
    name: temporarySnippetName,
    desc: 'Temporary allowlisted navigation updater with dry-run and backup gates.',
    code: buildTemporarySnippetCode(),
    tags: ['codex', 'temporary', 'navigation'],
    scope: 'global',
    active: false,
    priority: 10,
    network: false,
    shared_network: false,
  });
  snippetId = Number(created.data.id);
  if (!snippetId) throw new Error('Code Snippets did not return a snippet id.');
  await wpRequest(env, 'POST', `/wp-json/code-snippets/v1/snippets/${snippetId}/activate`, {});

  const before = await wpRequest(env, 'GET', temporaryRoute);
  validateBefore(before.data.items || []);

  if (!apply) {
    const purge = await wpRequest(env, 'POST', temporaryPurgeRoute, { snippet_id: snippetId });
    purged = purge.data.deleted === true;
    if (!purged) throw new Error('Temporary dry-run navigation bridge did not purge itself.');
    console.log(JSON.stringify({
      ok: true,
      mode: 'dry-run',
      persistentWrites: false,
      before: before.data.items,
      desired,
      obsoleteIds,
      temporarySnippetPurged: true,
    }, null, 2));
    process.exit(0);
  }

  const backupDir = path.resolve('backups');
  fs.mkdirSync(backupDir, { recursive: true, mode: 0o700 });
  fs.chmodSync(backupDir, 0o700);
  const backupPath = path.join(backupDir, `wp-menu-21-before-two-pillars-${safeStamp()}.json`);
  fs.writeFileSync(backupPath, `${JSON.stringify(before.data, null, 2)}\n`, { mode: 0o600 });
  fs.chmodSync(backupPath, 0o600);

  const after = await wpRequest(env, 'POST', temporaryRoute, {
    state_hash: before.data.state_hash,
  });
  validateAfter(after.data.items || []);

  const purge = await wpRequest(env, 'POST', temporaryPurgeRoute, { snippet_id: snippetId });
  purged = purge.data.deleted === true;
  if (!purged) throw new Error('Temporary navigation bridge did not purge itself.');

  console.log(JSON.stringify({
    ok: true,
    mode: 'apply',
    backupPath,
    items: after.data.items,
    temporarySnippetPurged: true,
  }, null, 2));
} finally {
  if (snippetId && !purged) {
    try { await wpRequest(env, 'POST', `/wp-json/code-snippets/v1/snippets/${snippetId}/deactivate`, {}); } catch {}
    try { await wpRequest(env, 'POST', `/wp-json/code-snippets/v1/snippets/${snippetId}`, { code: '', active: false }); } catch {}
    try { await wpRequest(env, 'DELETE', `/wp-json/code-snippets/v1/snippets/${snippetId}`, {}); } catch {}
  }
}
