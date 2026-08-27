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
const temporarySnippetName = 'Codex KIDUKI two pillar footer';
const temporaryRoute = '/wp-json/kiduki-footer/v1/widgets';
const temporaryPurgeRoute = '/wp-json/kiduki-footer/v1/purge';

if (apply && (!backup || !backupConfirmed)) {
  throw new Error('Refusing footer update without --backup --backup-confirmed.');
}

const centerContent = `<!-- wp:columns -->
<div class="wp-block-columns"><!-- wp:column -->
<div class="wp-block-column"><!-- wp:heading {"level":6} -->
<h6 class="wp-block-heading"><a href="https://kdkconslt-sngyouijm.com/office/">事務所について</a></h6>
<!-- /wp:heading -->
<!-- wp:heading {"level":6} -->
<h6 class="wp-block-heading"><a href="https://kdkconslt-sngyouijm.com/field/">睡眠に特化した産業医業務</a></h6>
<!-- /wp:heading --></div>
<!-- /wp:column -->
<!-- wp:column -->
<div class="wp-block-column"><!-- wp:heading {"level":6} -->
<h6 class="wp-block-heading"><a href="https://kdkconslt-sngyouijm.com/service/cloud/">産業衛生DX・Casetra</a></h6>
<!-- /wp:heading -->
<!-- wp:heading {"level":6} -->
<h6 class="wp-block-heading"><a href="https://kdkconslt-sngyouijm.com/service/return-to-work-support/">単発相談</a></h6>
<!-- /wp:heading --></div>
<!-- /wp:column --></div>
<!-- /wp:columns -->`;

const rightContent = `<!-- wp:columns -->
<div class="wp-block-columns"><!-- wp:column -->
<div class="wp-block-column"><!-- wp:heading {"level":6} -->
<h6 class="wp-block-heading"><strong><a href="https://kdkconslt-sngyouijm.com/special/">記事</a></strong></h6>
<!-- /wp:heading -->
<!-- wp:heading {"level":6} -->
<h6 class="wp-block-heading"><strong><a href="https://kdkconslt-sngyouijm.com/contact/">お問い合わせ</a></strong></h6>
<!-- /wp:heading --></div>
<!-- /wp:column --></div>
<!-- /wp:columns -->`;

