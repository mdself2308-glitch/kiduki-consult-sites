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
const temporarySnippetName = 'Codex KIDUKI service title visibility bridge';
const temporaryRoute = '/wp-json/kiduki-seo/v1/service-title-visibility';
const temporaryPurgeRoute = '/wp-json/kiduki-seo/v1/service-title-visibility-bridge';

if (apply && (!backup || !backupConfirmed)) {
  throw new Error(
    'Refusing service title visibility update without --backup --backup-confirmed.',
  );
}

function buildTemporarySnippetCode() {
  const write = apply ? 'true' : 'false';
  return `
add_action( 'rest_api_init', function () {
\t$permission = function () {
\t\treturn current_user_can( 'manage_options' );
\t};
\t$read_state = function () {
\t\t$post = get_post( 29 );
\t\t$state = array(
\t\t\t'id'         => $post ? (int) $post->ID : 0,
\t\t\t'slug'       => $post ? $post->post_name : '',
\t\t\t'status'     => $post ? $post->post_status : '',
\t\t\t'title'      => $post ? $post->post_title : '',
\t\t\t'hide_title' => (string) get_post_meta( 29, 'emanon_hide_title', true ),
\t\t\t'permalink'  => get_permalink( 29 ),
\t\t);
\t\t$state['state_hash'] = hash( 'sha256', wp_json_encode( $state ) );
\t\treturn $state;
\t};

\tregister_rest_route(
\t\t'kiduki-seo/v1',
\t\t'/service-title-visibility',
\t\tarray(
\t\t\tarray(
\t\t\t\t'methods'             => 'GET',
\t\t\t\t'permission_callback' => $permission,
\t\t\t\t'callback'            => $read_state,
\t\t\t),
\t\t\tarray(
\t\t\t\t'methods'             => 'POST',
\t\t\t\t'permission_callback' => $permission,
\t\t\t\t'callback'            => function ( WP_REST_Request $request ) use ( $read_state ) {
\t\t\t\t\t$before = $read_state();
\t\t\t\t\tif ( $request->get_param( 'state_hash' ) !== $before['state_hash'] ) {
\t\t\t\t\t\treturn new WP_Error(
\t\t\t\t\t\t\t'kiduki_service_title_state_changed',
\t\t\t\t\t\t\t'Service title state changed after backup.',
\t\t\t\t\t\t\tarray( 'status' => 409 )
\t\t\t\t\t\t);
\t\t\t\t\t}
\t\t\t\t\tif (
\t\t\t\t\t\t29 !== $before['id'] ||
\t\t\t\t\t\t'service' !== $before['slug'] ||
\t\t\t\t\t\t'publish' !== $before['status'] ||
\t\t\t\t\t\t'産業医サービス｜選任・専門補完・復職支援' !== $before['title'] ||
\t\t\t\t\t\t! in_array( $before['hide_title'], array( '0', '1' ), true )
\t\t\t\t\t) {
\t\t\t\t\t\treturn new WP_Error(
\t\t\t\t\t\t\t'kiduki_service_title_identity_mismatch',
\t\t\t\t\t\t\t'Service page identity does not match the reviewed target.',
\t\t\t\t\t\t\tarray( 'status' => 409 )
\t\t\t\t\t\t);
\t\t\t\t\t}
\t\t\t\t\tif ( ${write} && '0' !== $before['hide_title'] ) {
\t\t\t\t\t\tupdate_post_meta( 29, 'emanon_hide_title', '0' );
\t\t\t\t\t\tclean_post_cache( 29 );
\t\t\t\t\t\tif ( function_exists( 'w3tc_flush_url' ) ) {
\t\t\t\t\t\t\tw3tc_flush_url( get_permalink( 29 ) );
\t\t\t\t\t\t}
\t\t\t\t\t}
\t\t\t\t\treturn array(
\t\t\t\t\t\t'before'  => $before,
\t\t\t\t\t\t'after'   => $read_state(),
\t\t\t\t\t\t'changed' => ${write} && '0' !== $before['hide_title'],
\t\t\t\t\t);
\t\t\t\t},
\t\t\t),
\t\t)
\t);

\tregister_rest_route(
\t\t'kiduki-seo/v1',
\t\t'/service-title-visibility-bridge',
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
  throw new Error(`A previous temporary title-visibility bridge exists: ${duplicate.id}`);
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
      desc: 'Temporary allowlisted service page title visibility bridge.',
      code: buildTemporarySnippetCode(),
      tags: ['codex', 'temporary', 'seo'],
      scope: 'global',
      active: false,
      priority: 10,
      network: false,
      shared_network: false,
    },
  );
  snippetId = Number(created.data.id);
  if (!snippetId) throw new Error('Code Snippets did not return a snippet id.');

  await wpRequest(
    env,
    'POST',
    `/wp-json/code-snippets/v1/snippets/${snippetId}/activate`,
    {},
  );
  const beforeResponse = await wpRequest(env, 'GET', temporaryRoute);
  const before = beforeResponse.data;

  let backupPath = null;
  if (apply) {
    const backupDirectory = path.resolve('backups');
    fs.mkdirSync(backupDirectory, { recursive: true, mode: 0o700 });
    backupPath = path.join(
      backupDirectory,
      `wp-service-title-visibility-before-${safeStamp()}.json`,
    );
    fs.writeFileSync(
      backupPath,
      `${JSON.stringify({ takenAt: new Date().toISOString(), state: before }, null, 2)}\n`,
      { mode: 0o600 },
    );
    fs.chmodSync(backupPath, 0o600);
  }

  const result = await wpRequest(env, 'POST', temporaryRoute, {
    state_hash: before.state_hash,
  });
  if (result.data.after?.hide_title !== '0' && apply) {
    throw new Error(
      `Service title visibility verification failed. Backup: ${backupPath}`,
    );
  }

  const cleanup = await wpRequest(env, 'POST', temporaryPurgeRoute, {
    snippet_id: snippetId,
  });
  purged = cleanup.data.deleted === true;
  if (!purged) throw new Error('Temporary title-visibility bridge was not purged.');

  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: apply ? 'apply' : 'dry-run',
        persistentWrites: apply,
        backupPath: backupPath ? path.relative(process.cwd(), backupPath) : null,
        result: result.data,
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
        JSON.stringify({
          ok: false,
          temporarySnippetCleanup: { id: snippetId, deleted: false },
        }),
      );
      process.exitCode = 1;
    }
  }
}
