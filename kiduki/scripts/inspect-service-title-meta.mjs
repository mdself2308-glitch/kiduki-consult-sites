#!/usr/bin/env node

import {
  getWordPressEnv,
  wpRequest,
} from '../../tools/wordpress-rest-utils.mjs';

const temporarySnippetName = 'Codex KIDUKI service title meta inspection bridge';
const temporaryRoute = '/wp-json/kiduki-seo/v1/service-title-meta';
const temporaryPurgeRoute = '/wp-json/kiduki-seo/v1/service-title-meta-bridge';

function buildTemporarySnippetCode() {
  return `
add_action( 'rest_api_init', function () {
\t$permission = function () {
\t\treturn current_user_can( 'manage_options' );
\t};
\t$read = function ( $post_id ) {
\t\t$result = array();
\t\tforeach ( (array) get_post_meta( $post_id ) as $key => $values ) {
\t\t\tif ( ! preg_match( '/title|header|hide|featured|layout|style/i', (string) $key ) ) {
\t\t\t\tcontinue;
\t\t\t}
\t\t\t$result[ $key ] = array_map(
\t\t\t\tfunction ( $value ) {
\t\t\t\t\t$value = maybe_unserialize( $value );
\t\t\t\t\treturn is_scalar( $value ) || null === $value
\t\t\t\t\t\t? $value
\t\t\t\t\t\t: wp_json_encode( $value );
\t\t\t\t},
\t\t\t\t(array) $values
\t\t\t);
\t\t}
\t\tksort( $result );
\t\treturn $result;
\t};

\tregister_rest_route(
\t\t'kiduki-seo/v1',
\t\t'/service-title-meta',
\t\tarray(
\t\t\t'methods'             => 'GET',
\t\t\t'permission_callback' => $permission,
\t\t\t'callback'            => function () use ( $read ) {
\t\t\t\treturn array(
\t\t\t\t\t'service_page_29'   => $read( 29 ),
\t\t\t\t\t'reference_page_31' => $read( 31 ),
\t\t\t\t);
\t\t\t},
\t\t)
\t);

\tregister_rest_route(
\t\t'kiduki-seo/v1',
\t\t'/service-title-meta-bridge',
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
  throw new Error(`A previous temporary title-meta bridge exists: ${duplicate.id}`);
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
      desc: 'Temporary read-only page title visibility inspection bridge.',
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
  const result = await wpRequest(env, 'GET', temporaryRoute);
  const cleanup = await wpRequest(env, 'POST', temporaryPurgeRoute, {
    snippet_id: snippetId,
  });
  purged = cleanup.data.deleted === true;
  if (!purged) throw new Error('Temporary title-meta bridge was not purged.');

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
