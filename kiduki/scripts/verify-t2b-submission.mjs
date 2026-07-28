#!/usr/bin/env node

import {
  getWordPressEnv,
  wpRequest,
} from '../../tools/wordpress-rest-utils.mjs';

const temporarySnippetName = 'Codex T2B submission verification bridge';
const temporaryRoute = '/wp-json/kiduki-t2b/v1/submission';
const temporaryPurgeRoute = '/wp-json/kiduki-t2b/v1/submission-purge';
const env = getWordPressEnv();

function buildTemporarySnippetCode() {
  return `
add_action( 'rest_api_init', function () {
\t$permission = function () {
\t\treturn current_user_can( 'manage_options' );
\t};

\tregister_rest_route(
\t\t'kiduki-t2b/v1',
\t\t'/submission',
\t\tarray(
\t\t\t'methods'             => 'GET',
\t\t\t'permission_callback' => $permission,
\t\t\t'callback'            => function () {
\t\t\t\t$counts = wp_count_posts( 'flamingo_inbound' );
\t\t\t\t$posts = get_posts(
\t\t\t\t\tarray(
\t\t\t\t\t\t'post_type'      => 'flamingo_inbound',
\t\t\t\t\t\t'post_status'    => 'any',
\t\t\t\t\t\t'posts_per_page' => 20,
\t\t\t\t\t\t'orderby'        => 'date',
\t\t\t\t\t\t'order'          => 'DESC',
\t\t\t\t\t)
\t\t\t\t);

\t\t\t\t$t2b_match = null;
\t\t\t\t$t6_match  = null;
\t\t\t\tforeach ( $posts as $post ) {
\t\t\t\t\t$meta = get_post_meta( $post->ID );
\t\t\t\t\t$haystack = wp_json_encode(
\t\t\t\t\t\tarray(
\t\t\t\t\t\t\t'title'   => $post->post_title,
\t\t\t\t\t\t\t'content' => $post->post_content,
\t\t\t\t\t\t\t'meta'    => $meta,
\t\t\t\t\t\t),
\t\t\t\t\t\tJSON_UNESCAPED_UNICODE
\t\t\t\t\t);
\t\t\t\t\tif (
\t\t\t\t\t\tnull === $t2b_match
\t\t\t\t\t\t&& false !== strpos( $haystack, 'KIDUKIフォーム動作確認' )
\t\t\t\t\t\t&& false !== strpos( $haystack, 'Phase 1問い合わせフォームの送受信・DB保存確認です。' )
\t\t\t\t\t) {
\t\t\t\t\t\t$t2b_match = array(
\t\t\t\t\t\t\t'id'                 => (int) $post->ID,
\t\t\t\t\t\t\t'date_gmt'           => get_post_time( DATE_ATOM, true, $post ),
\t\t\t\t\t\t\t'status'             => $post->post_status,
\t\t\t\t\t\t\t'company_marker'     => true,
\t\t\t\t\t\t\t'message_marker'     => true,
\t\t\t\t\t\t\t'email_field_present' => false !== strpos( $haystack, 'your-email' ),
\t\t\t\t\t\t\t'field_keys'         => array_values(
\t\t\t\t\t\t\t\tarray_filter(
\t\t\t\t\t\t\t\t\tarray_keys( $meta ),
\t\t\t\t\t\t\t\t\tfunction ( $key ) {
\t\t\t\t\t\t\t\t\t\treturn 0 === strpos( $key, '_field_' );
\t\t\t\t\t\t\t\t\t}
\t\t\t\t\t\t\t\t)
\t\t\t\t\t\t\t),
\t\t\t\t\t\t);
\t\t\t\t\t}
\t\t\t\t\tif (
\t\t\t\t\t\tnull === $t6_match
\t\t\t\t\t\t&& false !== strpos( $haystack, 'KIDUKI T6最終確認' )
\t\t\t\t\t\t&& false !== strpos( $haystack, 'Phase 1 T6最終検証です。' )
\t\t\t\t\t) {
\t\t\t\t\t\t$t6_match = array(
\t\t\t\t\t\t\t'id'                  => (int) $post->ID,
\t\t\t\t\t\t\t'date_gmt'            => get_post_time( DATE_ATOM, true, $post ),
\t\t\t\t\t\t\t'status'              => $post->post_status,
\t\t\t\t\t\t\t'company_marker'      => true,
\t\t\t\t\t\t\t'message_marker'      => true,
\t\t\t\t\t\t\t'email_field_present' => false !== strpos( $haystack, 'your-email' ),
\t\t\t\t\t\t\t'field_keys'          => array_values(
\t\t\t\t\t\t\t\tarray_filter(
\t\t\t\t\t\t\t\t\tarray_keys( $meta ),
\t\t\t\t\t\t\t\t\tfunction ( $key ) {
\t\t\t\t\t\t\t\t\t\treturn 0 === strpos( $key, '_field_' );
\t\t\t\t\t\t\t\t\t}
\t\t\t\t\t\t\t\t)
\t\t\t\t\t\t\t),
\t\t\t\t\t\t);
\t\t\t\t\t}
\t\t\t\t\tif ( null !== $t2b_match && null !== $t6_match ) {
\t\t\t\t\t\tbreak;
\t\t\t\t\t}
\t\t\t\t}

\t\t\t\treturn array(
\t\t\t\t\t'flamingo_available' => class_exists( 'Flamingo_Inbound_Message' ),
\t\t\t\t\t'published_count'    => isset( $counts->publish ) ? (int) $counts->publish : 0,
\t\t\t\t\t'searched_count'     => count( $posts ),
\t\t\t\t\t'test_submission'    => $t2b_match,
\t\t\t\t\t't6_submission'      => $t6_match,
\t\t\t\t);
\t\t\t},
\t\t)
\t);

\tregister_rest_route(
\t\t'kiduki-t2b/v1',
\t\t'/submission-purge',
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
    `A previous temporary T2B verification snippet still exists: ${duplicate.id}`,
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
      desc: 'Temporary read-only Flamingo verification bridge. Remove immediately after use.',
      code: buildTemporarySnippetCode(),
      tags: ['codex', 'temporary', 't2b'],
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
  const state = await wpRequest(env, 'GET', temporaryRoute);
  const purge = await wpRequest(env, 'POST', temporaryPurgeRoute, {
    snippet_id: snippetId,
  });
  purged = purge.data.deleted === true;
  if (!purged) {
    throw new Error('Temporary T2B verification bridge did not purge itself.');
  }
  if (!state.data.test_submission || !state.data.t6_submission) {
    throw new Error('The T2B/T6 test submissions were not found in Flamingo.');
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        persistentWrites: false,
        valuesDisplayed: false,
        ...state.data,
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
