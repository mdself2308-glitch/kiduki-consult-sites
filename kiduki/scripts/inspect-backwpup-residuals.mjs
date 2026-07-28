#!/usr/bin/env node

import {
  getWordPressEnv,
  wpRequest,
} from '../../tools/wordpress-rest-utils.mjs';

const env = getWordPressEnv();
const temporarySnippetName = 'Codex T0-R2 BackWPup read-only inventory';
const temporaryRoute = '/wp-json/kiduki-t0-r2/v1/backwpup-residuals';

function buildTemporarySnippetCode() {
  return `
add_action( 'rest_api_init', function () {
\tregister_rest_route(
\t\t'kiduki-t0-r2/v1',
\t\t'/backwpup-residuals',
\t\tarray(
\t\t\t'methods'             => array( 'GET', 'POST' ),
\t\t\t'permission_callback' => function () {
\t\t\t\treturn current_user_can( 'manage_options' );
\t\t\t},
\t\t\t'callback'            => function ( WP_REST_Request $request ) {
\t\t\t\tif ( 'POST' === $request->get_method() ) {
\t\t\t\t\t$id       = (int) $request->get_param( 'snippet_id' );
\t\t\t\t\t$approval = (string) $request->get_param( 'approval' );
\t\t\t\t\t$snippet  = $id > 0 ? \\Code_Snippets\\get_snippet( $id, false ) : null;
\t\t\t\t\tif (
\t\t\t\t\t\t'T0-R2-read-only-inventory-purge' !== $approval ||
\t\t\t\t\t\t! $snippet ||
\t\t\t\t\t\t(int) $snippet->id !== $id ||
\t\t\t\t\t\t'Codex T0-R2 BackWPup read-only inventory' !== (string) $snippet->name
\t\t\t\t\t) {
\t\t\t\t\t\treturn new WP_Error(
\t\t\t\t\t\t\t'kiduki_t0_r2_inventory_purge_not_allowed',
\t\t\t\t\t\t\t'The temporary inventory snippet could not be verified.',
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
\t\t\t\t$result     = array(
\t\t\t\t\t'base_path' => $base_label,
\t\t\t\t\t'exists'    => is_dir( $base_dir ),
\t\t\t\t\t'entries'   => array(),
\t\t\t\t\t'truncated' => false,
\t\t\t\t);

\t\t\t\tif ( ! is_dir( $base_dir ) ) {
\t\t\t\t\treturn $result;
\t\t\t\t}

\t\t\t\t$flags = FilesystemIterator::SKIP_DOTS;
\t\t\t\ttry {
\t\t\t\t\t$directory = new RecursiveDirectoryIterator( $base_dir, $flags );
\t\t\t\t\t$iterator  = new RecursiveIteratorIterator(
\t\t\t\t\t\t$directory,
\t\t\t\t\t\tRecursiveIteratorIterator::SELF_FIRST
\t\t\t\t\t);
\t\t\t\t} catch ( Throwable $error ) {
\t\t\t\t\treturn new WP_Error(
\t\t\t\t\t\t'kiduki_backwpup_inventory_failed',
\t\t\t\t\t\t'Could not inspect the BackWPup restore directory.',
\t\t\t\t\t\tarray( 'status' => 500 )
\t\t\t\t\t);
\t\t\t\t}

\t\t\t\t$count = 0;
\t\t\t\tforeach ( $iterator as $item ) {
\t\t\t\t\tif ( $count >= 2000 ) {
\t\t\t\t\t\t$result['truncated'] = true;
\t\t\t\t\t\tbreak;
\t\t\t\t\t}
\t\t\t\t\t$count++;

\t\t\t\t\t$absolute = $item->getPathname();
\t\t\t\t\t$relative = ltrim( str_replace( $base_dir, '', $absolute ), '/\\\\' );
\t\t\t\t\t$path     = $base_label . '/' . str_replace( '\\\\', '/', $relative );
\t\t\t\t\t$is_file  = $item->isFile() && ! $item->isLink();
\t\t\t\t\t$name     = $item->getBasename();
\t\t\t\t\t$lower    = strtolower( $name );
\t\t\t\t\t$type     = $item->isLink() ? 'symlink' : ( $item->isDir() ? 'directory' : 'file' );
\t\t\t\t\t$category = 'other';

\t\t\t\t\tif ( $item->isDir() ) {
\t\t\t\t\t\t$category = 'restore working directory';
\t\t\t\t\t} elseif ( in_array( $lower, array( 'restore.dat', 'restore.dat.bkp' ), true ) ) {
\t\t\t\t\t\t$category = 'PHP-serialized restore registry';
\t\t\t\t\t} elseif ( 'restore.log' === $lower || 'debug.log' === $lower ) {
\t\t\t\t\t\t$category = 'restore log';
\t\t\t\t\t} elseif ( in_array( $lower, array( '.htaccess', '.donotbackup' ), true ) ) {
\t\t\t\t\t\t$category = 'access/backup control marker';
\t\t\t\t\t} elseif ( preg_match( '/\\.(zip|tar|gz|tgz|bz2)$/i', $lower ) ) {
\t\t\t\t\t\t$category = 'uploaded backup archive';
\t\t\t\t\t} elseif ( 'wp-config.php' === $lower ) {
\t\t\t\t\t\t$category = 'WordPress configuration';
\t\t\t\t\t} elseif ( preg_match( '/\\.sql(\\.(gz|bz2))?$/i', $lower ) ) {
\t\t\t\t\t\t$category = 'database dump';
\t\t\t\t\t} elseif ( str_starts_with( $relative, 'extract/' ) ) {
\t\t\t\t\t\t$category = 'extracted backup content';
\t\t\t\t\t} elseif ( str_starts_with( $relative, 'uploads/' ) ) {
\t\t\t\t\t\t$category = 'restore upload';
\t\t\t\t\t}

\t\t\t\t\t$credential_fields  = array();
\t\t\t\t\t$credential_markers = array();
\t\t\t\t\t$plaintext_present  = false;
\t\t\t\t\t$serialization_ok   = null;
\t\t\t\t\tif ( $is_file && in_array( $lower, array( 'restore.dat', 'restore.dat.bkp' ), true ) ) {
\t\t\t\t\t\t$contents = file_get_contents( $absolute );
\t\t\t\t\t\t$registry = false !== $contents
\t\t\t\t\t\t\t? @unserialize( $contents, array( 'allowed_classes' => false ) )
\t\t\t\t\t\t\t: false;
\t\t\t\t\t\t$serialization_ok = is_array( $registry );
\t\t\t\t\t\tif ( is_array( $registry ) ) {
\t\t\t\t\t\t\tforeach ( array( 'dbhost', 'dbname', 'dbuser', 'dbpassword' ) as $field ) {
\t\t\t\t\t\t\t\tif ( array_key_exists( $field, $registry ) ) {
\t\t\t\t\t\t\t\t\t$credential_markers[] = $field;
\t\t\t\t\t\t\t\t}
\t\t\t\t\t\t\t\tif ( array_key_exists( $field, $registry ) && '' !== (string) $registry[ $field ] ) {
\t\t\t\t\t\t\t\t\t$credential_fields[] = $field;
\t\t\t\t\t\t\t\t}
\t\t\t\t\t\t\t}
\t\t\t\t\t\t\t$plaintext_present = count( $credential_fields ) > 0;
\t\t\t\t\t\t}
\t\t\t\t\t} elseif ( $is_file && 'wp-config.php' === $lower ) {
\t\t\t\t\t\t$contents = file_get_contents( $absolute );
\t\t\t\t\t\tif ( false !== $contents ) {
\t\t\t\t\t\t\tforeach ( array( 'DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD' ) as $field ) {
\t\t\t\t\t\t\t\tif ( preg_match( '/define\\s*\\(\\s*[\\'"]' . $field . '[\\'"]\\s*,\\s*[\\'"][^\\'"]+[\\'"]\\s*\\)/i', $contents ) ) {
\t\t\t\t\t\t\t\t\t$credential_fields[] = strtolower( $field );
\t\t\t\t\t\t\t\t\t$credential_markers[] = strtolower( $field );
\t\t\t\t\t\t\t\t}
\t\t\t\t\t\t\t}
\t\t\t\t\t\t\t$plaintext_present = count( $credential_fields ) > 0;
\t\t\t\t\t\t}
\t\t\t\t\t} elseif ( $is_file && $item->getSize() <= 2097152 ) {
\t\t\t\t\t\t$contents = file_get_contents( $absolute );
\t\t\t\t\t\tif ( false !== $contents ) {
\t\t\t\t\t\t\t$marker_patterns = array(
\t\t\t\t\t\t\t\t'dbpassword' => '/db_?password/i',
\t\t\t\t\t\t\t\t'dbuser'     => '/db_?user(name)?/i',
\t\t\t\t\t\t\t\t'dbhost'     => '/db_?host/i',
\t\t\t\t\t\t\t\t'dbname'     => '/db_?name/i',
\t\t\t\t\t\t\t);
\t\t\t\t\t\t\tforeach ( $marker_patterns as $field => $pattern ) {
\t\t\t\t\t\t\t\tif ( preg_match( $pattern, $contents ) ) {
\t\t\t\t\t\t\t\t\t$credential_markers[] = $field;
\t\t\t\t\t\t\t\t}
\t\t\t\t\t\t\t}
\t\t\t\t\t\t\t$plaintext_present = (bool) preg_match(
\t\t\t\t\t\t\t\t'/(?:db_?(?:password|user(?:name)?|host|name)|password|username)\\s*[:=]\\s*[\\'"]?[^\\s\\'"]{3,}/i',
\t\t\t\t\t\t\t\t$contents
\t\t\t\t\t\t\t);
\t\t\t\t\t\t}
\t\t\t\t\t}

\t\t\t\t\t$result['entries'][] = array(
\t\t\t\t\t\t'path'                         => $path,
\t\t\t\t\t\t'type'                         => $type,
\t\t\t\t\t\t'category'                     => $category,
\t\t\t\t\t\t'size_bytes'                   => $is_file ? $item->getSize() : null,
\t\t\t\t\t\t'modified_at_utc'              => gmdate( 'c', $item->getMTime() ),
\t\t\t\t\t\t'plaintext_credentials_present' => $plaintext_present,
\t\t\t\t\t\t'credential_markers'           => array_values( array_unique( $credential_markers ) ),
\t\t\t\t\t\t'credential_field_names'       => $credential_fields,
\t\t\t\t\t\t'serialization_valid'          => $serialization_ok,
\t\t\t\t\t);
\t\t\t\t}

\t\t\t\t$detector_class = '\\\\WPMedia\\\\BackWPup\\\\Admin\\\\Notices\\\\StaleRestoreFilesDetector';
\t\t\t\t$result['backwpup_warning_detector'] = array(
\t\t\t\t\t'available' => class_exists( $detector_class ),
\t\t\t\t\t'has_files' => null,
\t\t\t\t);
\t\t\t\tif ( class_exists( $detector_class ) ) {
\t\t\t\t\t$detector = new $detector_class();
\t\t\t\t\t$result['backwpup_warning_detector']['has_files'] = $detector->has_files();
\t\t\t\t}

\t\t\t\treturn $result;
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
  throw new Error('A previous active T0-R2 inventory snippet still exists.');
}

let snippetId = null;
let cleanup = {
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
      desc: 'Temporary read-only T0-R2 inventory. No files are changed.',
      code: buildTemporarySnippetCode(),
      tags: ['codex', 'temporary', 't0-r2', 'read-only'],
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

  const inventory = await wpRequest(env, 'GET', temporaryRoute);
  console.log(JSON.stringify(inventory.data, null, 2));
} finally {
  if (snippetId) {
    try {
      await wpRequest(
        env,
        'POST',
        temporaryRoute,
        {
          snippet_id: snippetId,
          approval: 'T0-R2-read-only-inventory-purge',
        },
      );
      cleanup.deactivated = true;
      cleanup.deleted = true;
    } catch {
      try {
        await wpRequest(
          env,
          'POST',
          `/wp-json/code-snippets/v1/snippets/${snippetId}/deactivate`,
          {},
        );
        cleanup.deactivated = true;
      } catch {
        cleanup.deactivated = false;
      }

      try {
        await wpRequest(
          env,
          'DELETE',
          `/wp-json/code-snippets/v1/snippets/${snippetId}`,
        );
        cleanup.deleted = true;
      } catch {
        cleanup.deleted = false;
      }
    }
  }

  if (snippetId && (!cleanup.deactivated || !cleanup.deleted)) {
    console.error(
      JSON.stringify(
        {
          ok: false,
          temporarySnippetCleanup: {
            id: snippetId,
            ...cleanup,
          },
        },
        null,
        2,
      ),
    );
    process.exitCode = 1;
  }
}
