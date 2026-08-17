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
const temporarySnippetName = 'Codex T5 WordPress cache purge bridge';
const temporaryRoute = '/wp-json/kiduki-t5/v1/cache-purge';
const temporaryPurgeRoute = '/wp-json/kiduki-t5/v1/cache-purge-bridge';

if (apply && (!backup || !backupConfirmed)) {
  throw new Error(
    'Refusing T5 cache purge without --backup --backup-confirmed.',
  );
}

function buildTemporarySnippetCode() {
  return `
add_action( 'rest_api_init', function () {
\t$permission = function () {
\t\treturn current_user_can( 'manage_options' );
\t};
\t$read_state = function () {
\t\t$urls = array(
\t\t\thome_url( '/' ),
\t\t\thome_url( '/contact/' ),
\t\t\thome_url( '/contact/thanks/' ),
\t\t);
\t\t$public_types = get_post_types( array( 'public' => true ), 'names' );
\t\t$ids = get_posts(
\t\t\tarray(
\t\t\t\t'post_type'              => $public_types,
\t\t\t\t'post_status'            => 'publish',
\t\t\t\t'posts_per_page'         => -1,
\t\t\t\t'fields'                 => 'ids',
\t\t\t\t'orderby'                => 'ID',
\t\t\t\t'order'                  => 'ASC',
\t\t\t\t'no_found_rows'          => true,
\t\t\t\t'update_post_meta_cache' => false,
\t\t\t\t'update_post_term_cache' => false,
\t\t\t)
\t\t);
\t\tforeach ( $ids as $id ) {
\t\t\t$url = get_permalink( $id );
\t\t\tif ( is_string( $url ) && '' !== $url ) {
\t\t\t\t$urls[] = $url;
\t\t\t}
\t\t}
\t\t$urls = array_values( array_unique( $urls ) );
\t\tsort( $urls );
\t\t$cache_root = defined( 'W3TC_CACHE_PAGE_ENHANCED_DIR' )
\t\t\t? W3TC_CACHE_PAGE_ENHANCED_DIR
\t\t\t: WP_CONTENT_DIR . '/cache/page_enhanced';
\t\t$root_entries = is_dir( $cache_root )
\t\t\t? array_values(
\t\t\t\tarray_filter(
\t\t\t\t\tscandir( $cache_root ),
\t\t\t\t\tfunction ( $name ) {
\t\t\t\t\t\treturn '.' !== $name && '..' !== $name;
\t\t\t\t\t}
\t\t\t\t)
\t\t\t)
\t\t\t: array();
\t\t$host_dir = trailingslashit( $cache_root ) . 'kdkconslt-sngyouijm.com';
\t\t$cache_files = array();
\t\tif ( is_dir( $host_dir ) ) {
\t\t\t$iterator = new RecursiveIteratorIterator(
\t\t\t\tnew RecursiveDirectoryIterator(
\t\t\t\t\t$host_dir,
\t\t\t\t\tFilesystemIterator::SKIP_DOTS
\t\t\t\t)
\t\t\t);
\t\t\tforeach ( $iterator as $file ) {
\t\t\t\tif ( $file->isFile() || $file->isLink() ) {
\t\t\t\t\t$cache_files[] = array(
\t\t\t\t\t\t'path'  => substr( $file->getPathname(), strlen( $host_dir ) + 1 ),
\t\t\t\t\t\t'size'  => (int) $file->getSize(),
\t\t\t\t\t\t'mtime' => (int) $file->getMTime(),
\t\t\t\t\t);
\t\t\t\t}
\t\t\t}
\t\t}
\t\tusort(
\t\t\t$cache_files,
\t\t\tfunction ( $a, $b ) {
\t\t\t\treturn strcmp( $a['path'], $b['path'] );
\t\t\t}
\t\t);
\t\t$total_bytes = array_sum( array_column( $cache_files, 'size' ) );
\t\t$state_hash = hash(
\t\t\t'sha256',
\t\t\twp_json_encode( array( 'urls' => $urls, 'cache_files' => $cache_files ) )
\t\t);
\t\treturn array(
\t\t\t'urls'                  => $urls,
\t\t\t'url_count'             => count( $urls ),
\t\t\t'w3tc_flush_all'        => function_exists( 'w3tc_flush_all' ),
\t\t\t'w3tc_flush_url'        => function_exists( 'w3tc_flush_url' ),
\t\t\t'wp_cache_flush'        => function_exists( 'wp_cache_flush' ),
\t\t\t'cache'                 => array(
\t\t\t\t'root'        => $cache_root,
\t\t\t\t'root_exists' => is_dir( $cache_root ),
\t\t\t\t'root_writable' => is_dir( $cache_root ) && is_writable( $cache_root ),
\t\t\t\t'root_entries' => $root_entries,
\t\t\t\t'host_dir'    => $host_dir,
\t\t\t\t'host_exists' => is_dir( $host_dir ),
\t\t\t\t'writable'    => is_dir( $host_dir ) && is_writable( $host_dir ),
\t\t\t\t'file_count'  => count( $cache_files ),
\t\t\t\t'total_bytes' => $total_bytes,
\t\t\t\t'files'       => $cache_files,
\t\t\t),
\t\t\t'state_hash'            => $state_hash,
\t\t);
\t};

\tregister_rest_route(
\t\t'kiduki-t5/v1',
\t\t'/cache-purge',
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
\t\t\t\t\t$state = $read_state();
\t\t\t\t\tif ( $request->get_param( 'state_hash' ) !== $state['state_hash'] ) {
\t\t\t\t\t\treturn new WP_Error(
\t\t\t\t\t\t\t'kiduki_t5_cache_state_changed',
\t\t\t\t\t\t\t'T5 cache target list changed after backup.',
\t\t\t\t\t\t\tarray( 'status' => 409 )
\t\t\t\t\t\t);
\t\t\t\t\t}
\t\t\t\t\tif (
\t\t\t\t\t\t! $state['w3tc_flush_all'] ||
\t\t\t\t\t\t! $state['w3tc_flush_url'] ||
\t\t\t\t\t\t! $state['wp_cache_flush']
\t\t\t\t\t) {
\t\t\t\t\t\treturn new WP_Error(
\t\t\t\t\t\t\t'kiduki_t5_cache_api_missing',
\t\t\t\t\t\t\t'W3 Total Cache purge functions are unavailable.',
\t\t\t\t\t\t\tarray( 'status' => 500 )
\t\t\t\t\t\t);
\t\t\t\t\t}
\t\t\t\t\t$extras = array( 'ui_action' => 'flush_button' );
\t\t\t\t\tw3tc_flush_all( $extras );
\t\t\t\t\tforeach ( $state['urls'] as $url ) {
\t\t\t\t\t\tw3tc_flush_url( $url, $extras );
\t\t\t\t\t}
\t\t\t\t\twp_cache_flush();

\t\t\t\t\t$after_flush = $read_state();
\t\t\t\t\t$deleted     = 0;
\t\t\t\t\t$failures    = array();
\t\t\t\t\tforeach ( $after_flush['cache']['files'] as $file ) {
\t\t\t\t\t\t$relative_path = (string) $file['path'];
\t\t\t\t\t\tif (
\t\t\t\t\t\t\t'' === $relative_path ||
\t\t\t\t\t\t\t'/' === $relative_path[0] ||
\t\t\t\t\t\t\tfalse !== strpos( $relative_path, '..' )
\t\t\t\t\t\t) {
\t\t\t\t\t\t\t$failures[] = $relative_path;
\t\t\t\t\t\t\tcontinue;
\t\t\t\t\t\t}
\t\t\t\t\t\t$absolute_path = trailingslashit( $after_flush['cache']['host_dir'] ) . $relative_path;
\t\t\t\t\t\tif (
\t\t\t\t\t\t\t( is_file( $absolute_path ) || is_link( $absolute_path ) ) &&
\t\t\t\t\t\t\t! unlink( $absolute_path )
\t\t\t\t\t\t) {
\t\t\t\t\t\t\t$failures[] = $relative_path;
\t\t\t\t\t\t\tcontinue;
\t\t\t\t\t\t}
\t\t\t\t\t\t$deleted++;
\t\t\t\t\t}

\t\t\t\t\t$after_delete = $read_state();
\t\t\t\t\tif ( ! empty( $failures ) || 0 !== $after_delete['cache']['file_count'] ) {
\t\t\t\t\t\treturn new WP_Error(
\t\t\t\t\t\t\t'kiduki_t5_cache_files_remain',
\t\t\t\t\t\t\t'T5 enhanced page cache files remain after purge.',
\t\t\t\t\t\t\tarray(
\t\t\t\t\t\t\t\t'status'               => 500,
\t\t\t\t\t\t\t\t'failures'             => $failures,
\t\t\t\t\t\t\t\t'remaining_file_count' => $after_delete['cache']['file_count'],
\t\t\t\t\t\t\t)
\t\t\t\t\t\t);
\t\t\t\t\t}
\t\t\t\t\treturn array(
\t\t\t\t\t\t'w3tc_flush_all_invoked' => true,
\t\t\t\t\t\t'url_count'              => count( $state['urls'] ),
\t\t\t\t\t\t'object_cache_invoked'   => true,
\t\t\t\t\t\t'deleted_file_count'     => $deleted,
\t\t\t\t\t\t'remaining_file_count'   => 0,
\t\t\t\t\t);
\t\t\t\t},
\t\t\t),
\t\t)
\t);

\tregister_rest_route(
\t\t'kiduki-t5/v1',
\t\t'/cache-purge-bridge',
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
  await wpRequest(
    env,
    'POST',
    `/wp-json/code-snippets/v1/snippets/${duplicate.id}/activate`,
    {},
  );
  const cleanup = await wpRequest(env, 'POST', temporaryPurgeRoute, {
    snippet_id: duplicate.id,
  });
  if (cleanup.data.deleted !== true) {
    throw new Error(
      `Previous temporary T5 cache snippet could not be purged: ${duplicate.id}`,
    );
  }
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
      desc: 'Temporary allowlisted T5 W3 Total Cache purge bridge.',
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
  const summary = {
    urlCount: before.data.url_count,
    w3tcFlushAllAvailable: before.data.w3tc_flush_all,
    w3tcFlushUrlAvailable: before.data.w3tc_flush_url,
    objectCacheFlushAvailable: before.data.wp_cache_flush,
    enhancedCacheHostExists: before.data.cache.host_exists,
    enhancedCacheWritable: before.data.cache.writable,
    enhancedCacheFileCount: before.data.cache.file_count,
    enhancedCacheBytes: before.data.cache.total_bytes,
    enhancedCacheRoot: before.data.cache.root,
    enhancedCacheRootExists: before.data.cache.root_exists,
    enhancedCacheRootWritable: before.data.cache.root_writable,
    enhancedCacheRootEntries: before.data.cache.root_entries,
    stateHash: before.data.state_hash,
  };
  if (
    !summary.w3tcFlushAllAvailable ||
    !summary.w3tcFlushUrlAvailable ||
    !summary.objectCacheFlushAvailable
  ) {
    const purge = await wpRequest(env, 'POST', temporaryPurgeRoute, {
      snippet_id: snippetId,
    });
    purged = purge.data.deleted === true;
    console.error(JSON.stringify(summary, null, 2));
    throw new Error('T5 cache purge preflight failed.');
  }

  if (!apply) {
    const purge = await wpRequest(env, 'POST', temporaryPurgeRoute, {
      snippet_id: snippetId,
    });
    purged = purge.data.deleted === true;
    if (!purged) {
      throw new Error('Temporary T5 cache dry-run bridge was not purged.');
    }
    console.log(
      JSON.stringify(
        {
          ok: true,
          mode: 'dry-run',
          persistentWrites: false,
          ...summary,
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
    `wp-t5-cache-targets-before-${safeStamp()}.json`,
  );
  fs.writeFileSync(
    backupPath,
    `${JSON.stringify(
      {
        task: 'T5 WordPress cache purge',
        createdAt: new Date().toISOString(),
        state: before.data,
      },
      null,
      2,
    )}\n`,
    { mode: 0o600 },
  );
  fs.chmodSync(backupPath, 0o600);

  const result = await wpRequest(env, 'POST', temporaryRoute, {
    state_hash: before.data.state_hash,
  });
  if (
    result.data.w3tc_flush_all_invoked !== true ||
    result.data.object_cache_invoked !== true ||
    result.data.url_count !== before.data.url_count ||
    result.data.remaining_file_count !== 0
  ) {
    throw new Error('T5 cache purge invocation verification failed.');
  }

  const purge = await wpRequest(env, 'POST', temporaryPurgeRoute, {
    snippet_id: snippetId,
  });
  purged = purge.data.deleted === true;
  if (!purged) {
    throw new Error('Temporary T5 cache bridge was not purged.');
  }
  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: 'apply',
        backupPath: path.relative(process.cwd(), backupPath),
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