function phpString(value) {
  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

const snippetCode = `
add_action( 'rest_api_init', function () {
\t$permission = function () { return current_user_can( 'manage_options' ); };
\t$targets = array( 165 => ${phpString(centerContent)}, 178 => ${phpString(rightContent)} );
\t$read_state = function () use ( $targets ) {
\t\t$widgets = get_option( 'widget_block', array() );
\t\t$items = array();
\t\tforeach ( $targets as $id => $content ) {
\t\t\t$items[ (string) $id ] = array(
\t\t\t\t'current' => $widgets[ $id ]['content'] ?? null,
\t\t\t\t'target'  => $content,
\t\t\t);
\t\t}
\t\treturn array(
\t\t\t'items'      => $items,
\t\t\t'state_hash' => hash( 'sha256', maybe_serialize( $widgets ) ),
\t\t);
\t};
\tregister_rest_route( 'kiduki-footer/v1', '/widgets', array(
\t\tarray( 'methods' => 'GET', 'permission_callback' => $permission, 'callback' => $read_state ),
\t\tarray(
\t\t\t'methods' => 'POST',
\t\t\t'permission_callback' => $permission,
\t\t\t'callback' => function ( WP_REST_Request $request ) use ( $targets, $read_state ) {
\t\t\t\t$before = $read_state();
\t\t\t\tif ( $request->get_param( 'state_hash' ) !== $before['state_hash'] ) {
\t\t\t\t\treturn new WP_Error( 'kiduki_footer_changed', 'Footer widgets changed after backup.', array( 'status' => 409 ) );
\t\t\t\t}
\t\t\t\t$widgets = get_option( 'widget_block', array() );
\t\t\t\tforeach ( $targets as $id => $content ) {
\t\t\t\t\tif ( ! isset( $widgets[ $id ] ) ) {
\t\t\t\t\t\treturn new WP_Error( 'kiduki_footer_widget_missing', 'Expected footer widget is missing.', array( 'status' => 409, 'widget_id' => $id ) );
\t\t\t\t\t}
\t\t\t\t\t$widgets[ $id ]['content'] = $content;
\t\t\t\t}
\t\t\t\tupdate_option( 'widget_block', $widgets );
\t\t\t\tif ( function_exists( 'w3tc_flush_all' ) ) w3tc_flush_all();
\t\t\t\treturn $read_state();
\t\t\t},
\t\t),
\t) );
\tregister_rest_route( 'kiduki-footer/v1', '/purge', array(
\t\t'methods' => 'POST',
\t\t'permission_callback' => $permission,
\t\t'callback' => function ( WP_REST_Request $request ) {
\t\t\t$id = absint( $request->get_param( 'snippet_id' ) );
\t\t\treturn array( 'deleted' => $id > 0 && \\Code_Snippets\\delete_snippet( $id, false ) );
\t\t},
\t) );
} );
`;

const env = getWordPressEnv();
const snippets = await wpRequest(env, 'GET', '/wp-json/code-snippets/v1/snippets?context=edit&per_page=100');
if (snippets.data.some((snippet) => snippet.name === temporarySnippetName)) {
  throw new Error('A previous temporary footer snippet still exists.');
}

let snippetId = null;
let purged = false;
try {
  const created = await wpRequest(env, 'POST', '/wp-json/code-snippets/v1/snippets', {
    name: temporarySnippetName,
    desc: 'Temporary allowlisted footer updater with dry-run and backup gates.',
    code: snippetCode,
    tags: ['codex', 'temporary', 'footer'],
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
  if (!before.data.items?.['165']?.current || !before.data.items?.['178']?.current) {
    throw new Error('Footer preflight did not find the expected block widgets.');
  }

  if (!apply) {
    const purge = await wpRequest(env, 'POST', temporaryPurgeRoute, { snippet_id: snippetId });
    purged = purge.data.deleted === true;
    if (!purged) throw new Error('Temporary footer dry-run bridge did not purge itself.');
    console.log(JSON.stringify({
      ok: true,
      mode: 'dry-run',
      persistentWrites: false,
      comparison: before.data.items,
      temporarySnippetPurged: true,
    }, null, 2));
    process.exit(0);
  }

  const backupDir = path.resolve('backups');
  fs.mkdirSync(backupDir, { recursive: true, mode: 0o700 });
  fs.chmodSync(backupDir, 0o700);
  const backupPath = path.join(backupDir, `wp-footer-widgets-before-two-pillars-${safeStamp()}.json`);
  fs.writeFileSync(backupPath, `${JSON.stringify(before.data, null, 2)}\n`, { mode: 0o600 });
  fs.chmodSync(backupPath, 0o600);

  const after = await wpRequest(env, 'POST', temporaryRoute, { state_hash: before.data.state_hash });
  for (const id of ['165', '178']) {
    if (after.data.items[id].current !== after.data.items[id].target) {
      throw new Error(`Footer verification failed for block ${id}. Backup: ${backupPath}`);
    }
  }
  const purge = await wpRequest(env, 'POST', temporaryPurgeRoute, { snippet_id: snippetId });
  purged = purge.data.deleted === true;
  if (!purged) throw new Error('Temporary footer bridge did not purge itself.');
  console.log(JSON.stringify({ ok: true, mode: 'apply', backupPath, temporarySnippetPurged: true }, null, 2));
} finally {
  if (snippetId && !purged) {
    try { await wpRequest(env, 'POST', `/wp-json/code-snippets/v1/snippets/${snippetId}/deactivate`, {}); } catch {}
    try { await wpRequest(env, 'POST', `/wp-json/code-snippets/v1/snippets/${snippetId}`, { code: '', active: false }); } catch {}
    try { await wpRequest(env, 'DELETE', `/wp-json/code-snippets/v1/snippets/${snippetId}`, {}); } catch {}
  }
}
