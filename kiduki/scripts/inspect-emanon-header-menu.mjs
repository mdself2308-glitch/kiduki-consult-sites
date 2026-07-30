import {
  getWordPressEnv,
  wpRequest,
} from '../../tools/wordpress-rest-utils.mjs';

/**
 * Read-only inspection of the Emanon header/menu configuration.
 *
 * At 375px the header exposes no navigation control at all: the hamburger
 * carries Emanon's `u-display-pc` class and the drawer trigger `.switch-off`
 * computes to visibility:hidden, so mobile visitors can only navigate from the
 * footer. Before changing anything we need to see which theme_mod actually
 * drives that, rather than fighting it with child CSS.
 *
 * This script only reads. It never writes.
 */
const themeMods = 'theme_mods_kiduki-child';
const temporarySnippetName = 'Codex R16 header menu inspect';
const temporaryRoute = '/wp-json/kiduki-r16/v1/header-menu';

const env = getWordPressEnv();

const snippetCode = `
add_action( 'rest_api_init', function () {
\tregister_rest_route(
\t\t'kiduki-r16/v1',
\t\t'/header-menu',
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

\t\t\t\t// Anything that could plausibly govern the header or the menus.
\t\t\t\t$interesting = array();
\t\t\t\tforeach ( $mods as $key => $value ) {
\t\t\t\t\tif ( preg_match( '/menu|header|drawer|hamburger|mobile|sp_|_sp|nav|fixed|slide/i', $key ) ) {
\t\t\t\t\t\t$interesting[ $key ] = is_scalar( $value ) ? $value : wp_json_encode( $value );
\t\t\t\t\t}
\t\t\t\t}

\t\t\t\t$locations = get_nav_menu_locations();
\t\t\t\t$registered = array();
\t\t\t\tforeach ( get_registered_nav_menus() as $slug => $label ) {
\t\t\t\t\t$assigned = $locations[ $slug ] ?? 0;
\t\t\t\t\t$term     = $assigned ? get_term( $assigned, 'nav_menu' ) : null;
\t\t\t\t\t$registered[ $slug ] = array(
\t\t\t\t\t\t'label'    => $label,
\t\t\t\t\t\t'menuId'   => $assigned,
\t\t\t\t\t\t'menuName' => ( $term && ! is_wp_error( $term ) ) ? $term->name : null,
\t\t\t\t\t\t'itemCount'=> ( $term && ! is_wp_error( $term ) ) ? $term->count : 0,
\t\t\t\t\t);
\t\t\t\t}

\t\t\t\treturn array(
\t\t\t\t\t'theme'          => array( get_template(), get_stylesheet() ),
\t\t\t\t\t'modCount'       => count( $mods ),
\t\t\t\t\t'headerMenuMods' => $interesting,
\t\t\t\t\t'menuLocations'  => $registered,
\t\t\t\t\t'allModKeys'     => array_keys( $mods ),
\t\t\t\t);
\t\t\t},
\t\t)
\t);
} );
`;

const existing = await wpRequest(
  env,
  'GET',
  '/wp-json/code-snippets/v1/snippets?context=edit&per_page=100',
);
const stale = existing.data.filter(
  (s) => s.name === temporarySnippetName && (s.code || '').trim().length > 0,
);
if (stale.length > 0) {
  throw new Error(`A previous temporary snippet still exists: ${stale.map((s) => s.id).join(', ')}`);
}

let snippetId = null;
let deleted = false;

try {
  const created = await wpRequest(env, 'POST', '/wp-json/code-snippets/v1/snippets', {
    name: temporarySnippetName,
    desc: 'Temporary R16 read-only bridge. Removed immediately after use.',
    code: snippetCode,
    tags: ['codex', 'temporary', 'r16'],
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
  console.log(JSON.stringify({ ok: true, mode: 'read-only', ...result.data }, null, 2));
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
