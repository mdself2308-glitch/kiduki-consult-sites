#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import {
  getWordPressEnv,
  parseArgs,
  safeStamp,
  wpRequest,
} from '../../tools/wordpress-rest-utils.mjs';

const args = parseArgs(process.argv.slice(2));
const shouldApply = Boolean(args.apply);
const shouldBackup = Boolean(args.backup);
const backupConfirmed = Boolean(args['backup-confirmed']);

if (shouldApply && (!shouldBackup || !backupConfirmed)) {
  throw new Error(
    'Refusing cleanup without --backup --backup-confirmed.',
  );
}

if (shouldApply && args['dry-run']) {
  throw new Error('Choose either --dry-run or --apply, not both.');
}

const env = getWordPressEnv();
const mode = shouldApply ? 'apply' : 'dry-run';
const temporarySnippetName = 'Codex T0-R2 approved BackWPup cleanup';
const temporarySnippetPurgerName =
  'Codex T0-R2 temporary snippet purger';
const temporaryRoute = '/wp-json/kiduki-t0-r2/v1/backwpup-cleanup';
const temporarySnippetPurgeRoute =
  '/wp-json/kiduki-t0-r2/v1/purge-temporary-snippets';
const approvalToken = 'T0-R2-approved-2026-07-28';
const temporarySnippetNames = new Set([
  temporarySnippetName,
  'Codex T0-R2 BackWPup read-only inventory',
  temporarySnippetPurgerName,
]);

