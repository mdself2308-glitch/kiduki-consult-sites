import fs from 'node:fs';
import path from 'node:path';
import {
  getWordPressEnv,
  parseArgs,
  safeStamp,
  wpRequest,
} from '../../tools/wordpress-rest-utils.mjs';

/**
 * Remove the temporary "Codex R*" bridge snippets left behind by the other
 * scripts here.
 *
 * Two separate faults produced the mess:
 *
 * 1. This Code Snippets build returns 500 from `DELETE /snippets/{id}`, so the
 *    bridges could never remove themselves. They worked around it by blanking
 *    the code first, which neutralises the snippet but leaves the row.
 * 2. The blanking `POST /snippets/{id}` itself inserts a *new* row rather than
 *    updating, so every bridge run left two rows instead of one.
 *
 * So this script does not blank anything, and it deletes through the plugin's
 * own PHP delete function instead of the broken REST route. It removes itself
 * from a shutdown hook, after the response has been sent.
 *
 * Safety: a snippet is only ever deleted when all three hold -- the name looks
 * like a Codex bridge, it is inactive, and its code is empty. The ids are also
 * passed in explicitly from the caller, so the PHP side never decides on its
 * own what to remove.
 */
const NAME_PATTERN = /^(\(無効・削除待ち\)\s*)?Codex R\d+[a-z]?\b/;
const temporarySnippetName = 'Codex R17 snippet cleanup';
const temporaryRoute = '/wp-json/kiduki-r17/v1/cleanup-snippets';

const args = parseArgs(process.argv.slice(2));
const apply = Boolean(args.apply);
const backup = Boolean(args.backup);
const backupConfirmed = Boolean(args['backup-confirmed']);

if (apply && (!backup || !backupConfirmed)) {
  throw new Error('Refusing to delete snippets without --backup --backup-confirmed.');
}

const env = getWordPressEnv();

const all = await wpRequest(
  env,
  'GET',
  '/wp-json/code-snippets/v1/snippets?context=edit&per_page=100',
);

const BRIDGE_ROUTE = /kiduki-r\d+[a-z]?\/v1/;
const doomed = all.data.filter((s) => {
  if (!NAME_PATTERN.test(s.name || '')) return false;
  if (s.active) return false;
  const code = (s.code || '').trim();
  // Blanked leftovers, or bridges still holding one of our own routes.
  return code.length === 0 || BRIDGE_ROUTE.test(code);
});
const keptCodex = all.data.filter(
  (s) => NAME_PATTERN.test(s.name || '') && !doomed.includes(s),
);

