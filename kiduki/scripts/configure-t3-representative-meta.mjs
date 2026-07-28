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
const pageId = 43;
const metaDescription =
  'KIDUKIコンサルティング産業医事務所 代表 宮部大輔の経歴・資格・所属学会をご紹介します。';
const temporarySnippetName =
  'Codex T3 representative meta description bridge';
const temporaryRoute = '/wp-json/kiduki-t3/v1/meta-description';
const temporaryPurgeRoute =
  '/wp-json/kiduki-t3/v1/meta-description-purge';

if (apply && (!backup || !backupConfirmed)) {
  throw new Error(
    'Refusing T3 meta update without --backup --backup-confirmed.',
  );
}

function buildTemporarySnippetCode() {
  return `
add_action( 'rest_api_init', function () {
\t$permission = function () {
\t\treturn current_user_can( 'manage_options' );
\t};
\t$read_state = function () {
\t\t$page = get_post( 43 );
\t\tif ( ! $page || 'page' !== $page->post_type || 'greeting' !== $page->post_name ) {
\t\t\treturn new WP_Error(
\t\t\t\t'kiduki_t3_page_mismatch',
\t\t\t\t'T3 representative page identity mismatch.',
\t\t\t\tarray( 'status' => 409 )
\t\t\t);
\t\t}
\t\treturn array(
\t\t\t'id'               => (int) $page->ID,
\t\t\t'slug'             => $page->post_name,
\t\t\t'status'           => $page->post_status,
\t\t\t'meta_description' => (string) get_post_meta( 43, 'emanon_meta_description', true ),
\t\t);
\t};

\tregister_rest_route(
\t\t'kiduki-t3/v1',
\t\t'/meta-description',
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
\t\t\t\t\t$description = sanitize_text_field(
\t\t\t\t\t\t(string) $request->get_param( 'meta_description' )
\t\t\t\t\t);
\t\t\t\t\tif ( '' === $description ) {
\t\t\t\t\t\treturn new WP_Error(
\t\t\t\t\t\t\t'kiduki_t3_description_missing',
\t\t\t\t\t\t\t'Meta description is required.',
\t\t\t\t\t\t\tarray( 'status' => 400 )
\t\t\t\t\t\t);
\t\t\t\t\t}
\t\t\t\t\tupdate_post_meta( 43, 'emanon_meta_description', $description );
\t\t\t\t\tif ( function_exists( 'w3tc_flush_url' ) ) {
\t\t\t\t\t\tw3tc_flush_url( get_permalink( 43 ) );
\t\t\t\t\t}
\t\t\t\t\treturn $read_state();
\t\t\t\t},
\t\t\t),
\t\t)
\t);

\tregister_rest_route(
\t\t'kiduki-t3/v1',
\t\t'/meta-description-purge',
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
    `A previous temporary T3 meta snippet still exists: ${duplicate.id}`,
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
      desc: 'Temporary allowlisted T3 meta-description bridge. Remove immediately after use.',
      code: buildTemporarySnippetCode(),
      tags: ['codex', 'temporary', 't3'],
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
  if (!apply) {
    const purge = await wpRequest(env, 'POST', temporaryPurgeRoute, {
      snippet_id: snippetId,
    });
    purged = purge.data.deleted === true;
    if (!purged) {
      throw new Error('Temporary T3 meta dry-run bridge did not purge itself.');
    }
    console.log(
      JSON.stringify(
        {
          ok: true,
          mode: 'dry-run',
          persistentWrites: false,
          current: before.data,
          next: {
            ...before.data,
            meta_description: metaDescription,
          },
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
    `wp-page-43-meta-before-${safeStamp()}.json`,
  );
  fs.writeFileSync(
    backupPath,
    `${JSON.stringify(before.data, null, 2)}\n`,
    { mode: 0o600 },
  );
  fs.chmodSync(backupPath, 0o600);

  const updated = await wpRequest(env, 'POST', temporaryRoute, {
    meta_description: metaDescription,
  });
  if (updated.data.meta_description !== metaDescription) {
    throw new Error('T3 meta-description verification failed.');
  }

  const purge = await wpRequest(env, 'POST', temporaryPurgeRoute, {
    snippet_id: snippetId,
  });
  purged = purge.data.deleted === true;
  if (!purged) {
    throw new Error('Temporary T3 meta bridge did not purge itself.');
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: 'apply',
        backupPath,
        state: updated.data,
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
