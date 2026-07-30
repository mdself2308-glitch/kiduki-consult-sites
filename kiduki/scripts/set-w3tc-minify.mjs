import fs from 'node:fs';
import path from 'node:path';
import {
  getWordPressEnv,
  parseArgs,
  safeStamp,
  wpRequest,
} from '../../tools/wordpress-rest-utils.mjs';

/**
 * Read and optionally disable W3 Total Cache's Minify feature.
 *
 * Why this exists: W3TC's Minify serves combined CSS under stable filenames
 * (e.g. /cache/minify/a4353.css) with `cache-control: max-age=31536000`.
 * When the underlying CSS changes, the filename does not, so browsers keep
 * serving a year-old copy. That produced visible breakage on this site:
 * theme rules such as `.article-header-full-width__thumbnail { position:
 * absolute; inset: 0 }` were missing from the cached bundle, collapsing the
 * hero image to zero height and leaving white text on a white background.
 *
 * Theme and child-theme stylesheets are already versioned via ?ver=, so
 * disabling Minify restores correct cache invalidation.
 *
 * Theme/plugin options are not exposed over REST, so this uses the same
 * temporary Code Snippets bridge pattern as the other scripts here. This
 * Code Snippets build refuses to DELETE a snippet that still has code, so the
 * cleanup blanks the snippet first; blanking also neutralises it if the
 * delete itself fails.
 */
const temporarySnippetName = 'Codex R12 w3tc minify bridge';
const temporaryRoute = '/wp-json/kiduki-r12/v1/w3tc-minify';

const args = parseArgs(process.argv.slice(2));
const apply = Boolean(args.apply);
const backup = Boolean(args.backup);
const backupConfirmed = Boolean(args['backup-confirmed']);

if (apply && (!backup || !backupConfirmed)) {
  throw new Error(
    'Refusing to change W3TC settings without --backup --backup-confirmed.',
  );
}

const env = getWordPressEnv();

function buildSnippetCode() {
  const write = apply ? 'true' : 'false';

  return `
add_action( 'rest_api_init', function () {
\tregister_rest_route(
\t\t'kiduki-r12/v1',
\t\t'/w3tc-minify',
\t\tarray(
\t\t\t'methods'             => 'POST',
\t\t\t'permission_callback' => function () {
\t\t\t\treturn current_user_can( 'manage_options' );
\t\t\t},
\t\t\t'callback'            => function () {
\t\t\t\tif ( ! class_exists( '\\\\W3TC\\\\Dispatcher' ) ) {
\t\t\t\t\treturn new WP_Error( 'kiduki_w3tc_missing', 'W3TC not available.', array( 'status' => 409 ) );
\t\t\t\t}

\t\t\t\t$config = \\W3TC\\Dispatcher::config();
\t\t\t\t$before = array(
\t\t\t\t\t'minify.enabled'      => (bool) $config->get_boolean( 'minify.enabled' ),
\t\t\t\t\t'minify.css.enable'   => (bool) $config->get_boolean( 'minify.css.enable' ),
\t\t\t\t\t'minify.js.enable'    => (bool) $config->get_boolean( 'minify.js.enable' ),
\t\t\t\t\t'minify.auto'         => (bool) $config->get_boolean( 'minify.auto' ),
\t\t\t\t\t'pgcache.enabled'     => (bool) $config->get_boolean( 'pgcache.enabled' ),
\t\t\t\t\t'browsercache.enabled'=> (bool) $config->get_boolean( 'browsercache.enabled' ),
\t\t\t\t);

\t\t\t\t$changed = array();
\t\t\t\tif ( ${write} ) {
\t\t\t\t\t// Disable only Minify. Page cache and browser cache stay as they are.
\t\t\t\t\t$config->set( 'minify.enabled', false );
\t\t\t\t\t$config->set( 'minify.css.enable', false );
\t\t\t\t\t$config->set( 'minify.js.enable', false );
\t\t\t\t\t$config->save();

\t\t\t\t\tif ( function_exists( 'w3tc_flush_all' ) ) {
\t\t\t\t\t\tw3tc_flush_all();
\t\t\t\t\t}

\t\t\t\t\t$changed = array(
\t\t\t\t\t\t'minify.enabled'    => array( 'before' => $before['minify.enabled'], 'after' => false ),
\t\t\t\t\t\t'minify.css.enable' => array( 'before' => $before['minify.css.enable'], 'after' => false ),
\t\t\t\t\t\t'minify.js.enable'  => array( 'before' => $before['minify.js.enable'], 'after' => false ),
\t\t\t\t\t);
\t\t\t\t}

\t\t\t\t$after = array(
\t\t\t\t\t'minify.enabled'    => (bool) $config->get_boolean( 'minify.enabled' ),
\t\t\t\t\t'minify.css.enable' => (bool) $config->get_boolean( 'minify.css.enable' ),
\t\t\t\t\t'minify.js.enable'  => (bool) $config->get_boolean( 'minify.js.enable' ),
\t\t\t\t);

\t\t\t\treturn array( 'before' => $before, 'changed' => $changed, 'after' => $after );
\t\t\t},
\t\t)
\t);
} );
`;
}

const existing = await wpRequest(
  env,
  'GET',
  '/wp-json/code-snippets/v1/snippets?context=edit&per_page=100',
);
// Blanked leftovers (code removed, inactive) cannot be deleted through this
// plugin's REST API, so they must not block a rerun. Only a snippet that still
// carries code is a real conflict.
const stale = existing.data.filter(
  (s) => s.name === temporarySnippetName && (s.code || '').trim().length > 0,
);
if (stale.length > 0) {
  throw new Error(
    `A previous temporary snippet still exists: ${stale.map((s) => s.id).join(', ')}`,
  );
}

let snippetId = null;
let deleted = false;

try {
  const created = await wpRequest(env, 'POST', '/wp-json/code-snippets/v1/snippets', {
    name: temporarySnippetName,
    desc: 'Temporary R12 bridge. Removed immediately after use.',
    code: buildSnippetCode(),
    tags: ['codex', 'temporary', 'r12'],
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

  const result = await wpRequest(env, 'POST', temporaryRoute, {});

  if (apply && backup) {
    const dir = path.resolve('backups');
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `w3tc-minify-before-${safeStamp()}.json`);
    fs.writeFileSync(
      file,
      JSON.stringify(
        { takenAt: new Date().toISOString(), before: result.data.before, changed: result.data.changed },
        null,
        2,
      ),
    );
    result.data.backupPath = file;
  }

  console.log(
    JSON.stringify({ ok: true, mode: apply ? 'apply' : 'dry-run', ...result.data }, null, 2),
  );
} finally {
  if (snippetId) {
    try {
      await wpRequest(env, 'POST', `/wp-json/code-snippets/v1/snippets/${snippetId}/deactivate`, {});
    } catch (error) {
      console.error('Failed to deactivate temporary snippet:', error.message);
    }
    try {
      await wpRequest(env, 'POST', `/wp-json/code-snippets/v1/snippets/${snippetId}`, {
        code: '',
        active: false,
      });
    } catch (error) {
      console.error('Failed to blank temporary snippet:', error.message);
    }
    try {
      await wpRequest(env, 'DELETE', `/wp-json/code-snippets/v1/snippets/${snippetId}`, {});
      deleted = true;
    } catch (error) {
      console.error('Failed to delete temporary snippet:', error.message);
    }
    if (!deleted) {
      console.error(
        `WARNING: temporary snippet ${snippetId} is blanked and inactive but still listed. Remove it from the admin UI.`,
      );
    }
  }
}