if (args['purge-temporary-snippets']) {
  const response = await wpRequest(
    env,
    'GET',
    '/wp-json/code-snippets/v1/snippets?context=edit&per_page=100',
  );
  const matches = response.data.filter((snippet) =>
    temporarySnippetNames.has(snippet.name),
  );

  if (!shouldApply) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          mode: 'dry-run',
          operation: 'purge-temporary-snippets',
          targets: matches.map(({ id, name, active }) => ({
            id,
            name,
            active: Boolean(active),
          })),
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
    `t0-r2-temporary-snippets-before-${safeStamp()}.json`,
  );
  fs.writeFileSync(
    backupPath,
    `${JSON.stringify(
      {
        task: 'T0-R2 temporary Code Snippets cleanup',
        createdAtUtc: new Date().toISOString(),
        snippets: matches,
      },
      null,
      2,
    )}\n`,
    { mode: 0o600 },
  );
  fs.chmodSync(backupPath, 0o600);
  const backupSha256 = crypto
    .createHash('sha256')
    .update(fs.readFileSync(backupPath))
    .digest('hex');

  const createdPurger = await wpRequest(
    env,
    'POST',
    '/wp-json/code-snippets/v1/snippets',
    {
      name: temporarySnippetPurgerName,
      desc: 'Temporary allowlisted permanent cleanup for T0-R2 snippets.',
      code: buildTemporarySnippetPurgerCode(),
      tags: ['codex', 'temporary', 't0-r2', 'approved-cleanup'],
      scope: 'global',
      active: false,
      priority: 10,
      network: false,
      shared_network: false,
    },
  );
  const purgerId = Number(createdPurger.data.id);
  if (!purgerId) {
    throw new Error('Code Snippets did not return a purger snippet id.');
  }

  await wpRequest(
    env,
    'POST',
    `/wp-json/code-snippets/v1/snippets/${purgerId}/activate`,
    {},
  );
  const purgeTargets = [
    ...matches.map(({ id, name }) => ({ id: Number(id), name })),
    { id: purgerId, name: temporarySnippetPurgerName },
  ];
  const purgeResponse = await wpRequest(
    env,
    'POST',
    temporarySnippetPurgeRoute,
    {
      approval: approvalToken,
      targets: purgeTargets,
    },
  );
  if (!purgeResponse.data.ok) {
    throw new Error('The allowlisted temporary snippet purge failed.');
  }

  const verified = await wpRequest(
    env,
    'GET',
    '/wp-json/code-snippets/v1/snippets?context=edit&per_page=100',
  );
  const remaining = verified.data.filter((snippet) =>
    temporarySnippetNames.has(snippet.name),
  );
  if (remaining.length > 0) {
    throw new Error(
      `Temporary T0-R2 snippets remain after purge: ${remaining
        .map((snippet) => snippet.id)
        .join(', ')}`,
    );
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: 'apply',
        operation: 'purge-temporary-snippets',
        deleted: purgeResponse.data.deleted,
        remaining: [],
        backup: {
          path: backupPath,
          sha256: backupSha256,
          mode: '0600',
        },
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

function buildTemporarySnippetPurgerCode() {
  return `
add_action( 'rest_api_init', function () {
\tregister_rest_route(
\t\t'kiduki-t0-r2/v1',
\t\t'/purge-temporary-snippets',
\t\tarray(
\t\t\t'methods'             => 'POST',
\t\t\t'permission_callback' => function () {
\t\t\t\treturn current_user_can( 'manage_options' );
\t\t\t},
\t\t\t'callback'            => function ( WP_REST_Request $request ) {
\t\t\t\tif ( 'T0-R2-approved-2026-07-28' !== (string) $request->get_param( 'approval' ) ) {
\t\t\t\t\treturn new WP_Error(
\t\t\t\t\t\t'kiduki_t0_r2_purge_not_authorized',
\t\t\t\t\t\t'The approved purge token is missing.',
\t\t\t\t\t\tarray( 'status' => 403 )
\t\t\t\t\t);
\t\t\t\t}

\t\t\t\t$allowed_names = array(
\t\t\t\t\t'Codex T0-R2 approved BackWPup cleanup',
\t\t\t\t\t'Codex T0-R2 BackWPup read-only inventory',
\t\t\t\t\t'Codex T0-R2 temporary snippet purger',
\t\t\t\t);
\t\t\t\t$targets = $request->get_param( 'targets' );
\t\t\t\tif ( ! is_array( $targets ) || count( $targets ) < 1 ) {
\t\t\t\t\treturn new WP_Error(
\t\t\t\t\t\t'kiduki_t0_r2_purge_targets_missing',
\t\t\t\t\t\t'No approved temporary snippets were supplied.',
\t\t\t\t\t\tarray( 'status' => 400 )
\t\t\t\t\t);
\t\t\t\t}

\t\t\t\t$validated = array();
\t\t\t\tforeach ( $targets as $target ) {
\t\t\t\t\t$id   = isset( $target['id'] ) ? (int) $target['id'] : 0;
\t\t\t\t\t$name = isset( $target['name'] ) ? (string) $target['name'] : '';
\t\t\t\t\tif ( $id < 1 || ! in_array( $name, $allowed_names, true ) ) {
\t\t\t\t\t\treturn new WP_Error(
\t\t\t\t\t\t\t'kiduki_t0_r2_purge_target_not_allowed',
\t\t\t\t\t\t\t'A requested snippet is outside the T0-R2 allowlist.',
\t\t\t\t\t\t\tarray( 'status' => 403 )
\t\t\t\t\t\t);
\t\t\t\t\t}

\t\t\t\t\t$snippet = \\Code_Snippets\\get_snippet( $id, false );
\t\t\t\t\tif ( ! $snippet || (string) $snippet->name !== $name ) {
\t\t\t\t\t\treturn new WP_Error(
\t\t\t\t\t\t\t'kiduki_t0_r2_purge_target_changed',
\t\t\t\t\t\t\t'An approved snippet no longer matches its expected id and name.',
\t\t\t\t\t\t\tarray( 'status' => 409 )
\t\t\t\t\t\t);
\t\t\t\t\t}
\t\t\t\t\t$validated[] = array( 'id' => $id, 'name' => $name );
\t\t\t\t}

\t\t\t\t$deleted = array();
\t\t\t\tforeach ( $validated as $target ) {
\t\t\t\t\tif ( ! \\Code_Snippets\\delete_snippet( $target['id'], false ) ) {
\t\t\t\t\t\treturn new WP_Error(
\t\t\t\t\t\t\t'kiduki_t0_r2_purge_failed',
\t\t\t\t\t\t\t'An approved temporary snippet could not be permanently deleted.',
\t\t\t\t\t\t\tarray( 'status' => 500, 'deleted' => $deleted )
\t\t\t\t\t\t);
\t\t\t\t\t}
\t\t\t\t\t$deleted[] = $target;
\t\t\t\t}

\t\t\t\treturn array( 'ok' => true, 'deleted' => $deleted );
\t\t\t},
\t\t)
\t);
} );
`;
}

function buildTemporarySnippetCode() {
  return `
add_action( 'rest_api_init', function () {
\tregister_rest_route(
\t\t'kiduki-t0-r2/v1',
\t\t'/backwpup-cleanup',
\t\tarray(
\t\t\t'methods'             => 'POST',
\t\t\t'permission_callback' => function () {
\t\t\t\treturn current_user_can( 'manage_options' );
\t\t\t},
\t\t\t'callback'            => function ( WP_REST_Request $request ) {
\t\t\t\tif ( 'purge-self' === (string) $request->get_param( 'mode' ) ) {
\t\t\t\t\t$id       = (int) $request->get_param( 'snippet_id' );
\t\t\t\t\t$approval = (string) $request->get_param( 'approval' );
\t\t\t\t\t$snippet  = $id > 0 ? \\Code_Snippets\\get_snippet( $id, false ) : null;
\t\t\t\t\tif (
\t\t\t\t\t\t'T0-R2-cleanup-snippet-purge' !== $approval ||
\t\t\t\t\t\t! $snippet ||
\t\t\t\t\t\t(int) $snippet->id !== $id ||
\t\t\t\t\t\t'Codex T0-R2 approved BackWPup cleanup' !== (string) $snippet->name
\t\t\t\t\t) {
\t\t\t\t\t\treturn new WP_Error(
\t\t\t\t\t\t\t'kiduki_t0_r2_cleanup_purge_not_allowed',
\t\t\t\t\t\t\t'The temporary cleanup snippet could not be verified.',
\t\t\t\t\t\t\tarray( 'status' => 403 )
\t\t\t\t\t\t);
\t\t\t\t\t}
\t\t\t\t\treturn array(
\t\t\t\t\t\t'ok'      => \\Code_Snippets\\delete_snippet( $id, false ),
\t\t\t\t\t\t'deleted' => $id,
\t\t\t\t\t);
\t\t\t\t}

\t\t\t\t$upload_dir = wp_upload_dir( null, true, false );
\t\t\t\t$base_dir   = trailingslashit( $upload_dir['basedir'] ) . 'backwpup-restore';
\t\t\t\t$base_label = 'wp-content/uploads/backwpup-restore';
\t\t\t\t$file_names = array( 'restore.dat', 'restore.dat.bkp', 'restore.log' );
\t\t\t\t$dir_name   = 'uploads';
\t\t\t\t$preserved  = array( '.htaccess', '.donotbackup', 'index.php' );
\t\t\t\t$mode       = (string) $request->get_param( 'mode' );

\t\t\t\tif ( ! is_dir( $base_dir ) || is_link( $base_dir ) ) {
\t\t\t\t\treturn new WP_Error(
\t\t\t\t\t\t'kiduki_t0_r2_base_invalid',
\t\t\t\t\t\t'The approved BackWPup restore directory is unavailable.',
\t\t\t\t\t\tarray( 'status' => 409 )
\t\t\t\t\t);
\t\t\t\t}

\t\t\t\t$describe = static function ( $name ) use ( $base_dir, $base_label ) {
\t\t\t\t\t$absolute = $base_dir . DIRECTORY_SEPARATOR . $name;
\t\t\t\t\t$exists   = file_exists( $absolute ) || is_link( $absolute );
\t\t\t\t\t$type     = 'missing';
\t\t\t\t\tif ( $exists ) {
\t\t\t\t\t\t$type = is_link( $absolute )
\t\t\t\t\t\t\t? 'symlink'
\t\t\t\t\t\t\t: ( is_dir( $absolute ) ? 'directory' : ( is_file( $absolute ) ? 'file' : 'other' ) );
\t\t\t\t\t}
\t\t\t\t\treturn array(
\t\t\t\t\t\t'path'       => $base_label . '/' . $name,
\t\t\t\t\t\t'exists'     => $exists,
\t\t\t\t\t\t'type'       => $type,
\t\t\t\t\t\t'size_bytes' => is_file( $absolute ) && ! is_link( $absolute ) ? filesize( $absolute ) : null,
\t\t\t\t\t\t'sha256'     => is_file( $absolute ) && ! is_link( $absolute ) ? hash_file( 'sha256', $absolute ) : null,
\t\t\t\t\t);
\t\t\t\t};

\t\t\t\t$targets = array();
\t\t\t\tforeach ( $file_names as $name ) {
\t\t\t\t\t$targets[] = $describe( $name );
\t\t\t\t}
\t\t\t\t$targets[] = $describe( $dir_name );

\t\t\t\t$preserved_state = array();
\t\t\t\tforeach ( $preserved as $name ) {
\t\t\t\t\t$preserved_state[] = $describe( $name );
\t\t\t\t}

\t\t\t\t$uploads_path    = $base_dir . DIRECTORY_SEPARATOR . $dir_name;
\t\t\t\t$uploads_entries = array();
\t\t\t\tif ( is_dir( $uploads_path ) && ! is_link( $uploads_path ) ) {
\t\t\t\t\t$scan = scandir( $uploads_path );
\t\t\t\t\tif ( false === $scan ) {
\t\t\t\t\t\treturn new WP_Error(
\t\t\t\t\t\t\t'kiduki_t0_r2_uploads_unreadable',
\t\t\t\t\t\t\t'The approved uploads directory could not be inspected.',
\t\t\t\t\t\t\tarray( 'status' => 500 )
\t\t\t\t\t\t);
\t\t\t\t\t}
\t\t\t\t\t$uploads_entries = array_values( array_diff( $scan, array( '.', '..' ) ) );
\t\t\t\t}

\t\t\t\t$errors = array();
\t\t\t\tforeach ( array_slice( $targets, 0, 3 ) as $target ) {
\t\t\t\t\tif ( ! $target['exists'] || 'file' !== $target['type'] ) {
\t\t\t\t\t\t$errors[] = $target['path'] . ' is not an approved regular file.';
\t\t\t\t\t}
\t\t\t\t}
\t\t\t\tif ( ! $targets[3]['exists'] || 'directory' !== $targets[3]['type'] ) {
\t\t\t\t\t$errors[] = $targets[3]['path'] . ' is not the approved directory.';
\t\t\t\t}
\t\t\t\tif ( count( $uploads_entries ) > 0 ) {
\t\t\t\t\t$errors[] = $targets[3]['path'] . ' is no longer empty.';
\t\t\t\t}
\t\t\t\tforeach ( $preserved_state as $item ) {
\t\t\t\t\tif ( ! $item['exists'] || 'file' !== $item['type'] ) {
\t\t\t\t\t\t$errors[] = $item['path'] . ' is not present as the expected preserved file.';
\t\t\t\t\t}
\t\t\t\t}

\t\t\t\t$warning_trigger_paths = array();
\t\t\t\tif ( $targets[1]['exists'] ) {
\t\t\t\t\t$warning_trigger_paths[] = $targets[1]['path'];
\t\t\t\t}
\t\t\t\tforeach ( array( 'uploads', 'extract' ) as $warning_dir_name ) {
\t\t\t\t\t$warning_dir = $base_dir . DIRECTORY_SEPARATOR . $warning_dir_name;
\t\t\t\t\tif ( ! is_dir( $warning_dir ) || is_link( $warning_dir ) ) {
\t\t\t\t\t\tcontinue;
\t\t\t\t\t}
\t\t\t\t\ttry {
\t\t\t\t\t\t$iterator = new FilesystemIterator( $warning_dir, FilesystemIterator::SKIP_DOTS );
\t\t\t\t\t\tif ( $iterator->valid() ) {
\t\t\t\t\t\t\t$warning_trigger_paths[] = $base_label . '/' . $warning_dir_name;
\t\t\t\t\t\t}
\t\t\t\t\t} catch ( UnexpectedValueException $error ) {
\t\t\t\t\t\tcontinue;
\t\t\t\t\t}
\t\t\t\t}

\t\t\t\t$state = array(
\t\t\t\t\t'base_path'             => $base_label,
\t\t\t\t\t'ready'                 => 0 === count( $errors ),
\t\t\t\t\t'errors'                => $errors,
\t\t\t\t\t'targets'               => $targets,
\t\t\t\t\t'uploads_entries'       => $uploads_entries,
\t\t\t\t\t'preserved'             => $preserved_state,
\t\t\t\t\t'warning_trigger_paths' => $warning_trigger_paths,
\t\t\t\t\t'warning_trigger_clear' => 0 === count( $warning_trigger_paths ),
\t\t\t\t);

\t\t\t\tif ( 'inspect' === $mode ) {
\t\t\t\t\treturn $state;
\t\t\t\t}

\t\t\t\tif ( 'backup' === $mode ) {
\t\t\t\t\tif ( ! $state['ready'] ) {
\t\t\t\t\t\treturn new WP_Error(
\t\t\t\t\t\t\t'kiduki_t0_r2_backup_preflight_failed',
\t\t\t\t\t\t\t'The approved targets changed before backup.',
\t\t\t\t\t\t\tarray( 'status' => 409, 'state' => $state )
\t\t\t\t\t\t);
\t\t\t\t\t}

\t\t\t\t\t$files = array();
\t\t\t\t\tforeach ( $file_names as $name ) {
\t\t\t\t\t\t$absolute = $base_dir . DIRECTORY_SEPARATOR . $name;
\t\t\t\t\t\t$contents = file_get_contents( $absolute );
\t\t\t\t\t\tif ( false === $contents ) {
\t\t\t\t\t\t\treturn new WP_Error(
\t\t\t\t\t\t\t\t'kiduki_t0_r2_backup_read_failed',
\t\t\t\t\t\t\t\t'An approved target could not be backed up.',
\t\t\t\t\t\t\t\tarray( 'status' => 500 )
\t\t\t\t\t\t\t);
\t\t\t\t\t\t}
\t\t\t\t\t\t$files[] = array(
\t\t\t\t\t\t\t'path'           => $base_label . '/' . $name,
\t\t\t\t\t\t\t'mode'           => substr( sprintf( '%o', fileperms( $absolute ) ), -4 ),
\t\t\t\t\t\t\t'sha256'         => hash( 'sha256', $contents ),
\t\t\t\t\t\t\t'content_base64' => base64_encode( $contents ),
\t\t\t\t\t\t);
\t\t\t\t\t}

\t\t\t\t\treturn array(
\t\t\t\t\t\t'base_path'        => $base_label,
\t\t\t\t\t\t'created_at_utc'   => gmdate( 'c' ),
\t\t\t\t\t\t'files'            => $files,
\t\t\t\t\t\t'empty_directories' => array( $base_label . '/' . $dir_name ),
\t\t\t\t\t);
\t\t\t\t}

\t\t\t\tif ( 'apply' !== $mode || 'T0-R2-approved-2026-07-28' !== (string) $request->get_param( 'approval' ) ) {
\t\t\t\t\treturn new WP_Error(
\t\t\t\t\t\t'kiduki_t0_r2_apply_not_authorized',
\t\t\t\t\t\t'The approved cleanup token is missing.',
\t\t\t\t\t\tarray( 'status' => 403 )
\t\t\t\t\t);
\t\t\t\t}

\t\t\t\tif ( ! $state['ready'] ) {
\t\t\t\t\treturn new WP_Error(
\t\t\t\t\t\t'kiduki_t0_r2_apply_preflight_failed',
\t\t\t\t\t\t'The approved targets changed before deletion.',
\t\t\t\t\t\tarray( 'status' => 409, 'state' => $state )
\t\t\t\t\t);
\t\t\t\t}

\t\t\t\t$deleted = array();
\t\t\t\tforeach ( $file_names as $name ) {
\t\t\t\t\t$absolute = $base_dir . DIRECTORY_SEPARATOR . $name;
\t\t\t\t\tif ( ! unlink( $absolute ) ) {
\t\t\t\t\t\treturn new WP_Error(
\t\t\t\t\t\t\t'kiduki_t0_r2_delete_failed',
\t\t\t\t\t\t\t'An approved file could not be deleted.',
\t\t\t\t\t\t\tarray( 'status' => 500, 'deleted' => $deleted )
\t\t\t\t\t\t);
\t\t\t\t\t}
\t\t\t\t\t$deleted[] = $base_label . '/' . $name;
\t\t\t\t}

\t\t\t\tif ( ! rmdir( $uploads_path ) ) {
\t\t\t\t\treturn new WP_Error(
\t\t\t\t\t\t'kiduki_t0_r2_directory_delete_failed',
\t\t\t\t\t\t'The approved empty directory could not be deleted.',
\t\t\t\t\t\tarray( 'status' => 500, 'deleted' => $deleted )
\t\t\t\t\t);
\t\t\t\t}
\t\t\t\t$deleted[] = $base_label . '/' . $dir_name;

\t\t\t\t$remaining_targets = array();
\t\t\t\tforeach ( array_merge( $file_names, array( $dir_name ) ) as $name ) {
\t\t\t\t\t$remaining_targets[] = $describe( $name );
\t\t\t\t}
\t\t\t\t$preserved_after = array();
\t\t\t\tforeach ( $preserved as $name ) {
\t\t\t\t\t$preserved_after[] = $describe( $name );
\t\t\t\t}

\t\t\t\t$warning_trigger_paths_after = array();
\t\t\t\tif ( $remaining_targets[1]['exists'] ) {
\t\t\t\t\t$warning_trigger_paths_after[] = $remaining_targets[1]['path'];
\t\t\t\t}
\t\t\t\tforeach ( array( 'uploads', 'extract' ) as $warning_dir_name ) {
\t\t\t\t\t$warning_dir = $base_dir . DIRECTORY_SEPARATOR . $warning_dir_name;
\t\t\t\t\tif ( ! is_dir( $warning_dir ) || is_link( $warning_dir ) ) {
\t\t\t\t\t\tcontinue;
\t\t\t\t\t}
\t\t\t\t\ttry {
\t\t\t\t\t\t$iterator = new FilesystemIterator( $warning_dir, FilesystemIterator::SKIP_DOTS );
\t\t\t\t\t\tif ( $iterator->valid() ) {
\t\t\t\t\t\t\t$warning_trigger_paths_after[] = $base_label . '/' . $warning_dir_name;
\t\t\t\t\t\t}
\t\t\t\t\t} catch ( UnexpectedValueException $error ) {
\t\t\t\t\t\tcontinue;
\t\t\t\t\t}
\t\t\t\t}

\t\t\t\treturn array(
\t\t\t\t\t'ok'                    => true,
\t\t\t\t\t'deleted'               => $deleted,
\t\t\t\t\t'remaining_targets'     => $remaining_targets,
\t\t\t\t\t'preserved'             => $preserved_after,
\t\t\t\t\t'warning_trigger_paths' => $warning_trigger_paths_after,
\t\t\t\t\t'warning_trigger_clear' => 0 === count( $warning_trigger_paths_after ),
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
const activeDuplicates = snippets.data.filter(
  (snippet) => snippet.name === temporarySnippetName && snippet.active,
);
if (activeDuplicates.length > 0) {
  throw new Error('A previous active T0-R2 cleanup snippet still exists.');
}

let snippetId = null;
let temporarySnippetCleanup = {
  deactivated: false,
  deleted: false,
};

try {
  const created = await wpRequest(
    env,
    'POST',
    '/wp-json/code-snippets/v1/snippets',
    {
      name: temporarySnippetName,
      desc: 'Temporary allowlisted T0-R2 cleanup with dry-run and local backup gates.',
      code: buildTemporarySnippetCode(),
      tags: ['codex', 'temporary', 't0-r2', 'approved-cleanup'],
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

  const inspected = await wpRequest(env, 'POST', temporaryRoute, {
    mode: 'inspect',
  });
  if (!inspected.data.ready) {
    throw new Error(
      `T0-R2 preflight failed: ${inspected.data.errors.join(' ')}`,
    );
  }

  const backupResponse = await wpRequest(env, 'POST', temporaryRoute, {
    mode: 'backup',
  });
  const backupDir = path.resolve('backups');
  fs.mkdirSync(backupDir, { recursive: true, mode: 0o700 });
  const backupPath = path.join(
    backupDir,
    `t0-r2-backwpup-residuals-before-${safeStamp()}.json`,
  );
  const backupDocument = {
    task: 'T0-R2 BackWPup residual cleanup',
    mode,
    ...backupResponse.data,
  };
  fs.writeFileSync(
    backupPath,
    `${JSON.stringify(backupDocument, null, 2)}\n`,
    { mode: 0o600 },
  );
  fs.chmodSync(backupPath, 0o600);
  const backupSha256 = crypto
    .createHash('sha256')
    .update(fs.readFileSync(backupPath))
    .digest('hex');

  if (!shouldApply) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          mode,
          basePath: inspected.data.base_path,
          plannedDeletions: inspected.data.targets.map((item) => ({
            path: item.path,
            type: item.type,
            sizeBytes: item.size_bytes,
            sha256: item.sha256,
          })),
          preserved: inspected.data.preserved.map((item) => ({
            path: item.path,
            type: item.type,
          })),
          warningTriggerPaths: inspected.data.warning_trigger_paths,
          backup: {
            path: backupPath,
            sha256: backupSha256,
            mode: '0600',
          },
        },
        null,
        2,
      ),
    );
  } else {
    const applied = await wpRequest(env, 'POST', temporaryRoute, {
      mode: 'apply',
      approval: approvalToken,
    });
    console.log(
      JSON.stringify(
        {
          ok: Boolean(applied.data.ok),
          mode,
          deleted: applied.data.deleted,
          remainingTargets: applied.data.remaining_targets,
          preserved: applied.data.preserved,
          warningTriggerPaths: applied.data.warning_trigger_paths,
          warningTriggerClear: Boolean(
            applied.data.warning_trigger_clear,
          ),
          backup: {
            path: backupPath,
            sha256: backupSha256,
            mode: '0600',
          },
        },
        null,
        2,
      ),
    );
  }
} finally {
  if (snippetId) {
    try {
      await wpRequest(
        env,
        'POST',
        temporaryRoute,
        {
          mode: 'purge-self',
          snippet_id: snippetId,
          approval: 'T0-R2-cleanup-snippet-purge',
        },
      );
      temporarySnippetCleanup.deactivated = true;
      temporarySnippetCleanup.deleted = true;
    } catch {
      try {
        await wpRequest(
          env,
          'POST',
          `/wp-json/code-snippets/v1/snippets/${snippetId}/deactivate`,
          {},
        );
        temporarySnippetCleanup.deactivated = true;
      } catch {
        temporarySnippetCleanup.deactivated = false;
      }

      try {
        await wpRequest(
          env,
          'DELETE',
          `/wp-json/code-snippets/v1/snippets/${snippetId}`,
        );
        temporarySnippetCleanup.deleted = true;
      } catch {
        temporarySnippetCleanup.deleted = false;
      }
    }
  }

  if (
    snippetId &&
    (!temporarySnippetCleanup.deactivated ||
      !temporarySnippetCleanup.deleted)
  ) {
    console.error(
      JSON.stringify(
        {
          ok: false,
          temporarySnippetCleanup: {
            id: snippetId,
            ...temporarySnippetCleanup,
          },
        },
        null,
        2,
      ),
    );
    process.exitCode = 1;
  }
}
