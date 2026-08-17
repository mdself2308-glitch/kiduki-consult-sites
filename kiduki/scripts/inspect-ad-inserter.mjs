#!/usr/bin/env node

import {
  getWordPressEnv,
  wpRequest,
} from '../../tools/wordpress-rest-utils.mjs';

const temporarySnippetName = 'Codex KIDUKI Ad Inserter inspection bridge';
const temporaryRoute = '/wp-json/kiduki-leadgen/v1/ad-inserter';
const temporaryPurgeRoute = '/wp-json/kiduki-leadgen/v1/ad-inserter-bridge';

function buildTemporarySnippetCode() {
  return `
add_action( 'rest_api_init', function () {
\t$permission = function () {
\t\treturn current_user_can( 'manage_options' );
\t};

\tregister_rest_route(
\t\t'kiduki-leadgen/v1',
\t\t'/ad-inserter',
\t\tarray(
\t\t\t'methods'             => 'GET',
\t\t\t'permission_callback' => $permission,
\t\t\t'callback'            => function () {
\t\t\t\tglobal $wpdb;
\t\t\t\t$like         = $wpdb->esc_like( 'ad_inserter' ) . '%';
\t\t\t\t$adsense_like = '%' . $wpdb->esc_like( 'adsense' ) . '%';
\t\t\t\t$rows = $wpdb->get_results(
\t\t\t\t\t$wpdb->prepare(
\t\t\t\t\t\t"SELECT option_name, option_value, autoload FROM {$wpdb->options} WHERE option_name LIKE %s OR option_name LIKE %s OR option_name = 'googlesitekit_active_modules' ORDER BY option_name ASC",
\t\t\t\t\t\t$like,
\t\t\t\t\t\t$adsense_like
\t\t\t\t\t),
\t\t\t\t\tARRAY_A
\t\t\t\t);
\t\t\t\t$options = array();
\t\t\t\tforeach ( $rows as $row ) {
\t\t\t\t\t$value = maybe_unserialize( $row['option_value'] );
\t\t\t\t\t$options[] = array(
\t\t\t\t\t\t'name'     => $row['option_name'],
\t\t\t\t\t\t'autoload' => $row['autoload'],
\t\t\t\t\t\t'type'     => gettype( $value ),
\t\t\t\t\t\t'value'    => $value,
\t\t\t\t\t);
\t\t\t\t}
\t\t\t\t$ad_theme_mods = array();
\t\t\t\tforeach ( (array) get_theme_mods() as $key => $value ) {
\t\t\t\t\tif ( preg_match( '/ad|adsense|advert/i', (string) $key ) ) {
\t\t\t\t\t\t$ad_theme_mods[ $key ] = $value;
\t\t\t\t\t}
\t\t\t\t}
\t\t\t\tksort( $ad_theme_mods );
\t\t\t\treturn array(
\t\t\t\t\t'active'        => in_array( 'ad-inserter/ad-inserter.php', (array) get_option( 'active_plugins', array() ), true ),
\t\t\t\t\t'options'       => $options,
\t\t\t\t\t'theme'         => get_stylesheet(),
\t\t\t\t\t'ad_theme_mods' => $ad_theme_mods,
\t\t\t\t);
\t\t\t},
\t\t)
\t);

\tregister_rest_route(
\t\t'kiduki-leadgen/v1',
\t\t'/ad-inserter-bridge',
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
    `A previous temporary Ad Inserter inspection snippet exists: ${duplicate.id}`,
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
      desc: 'Temporary read-only Ad Inserter settings bridge.',
      code: buildTemporarySnippetCode(),
      tags: ['codex', 'temporary', 'leadgen'],
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
  const result = await wpRequest(env, 'GET', temporaryRoute);
  const cleanup = await wpRequest(env, 'POST', temporaryPurgeRoute, {
    snippet_id: snippetId,
  });
  purged = cleanup.data.deleted === true;
  if (!purged) throw new Error('Temporary inspection bridge was not purged.');

  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: 'read-only',
        persistentWrites: false,
        ...result.data,
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
