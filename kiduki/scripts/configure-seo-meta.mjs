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
const manifestPath = path.resolve(
  args.manifest || 'kiduki/config/seo-release-2026-08-17.json',
);
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const requestedIds = args.ids
  ? new Set(String(args.ids).split(',').map((value) => Number(value.trim())))
  : null;
const items = (manifest.items || []).filter(
  (item) => !requestedIds || requestedIds.has(Number(item.id)),
);

if (!items.length) throw new Error('No SEO metadata items were selected.');
if (apply && (!backup || !backupConfirmed)) {
  throw new Error(
    'Refusing SEO metadata update without --backup --backup-confirmed.',
  );
}

const temporarySnippetName = `Codex KIDUKI SEO meta bridge ${manifest.release}`;
const temporaryRoute = '/wp-json/kiduki-seo/v1/meta';
const temporaryPurgeRoute = '/wp-json/kiduki-seo/v1/purge';

function phpString(value) {
  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function buildTemporarySnippetCode() {
  const phpItems = items
    .map(
      (item) =>
        `${Number(item.id)} => array( 'type' => ${phpString(item.type)}, 'slug' => ${phpString(item.slug)}, 'title' => ${phpString(item.title)}, 'description' => ${phpString(item.metaDescription)} )`,
    )
    .join(",\n\t\t");

  return `
add_action( 'rest_api_init', function () {
\t$permission = function () {
\t\treturn current_user_can( 'manage_options' );
\t};
\t$allowed = array(
\t\t${phpItems}
\t);
\t$read_state = function () use ( $allowed ) {
\t\t$items = array();
\t\tforeach ( $allowed as $id => $target ) {
\t\t\t$post = get_post( $id );
\t\t\tif ( ! $post || $target['type'] !== $post->post_type ) {
\t\t\t\treturn new WP_Error(
\t\t\t\t\t'kiduki_seo_identity_mismatch',
\t\t\t\t\t'SEO target identity mismatch for post ' . $id,
\t\t\t\t\tarray( 'status' => 409 )
\t\t\t\t);
\t\t\t}
\t\t\t$items[] = array(
\t\t\t\t'id'               => (int) $post->ID,
\t\t\t\t'type'             => $post->post_type,
\t\t\t\t'slug'             => $post->post_name,
\t\t\t\t'title'            => get_the_title( $post ),
\t\t\t\t'status'           => $post->post_status,
\t\t\t\t'modified'         => $post->post_modified,
\t\t\t\t'meta_description' => (string) get_post_meta( $id, 'emanon_meta_description', true ),
\t\t\t);
\t\t}
\t\treturn array( 'items' => $items );
\t};

\tregister_rest_route(
\t\t'kiduki-seo/v1',
\t\t'/meta',
\t\tarray(
\t\t\tarray(
\t\t\t\t'methods'             => 'GET',
\t\t\t\t'permission_callback' => $permission,
\t\t\t\t'callback'            => $read_state,
\t\t\t),
\t\t\tarray(
\t\t\t\t'methods'             => 'POST',
\t\t\t\t'permission_callback' => $permission,
\t\t\t\t'callback'            => function () use ( $allowed, $read_state ) {
\t\t\t\t\tforeach ( $allowed as $id => $target ) {
\t\t\t\t\t\t$post = get_post( $id );
\t\t\t\t\t\tif (
\t\t\t\t\t\t\t! $post ||
\t\t\t\t\t\t\t$target['type'] !== $post->post_type ||
\t\t\t\t\t\t\t$target['slug'] !== $post->post_name ||
\t\t\t\t\t\t\t$target['title'] !== get_the_title( $post )
\t\t\t\t\t\t) {
\t\t\t\t\t\t\treturn new WP_Error(
\t\t\t\t\t\t\t\t'kiduki_seo_release_not_ready',
\t\t\t\t\t\t\t\t'Content release is not in the expected state for post ' . $id,
\t\t\t\t\t\t\t\tarray( 'status' => 409 )
\t\t\t\t\t\t\t);
\t\t\t\t\t\t}
\t\t\t\t\t\tupdate_post_meta(
\t\t\t\t\t\t\t$id,
\t\t\t\t\t\t\t'emanon_meta_description',
\t\t\t\t\t\t\tsanitize_text_field( $target['description'] )
\t\t\t\t\t\t);
\t\t\t\t\t\tif ( function_exists( 'w3tc_flush_url' ) ) {
\t\t\t\t\t\t\tw3tc_flush_url( get_permalink( $id ) );
\t\t\t\t\t\t}
\t\t\t\t\t}
\t\t\t\t\treturn $read_state();
\t\t\t\t},
\t\t\t),
\t\t)
\t);

\tregister_rest_route(
\t\t'kiduki-seo/v1',
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
    `A previous temporary SEO metadata snippet still exists: ${duplicate.id}`,
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
      desc: 'Temporary allowlisted SEO metadata bridge. Remove immediately after use.',
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

  const before = await wpRequest(env, 'GET', temporaryRoute);
  const targetById = new Map(items.map((item) => [Number(item.id), item]));
  const comparison = before.data.items.map((current) => {
    const target = targetById.get(Number(current.id));
    return {
      ...current,
      nextMetaDescription: target.metaDescription,
      contentReleaseReady:
        current.slug === target.slug && current.title === target.title,
      changed: current.meta_description !== target.metaDescription,
    };
  });

  if (!apply) {
    const purge = await wpRequest(env, 'POST', temporaryPurgeRoute, {
      snippet_id: snippetId,
    });
    purged = purge.data.deleted === true;
    if (!purged) {
      throw new Error('Temporary SEO metadata dry-run bridge did not purge itself.');
    }
    console.log(
      JSON.stringify(
        {
          ok: true,
          mode: 'dry-run',
          persistentWrites: false,
          release: manifest.release,
          contentReleaseReady: comparison.every(
            (item) => item.contentReleaseReady,
          ),
          comparison,
          temporarySnippetPurged: true,
        },
        null,
        2,
      ),
    );
    process.exit(0);
  }

  if (!comparison.every((item) => item.contentReleaseReady)) {
    throw new Error(
      'Content titles/slugs do not match the reviewed SEO release. Apply and verify the content release first.',
    );
  }

  const backupDir = path.resolve('backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(
    backupDir,
    `wp-seo-meta-before-${safeStamp()}.json`,
  );
  fs.writeFileSync(backupPath, `${JSON.stringify(before.data, null, 2)}\n`, {
    mode: 0o600,
  });
  fs.chmodSync(backupPath, 0o600);

  const updated = await wpRequest(env, 'POST', temporaryRoute, {});
  for (const current of updated.data.items) {
    const target = targetById.get(Number(current.id));
    if (current.meta_description !== target.metaDescription) {
      throw new Error(`SEO metadata verification failed for ${current.id}.`);
    }
  }

  const purge = await wpRequest(env, 'POST', temporaryPurgeRoute, {
    snippet_id: snippetId,
  });
  purged = purge.data.deleted === true;
  if (!purged) throw new Error('Temporary SEO metadata bridge did not purge itself.');

  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: 'apply',
        release: manifest.release,
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
            temporarySnippetCleanup: { id: snippetId, deleted: false },
          },
          null,
          2,
        ),
      );
      process.exitCode = 1;
    }
  }
}