if (!apply) {
  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: 'dry-run',
        totalSnippets: all.data.length,
        wouldDelete: doomed.map((s) => ({ id: s.id, name: s.name })),
        codexSnippetsNotSafeToDelete: keptCodex.map((s) => ({
          id: s.id,
          name: s.name,
          active: s.active,
          codeLength: (s.code || '').trim().length,
        })),
        untouched: all.data
          .filter((s) => !NAME_PATTERN.test(s.name || ''))
          .map((s) => ({ id: s.id, name: s.name, active: s.active })),
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

const dir = path.resolve('backups');
fs.mkdirSync(dir, { recursive: true });
const backupPath = path.join(dir, `code-snippets-before-${safeStamp()}.json`);
fs.writeFileSync(
  backupPath,
  JSON.stringify({ takenAt: new Date().toISOString(), snippets: all.data }, null, 2),
);

const ids = doomed.map((s) => Number(s.id)).filter(Number.isInteger);

function buildSnippetCode() {
  return `
add_action( 'rest_api_init', function () {
\tregister_rest_route(
\t\t'kiduki-r17/v1',
\t\t'/cleanup-snippets',
\t\tarray(
\t\t\t'methods'             => 'POST',
\t\t\t'permission_callback' => function () {
\t\t\t\treturn current_user_can( 'manage_options' );
\t\t\t},
\t\t\t'callback'            => function ( $request ) {
\t\t\t\tglobal $wpdb;

\t\t\t\t$requested = array_map( 'intval', (array) $request->get_param( 'ids' ) );
\t\t\t\t$self      = intval( $request->get_param( 'self' ) );
\t\t\t\t$table     = $wpdb->prefix . 'snippets';

\t\t\t\tif ( $table !== $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $table ) ) ) {
\t\t\t\t\treturn new WP_Error( 'kiduki_no_table', 'Snippets table not found.', array( 'status' => 409 ) );
\t\t\t\t}

\t\t\t\t$remove = function ( $id ) use ( $wpdb, $table ) {
\t\t\t\t\t// Re-check the guards server-side. The active column does not
\t\t\t\t\t// agree with what the REST API reports on this install, so it is
\t\t\t\t\t// deliberately not used as a guard: a snippet with empty code
\t\t\t\t\t// executes nothing whatever that column says. The guards that do
\t\t\t\t\t// matter are the empty code, the Codex name, and staying clear of
\t\t\t\t\t// the site own snippets (ids 1-5).
\t\t\t\t\t$row = $wpdb->get_row( $wpdb->prepare( "SELECT id, name, active, code FROM {$table} WHERE id = %d", $id ), ARRAY_A );
\t\t\t\t\tif ( ! $row ) {
\t\t\t\t\t\treturn 'missing';
\t\t\t\t\t}
\t\t\t\t\tif ( intval( $row['id'] ) <= 5 ) {
\t\t\t\t\t\treturn 'skipped-site-owned';
\t\t\t\t\t}
\t\t\t\t\t$code = trim( (string) $row['code'] );
\t\t\t\t\t// Either already neutralised, or still carrying one of our own
\t\t\t\t\t// bridge routes. Nothing else is ever a candidate.
\t\t\t\t\tif ( '' !== $code && ! preg_match( '#kiduki-r\\\\d+[a-z]?/v1#', $code ) ) {
\t\t\t\t\t\treturn 'skipped-foreign-code';
\t\t\t\t\t}
\t\t\t\t\tif ( ! preg_match( '/Codex R\\\\d/', (string) $row['name'] ) ) {
\t\t\t\t\t\treturn 'skipped-name';
\t\t\t\t\t}
\t\t\t\t\tif ( function_exists( 'delete_snippet' ) ) {
\t\t\t\t\t\tdelete_snippet( $id );
\t\t\t\t\t} else {
\t\t\t\t\t\t$wpdb->delete( $table, array( 'id' => $id ), array( '%d' ) );
\t\t\t\t\t}
\t\t\t\t\t$still = $wpdb->get_var( $wpdb->prepare( "SELECT id FROM {$table} WHERE id = %d", $id ) );
\t\t\t\t\treturn $still ? 'failed' : 'deleted';
\t\t\t\t};

\t\t\t\t$results = array();
\t\t\t\tforeach ( $requested as $id ) {
\t\t\t\t\tif ( $id === $self ) {
\t\t\t\t\t\tcontinue;
\t\t\t\t\t}
\t\t\t\t\t$results[ $id ] = $remove( $id );
\t\t\t\t}

\t\t\t\t// Remove this bridge itself once the response has been sent, so the
\t\t\t\t// snippet is not deleted out from under the running request.
\t\t\t\tif ( $self ) {
\t\t\t\t\tregister_shutdown_function( function () use ( $wpdb, $table, $self ) {
\t\t\t\t\t\t$wpdb->delete( $table, array( 'id' => $self ), array( '%d' ) );
\t\t\t\t\t\tif ( function_exists( 'code_snippets' ) ) {
\t\t\t\t\t\t\twp_cache_flush();
\t\t\t\t\t\t}
\t\t\t\t\t} );
\t\t\t\t}

\t\t\t\t$remaining = $wpdb->get_var( "SELECT COUNT(*) FROM {$table}" );

\t\t\t\treturn array(
\t\t\t\t\t'results'            => $results,
\t\t\t\t\t'deleteSnippetExists'=> function_exists( 'delete_snippet' ),
\t\t\t\t\t'rowsBeforeSelf'     => intval( $remaining ),
\t\t\t\t\t'selfScheduled'      => (bool) $self,
\t\t\t\t);
\t\t\t},
\t\t)
\t);
} );
`;
}

let snippetId = null;

try {
  const created = await wpRequest(env, 'POST', '/wp-json/code-snippets/v1/snippets', {
    name: temporarySnippetName,
    desc: 'Temporary R17 bridge. Deletes itself on shutdown.',
    code: buildSnippetCode(),
    tags: ['codex', 'temporary', 'r17'],
    scope: 'global',
    active: false,
    priority: 10,
    network: false,
    shared_network: false,
  });

  snippetId = Number(created.data.id);
  if (!snippetId) {
    throw new Error('Code Snippets did not return a snippet id.');
  }

  await wpRequest(env, 'POST', `/wp-json/code-snippets/v1/snippets/${snippetId}/activate`, {});

  const result = await wpRequest(env, 'POST', temporaryRoute, { ids, self: snippetId });

  // Deactivate only. Blanking is what duplicated rows in the first place.
  try {
    await wpRequest(env, 'POST', `/wp-json/code-snippets/v1/snippets/${snippetId}/deactivate`, {});
  } catch {
    // The bridge may already have removed itself on shutdown.
  }

  const after = await wpRequest(
    env,
    'GET',
    '/wp-json/code-snippets/v1/snippets?context=edit&per_page=100',
  );
  const leftover = after.data.filter((s) => NAME_PATTERN.test(s.name || ''));

  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: 'apply',
        backupPath,
        requested: ids,
        ...result.data,
        snippetsNow: after.data.length,
        codexLeftover: leftover.map((s) => ({ id: s.id, name: s.name, active: s.active })),
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error(`Cleanup failed: ${error.message}`);
  if (snippetId) {
    console.error(`Temporary snippet ${snippetId} may still exist. Check the admin UI.`);
  }
  process.exitCode = 1;
}
