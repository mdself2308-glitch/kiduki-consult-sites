import fs from 'node:fs';
import path from 'node:path';
import {
  getWordPressEnv,
  parseArgs,
  safeStamp,
  wpRequest,
} from '../../tools/wordpress-rest-utils.mjs';

/**
 * Inspect and update the Emanon Premium main colour stored in theme_mods.
 *
 * Emanon writes its palette into generated CSS as literal hex values, so the
 * only reliable way to recolour the theme chrome is to change the customiser
 * setting itself. Theme mods are not exposed over the REST API, so this uses
 * the same temporary Code Snippets bridge pattern as clone-theme-mods.mjs and
 * always removes the snippet afterwards.
 */
const themeMods = 'theme_mods_kiduki-child';
const temporarySnippetName = 'Codex R10b emanon color bridge';
const temporaryRoute = '/wp-json/kiduki-r10b/v1/emanon-color';

const args = parseArgs(process.argv.slice(2));
const apply = Boolean(args.apply);
const backup = Boolean(args.backup);
const backupConfirmed = Boolean(args['backup-confirmed']);
const targetColor = typeof args.color === 'string' ? args.color : null;

if (apply && (!backup || !backupConfirmed)) {
  throw new Error(
    'Refusing live theme_mods update without --backup --backup-confirmed.',
  );
}

if (apply && !/^#[0-9a-fA-F]{6}$/.test(targetColor || '')) {
  throw new Error('Usage: --color "#1d3a30" is required with --apply.');
}

const env = getWordPressEnv();

function buildSnippetCode() {
  const write = apply ? 'true' : 'false';
  const color = (targetColor || '').replace(/'/g, '');

  return `
add_action( 'rest_api_init', function () {
\tregister_rest_route(
\t\t'kiduki-r10b/v1',
\t\t'/emanon-color',
\t\tarray(
\t\t\t'methods'             => 'POST',
\t\t\t'permission_callback' => function () {
\t\t\t\treturn current_user_can( 'manage_options' );
\t\t\t},
\t\t\t'callback'            => function () {
\t\t\t\t$mods = get_option( '${themeMods}', array() );
\t\t\t\tif ( ! is_array( $mods ) ) {
\t\t\t\t\t$mods = array();
\t\t\t\t}

\t\t\t\t// Collect every key whose value looks like a hex colour.
\t\t\t\t$colors = array();
\t\t\t\tforeach ( $mods as $key => $value ) {
\t\t\t\t\tif ( is_string( $value ) && preg_match( '/^#[0-9a-fA-F]{3,8}$/', $value ) ) {
\t\t\t\t\t\t$colors[ $key ] = $value;
\t\t\t\t\t}
\t\t\t\t}

\t\t\t\t$changed = array();
\t\t\t\tif ( ${write} ) {
\t\t\t\t\t$targets = array();
\t\t\t\t\tforeach ( $colors as $key => $value ) {
\t\t\t\t\t\tif ( '#033b72' === strtolower( $value ) ) {
\t\t\t\t\t\t\t$targets[] = $key;
\t\t\t\t\t\t}
\t\t\t\t\t}
\t\t\t\t\tforeach ( $targets as $key ) {
\t\t\t\t\t\t$changed[ $key ] = array( 'before' => $mods[ $key ], 'after' => '${color}' );
\t\t\t\t\t\t$mods[ $key ] = '${color}';
\t\t\t\t\t}
\t\t\t\t\tif ( ! empty( $changed ) ) {
\t\t\t\t\t\tupdate_option( '${themeMods}', $mods, false );
\t\t\t\t\t}
\t\t\t\t}

\t\t\t\treturn array(
\t\t\t\t\t'colorKeys'  => $colors,
\t\t\t\t\t'changed'    => $changed,
\t\t\t\t\t'modCount'   => count( $mods ),
\t\t\t\t\t'optionHash' => hash( 'sha256', maybe_serialize( get_option( '${themeMods}', array() ) ) ),
\t\t\t\t);
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
const stale = existing.data.filter((s) => s.name === temporarySnippetName);
if (stale.length > 0) {
  throw new Error(
    `A previous temporary snippet still exists: ${stale.map((s) => s.id).join(', ')}`,
  );
}

let snippetId = null;
const cleanup = { deactivated: false, deleted: false };

try {
  const created = await wpRequest(env, 'POST', '/wp-json/code-snippets/v1/snippets', {
    name: temporarySnippetName,
    desc: 'Temporary R10b bridge. Removed immediately after use.',
    code: buildSnippetCode(),
    tags: ['codex', 'temporary', 'r10b'],
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
    const file = path.join(dir, `wp-theme-mods-colors-before-${safeStamp()}.json`);
    fs.writeFileSync(
      file,
      JSON.stringify({ takenAt: new Date().toISOString(), option: themeMods, colors: result.data.colorKeys, changed: result.data.changed }, null, 2),
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
      cleanup.deactivated = true;
    } catch (error) {
      console.error('Failed to deactivate temporary snippet:', error.message);
    }
    // This Code Snippets build returns 500 when deleting a snippet that still
    // has code, so blank it first. Blanking also neutralises it if the delete
    // still fails.
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
      cleanup.deleted = true;
    } catch (error) {
      console.error('Failed to delete temporary snippet:', error.message);
    }
    if (!cleanup.deleted) {
      console.error(
        `WARNING: temporary snippet ${snippetId} still exists and must be removed manually.`,
      );
    }
  }
}
