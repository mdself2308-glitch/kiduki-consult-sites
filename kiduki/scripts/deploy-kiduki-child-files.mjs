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
const temporarySnippetName = 'Codex KIDUKI child file deployment bridge';
const temporaryRoute = '/wp-json/kiduki-theme/v1/files';
const temporaryPurgeRoute = '/wp-json/kiduki-theme/v1/purge';
const themeDirectory = path.resolve(
  'kiduki/wp-content/themes/kiduki-child',
);
const relativePaths = [
  'functions.php',
  'style.css',
  'assets/js/cf7-redirect.js',
  'assets/js/contact-thanks.js',
];

if (apply && (!backup || !backupConfirmed)) {
  throw new Error(
    'Refusing child-theme deployment without --backup --backup-confirmed.',
  );
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

const localFiles = Object.fromEntries(
  relativePaths.map((relativePath) => {
    const absolutePath = path.join(themeDirectory, relativePath);
    const contents = fs.readFileSync(absolutePath);
    return [
      relativePath,
      {
        contents,
        bytes: contents.length,
        sha256: sha256(contents),
      },
    ];
  }),
);

function buildTemporarySnippetCode() {
  return `
add_action( 'rest_api_init', function () {
\t$permission = function () {
\t\treturn current_user_can( 'manage_options' );
\t};
\t$allowed = array(
\t\t'functions.php',
\t\t'style.css',
\t\t'assets/js/cf7-redirect.js',
\t\t'assets/js/contact-thanks.js',
\t);
\t$read_state = function () use ( $allowed ) {
\t\tif ( 'kiduki-child' !== get_stylesheet() ) {
\t\t\treturn new WP_Error(
\t\t\t\t'kiduki_child_inactive',
\t\t\t\t'The active stylesheet is not kiduki-child.',
\t\t\t\tarray( 'status' => 409 )
\t\t\t);
\t\t}

\t\t$base = trailingslashit( get_stylesheet_directory() );
\t\t$files = array();
\t\tforeach ( $allowed as $relative_path ) {
\t\t\t$absolute_path = $base . $relative_path;
\t\t\t$exists = is_file( $absolute_path );
\t\t\t$files[ $relative_path ] = array(
\t\t\t\t'exists'   => $exists,
\t\t\t\t'bytes'    => $exists ? filesize( $absolute_path ) : 0,
\t\t\t\t'sha256'   => $exists ? hash_file( 'sha256', $absolute_path ) : null,
\t\t\t\t'contents' => $exists ? base64_encode( file_get_contents( $absolute_path ) ) : null,
\t\t\t);
\t\t}

\t\treturn array(
\t\t\t'stylesheet' => get_stylesheet(),
\t\t\t'files'      => $files,
\t\t);
\t};

\tregister_rest_route(
\t\t'kiduki-theme/v1',
\t\t'/files',
\t\tarray(
\t\t\tarray(
\t\t\t\t'methods'             => 'GET',
\t\t\t\t'permission_callback' => $permission,
\t\t\t\t'callback'            => $read_state,
\t\t\t),
\t\t\tarray(
\t\t\t\t'methods'             => 'POST',
\t\t\t\t'permission_callback' => $permission,
\t\t\t\t'callback'            => function ( WP_REST_Request $request ) use ( $allowed, $read_state ) {
\t\t\t\t\tif ( 'kiduki-child' !== get_stylesheet() ) {
\t\t\t\t\t\treturn new WP_Error(
\t\t\t\t\t\t\t'kiduki_child_inactive',
\t\t\t\t\t\t\t'The active stylesheet is not kiduki-child.',
\t\t\t\t\t\t\tarray( 'status' => 409 )
\t\t\t\t\t\t);
\t\t\t\t\t}

\t\t\t\t\t$files = (array) $request->get_param( 'files' );
\t\t\t\t\tif ( $allowed !== array_keys( $files ) ) {
\t\t\t\t\t\treturn new WP_Error(
\t\t\t\t\t\t\t'kiduki_theme_targets_invalid',
\t\t\t\t\t\t\t'Theme file targets do not exactly match the allowlist.',
\t\t\t\t\t\t\tarray( 'status' => 400 )
\t\t\t\t\t\t);
\t\t\t\t\t}

\t\t\t\t\t$base = trailingslashit( get_stylesheet_directory() );
\t\t\t\t\tforeach ( $allowed as $relative_path ) {
\t\t\t\t\t\t$encoded = (string) $files[ $relative_path ];
\t\t\t\t\t\t$contents = base64_decode( $encoded, true );
\t\t\t\t\t\tif ( false === $contents ) {
\t\t\t\t\t\t\treturn new WP_Error(
\t\t\t\t\t\t\t\t'kiduki_theme_payload_invalid',
\t\t\t\t\t\t\t\t'Invalid base64 theme file payload.',
\t\t\t\t\t\t\t\tarray( 'status' => 400 )
\t\t\t\t\t\t\t);
\t\t\t\t\t\t}

\t\t\t\t\t\t$absolute_path = $base . $relative_path;
\t\t\t\t\t\tif ( ! wp_mkdir_p( dirname( $absolute_path ) ) ) {
\t\t\t\t\t\t\treturn new WP_Error(
\t\t\t\t\t\t\t\t'kiduki_theme_directory_failed',
\t\t\t\t\t\t\t\t'Could not create a child-theme directory.',
\t\t\t\t\t\t\t\tarray( 'status' => 500 )
\t\t\t\t\t\t\t);
\t\t\t\t\t\t}
\t\t\t\t\t\tif ( false === file_put_contents( $absolute_path, $contents, LOCK_EX ) ) {
\t\t\t\t\t\t\treturn new WP_Error(
\t\t\t\t\t\t\t\t'kiduki_theme_write_failed',
\t\t\t\t\t\t\t\t'Could not write a child-theme file.',
\t\t\t\t\t\t\t\tarray( 'status' => 500 )
\t\t\t\t\t\t\t);
\t\t\t\t\t\t}
\t\t\t\t\t}

\t\t\t\t\treturn $read_state();
\t\t\t\t},
\t\t\t),
\t\t)
\t);

\tregister_rest_route(
\t\t'kiduki-theme/v1',
\t\t'/purge',
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
const existingSnippets = await wpRequest(
  env,
  'GET',
  '/wp-json/code-snippets/v1/snippets?context=edit&per_page=100',
);
const duplicate = existingSnippets.data.find(
  (snippet) => snippet.name === temporarySnippetName,
);

if (duplicate) {
  throw new Error(
    `A previous temporary child-theme deployment snippet still exists: ${duplicate.id}`,
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
      desc: 'Temporary allowlisted child-theme deployment bridge. Remove immediately after use.',
      code: buildTemporarySnippetCode(),
      tags: ['codex', 'temporary', 'theme'],
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
  const comparison = Object.fromEntries(
    relativePaths.map((relativePath) => [
      relativePath,
      {
        localBytes: localFiles[relativePath].bytes,
        localSha256: localFiles[relativePath].sha256,
        remoteExists: Boolean(before.data.files?.[relativePath]?.exists),
        remoteBytes: Number(before.data.files?.[relativePath]?.bytes || 0),
        remoteSha256: before.data.files?.[relativePath]?.sha256 || null,
        changed:
          localFiles[relativePath].sha256 !==
          (before.data.files?.[relativePath]?.sha256 || null),
      },
    ]),
  );

  if (!apply) {
    const purge = await wpRequest(env, 'POST', temporaryPurgeRoute, {
      snippet_id: snippetId,
    });
    purged = purge.data.deleted === true;
    if (!purged) {
      throw new Error('Temporary child-theme dry-run bridge did not purge itself.');
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          mode: 'dry-run',
          persistentWrites: false,
          temporaryBridgeCreatedAndPurged: true,
          activeStylesheet: before.data.stylesheet,
          comparison,
          temporarySnippetPurged: true,
        },
        null,
        2,
      ),
    );
    process.exit(0);
  }

  const backupDir = path.resolve('backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(
    backupDir,
    `wp-kiduki-child-before-${safeStamp()}.json`,
  );
  fs.writeFileSync(
    backupPath,
    `${JSON.stringify(before.data, null, 2)}\n`,
    { mode: 0o600 },
  );
  fs.chmodSync(backupPath, 0o600);

  const updated = await wpRequest(env, 'POST', temporaryRoute, {
    files: Object.fromEntries(
      relativePaths.map((relativePath) => [
        relativePath,
        localFiles[relativePath].contents.toString('base64'),
      ]),
    ),
  });

  const mismatchedFiles = relativePaths.filter(
    (relativePath) =>
      updated.data.files?.[relativePath]?.sha256 !==
      localFiles[relativePath].sha256,
  );
  if (mismatchedFiles.length > 0) {
    throw new Error(
      `Child-theme deployment verification failed: ${mismatchedFiles.join(', ')}`,
    );
  }

  const purge = await wpRequest(env, 'POST', temporaryPurgeRoute, {
    snippet_id: snippetId,
  });
  purged = purge.data.deleted === true;
  if (!purged) {
    throw new Error('Temporary child-theme deployment bridge did not purge itself.');
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: 'apply',
        backupPath,
        activeStylesheet: updated.data.stylesheet,
        comparison,
        verifiedFiles: Object.fromEntries(
          relativePaths.map((relativePath) => [
            relativePath,
            {
              bytes: updated.data.files[relativePath].bytes,
              sha256: updated.data.files[relativePath].sha256,
            },
          ]),
        ),
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
