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
const apply = Boolean(args.apply);
const backup = Boolean(args.backup);
const backupConfirmed = Boolean(args['backup-confirmed']);
const temporarySnippetName = 'Codex KIDUKI lead-generation ad policy bridge';
const temporaryRoute = '/wp-json/kiduki-leadgen/v1/ad-policy';
const temporaryPurgeRoute = '/wp-json/kiduki-leadgen/v1/ad-policy-bridge';

if (apply && (!backup || !backupConfirmed)) {
  throw new Error(
    'Refusing to change the lead-generation ad policy without --backup --backup-confirmed.',
  );
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function buildTemporarySnippetCode() {
  const write = apply ? 'true' : 'false';
  return `
add_action( 'rest_api_init', function () {
\t$permission = function () {
\t\treturn current_user_can( 'manage_options' );
\t};
\t$theme_keys = array(
\t\t'ad_in_feed_code_pc',
\t\t'ad_in_feed_code_sp',
\t\t'display_ad_code',
\t\t'link_ad_code',
\t\t'matched_content_ad_code',
\t\t'display_ad_content_page',
\t\t'display_ad_content_post',
\t\t'display_ad_h2_page',
\t\t'display_ad_h2_post',
\t\t'display_ad_in_feed_archive',
\t\t'display_ad_in_feed_front_page',
\t\t'display_ad_in_feed_home',
\t\t'display_ad_matched_content',
\t\t'display_ad_related_article',
\t\t'display_ad_sidebar_top',
\t);
\t$read_state = function () use ( $theme_keys ) {
\t\t$theme_mods = array();
\t\tforeach ( $theme_keys as $key ) {
\t\t\t$theme_mods[ $key ] = get_theme_mod( $key, null );
\t\t}
\t\t$adsense_settings = (array) get_option( 'googlesitekit_adsense_settings', array() );
\t\t$state = array(
\t\t\t'ad_inserter_active' => in_array(
\t\t\t\t'ad-inserter/ad-inserter.php',
\t\t\t\t(array) get_option( 'active_plugins', array() ),
\t\t\t\ttrue
\t\t\t),
\t\t\t'site_kit_active_modules' => array_values(
\t\t\t\t(array) get_option( 'googlesitekit_active_modules', array() )
\t\t\t),
\t\t\t'site_kit_adsense_settings' => array(
\t\t\t\t'accountID'           => $adsense_settings['accountID'] ?? '',
\t\t\t\t'accountStatus'       => $adsense_settings['accountStatus'] ?? '',
\t\t\t\t'accountSetupComplete'=> (bool) ( $adsense_settings['accountSetupComplete'] ?? false ),
\t\t\t\t'siteSetupComplete'   => (bool) ( $adsense_settings['siteSetupComplete'] ?? false ),
\t\t\t\t'useSnippet'          => (bool) ( $adsense_settings['useSnippet'] ?? false ),
\t\t\t),
\t\t\t'theme'      => get_stylesheet(),
\t\t\t'theme_mods' => $theme_mods,
\t\t);
\t\t$state['state_hash'] = hash( 'sha256', wp_json_encode( $state ) );
\t\treturn $state;
\t};

\tregister_rest_route(
\t\t'kiduki-leadgen/v1',
\t\t'/ad-policy',
\t\tarray(
\t\t\tarray(
\t\t\t\t'methods'             => 'GET',
\t\t\t\t'permission_callback' => $permission,
\t\t\t\t'callback'            => $read_state,
\t\t\t),
\t\t\tarray(
\t\t\t\t'methods'             => 'POST',
\t\t\t\t'permission_callback' => $permission,
\t\t\t\t'callback'            => function ( WP_REST_Request $request ) use ( $read_state, $theme_keys ) {
\t\t\t\t\t$before = $read_state();
\t\t\t\t\tif ( $request->get_param( 'state_hash' ) !== $before['state_hash'] ) {
\t\t\t\t\t\treturn new WP_Error(
\t\t\t\t\t\t\t'kiduki_ad_policy_state_changed',
\t\t\t\t\t\t\t'Ad policy state changed after backup.',
\t\t\t\t\t\t\tarray( 'status' => 409 )
\t\t\t\t\t\t);
\t\t\t\t\t}
\t\t\t\t\tif ( ${write} ) {
\t\t\t\t\t\tif ( $before['ad_inserter_active'] ) {
\t\t\t\t\t\t\tdeactivate_plugins( 'ad-inserter/ad-inserter.php', true );
\t\t\t\t\t\t}
\t\t\t\t\t\t$active_modules = array_values(
\t\t\t\t\t\t\tarray_filter(
\t\t\t\t\t\t\t\t$before['site_kit_active_modules'],
\t\t\t\t\t\t\t\tfunction ( $module ) {
\t\t\t\t\t\t\t\t\treturn 'adsense' !== $module;
\t\t\t\t\t\t\t\t}
\t\t\t\t\t\t\t)
\t\t\t\t\t\t);
\t\t\t\t\t\tupdate_option( 'googlesitekit_active_modules', $active_modules );
\t\t\t\t\t\t$adsense_settings = (array) get_option( 'googlesitekit_adsense_settings', array() );
\t\t\t\t\t\t$adsense_settings['useSnippet'] = false;
\t\t\t\t\t\tupdate_option( 'googlesitekit_adsense_settings', $adsense_settings );
\t\t\t\t\t\tforeach ( $theme_keys as $key ) {
\t\t\t\t\t\t\tset_theme_mod( $key, '' );
\t\t\t\t\t\t}
\t\t\t\t\t}

\t\t\t\t\t$after = $read_state();
\t\t\t\t\treturn array(
\t\t\t\t\t\t'before'  => $before,
\t\t\t\t\t\t'after'   => $after,
\t\t\t\t\t\t'changed' => ${write},
\t\t\t\t\t);
\t\t\t\t},
\t\t\t),
\t\t)
\t);

\tregister_rest_route(
\t\t'kiduki-leadgen/v1',
\t\t'/ad-policy-bridge',
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
  throw new Error(`A previous temporary ad-policy snippet exists: ${duplicate.id}`);
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
      desc: 'Temporary allowlisted lead-generation ad policy bridge.',
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
  const before = await wpRequest(env, 'GET', temporaryRoute);

  let backupPath = null;
  if (apply) {
    const backupDirectory = path.resolve('backups');
    fs.mkdirSync(backupDirectory, { recursive: true, mode: 0o700 });
    backupPath = path.join(
      backupDirectory,
      `wp-leadgen-ad-policy-before-${safeStamp()}.json`,
    );
    fs.writeFileSync(
      backupPath,
      `${JSON.stringify({ takenAt: new Date().toISOString(), state: before.data }, null, 2)}\n`,
      { mode: 0o600 },
    );
    fs.chmodSync(backupPath, 0o600);
  }

  const result = await wpRequest(env, 'POST', temporaryRoute, {
    state_hash: before.data.state_hash,
  });
  const after = result.data.after;
  if (apply) {
    const themeAdsDisabled = Object.values(after.theme_mods).every(
      (value) => value === '',
    );
    if (
      after.ad_inserter_active ||
      after.site_kit_active_modules.includes('adsense') ||
      after.site_kit_adsense_settings.useSnippet ||
      !themeAdsDisabled
    ) {
      throw new Error(`Ad policy verification failed. Backup: ${backupPath}`);
    }
  }

  const cleanup = await wpRequest(env, 'POST', temporaryPurgeRoute, {
    snippet_id: snippetId,
  });
  purged = cleanup.data.deleted === true;
  if (!purged) throw new Error('Temporary ad-policy bridge was not purged.');

  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: apply ? 'apply' : 'dry-run',
        persistentWrites: apply,
        backupPath: backupPath ? path.relative(process.cwd(), backupPath) : null,
        before: result.data.before,
        after,
        stateSha256: sha256(JSON.stringify(after)),
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
