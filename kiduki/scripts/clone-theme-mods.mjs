#!/usr/bin/env node

import {
  getWordPressEnv,
  wpRequest,
} from '../../tools/wordpress-rest-utils.mjs';

const apply = process.argv.includes('--apply');
const sourceOption = 'theme_mods_emanon-premium';
const targetOption = 'theme_mods_kiduki-child';
const temporarySnippetName = 'Codex T0-R1 theme_mods bridge';
const temporaryRoute = '/wp-json/kiduki-t0-r1/v1/clone-theme-mods';
const env = getWordPressEnv();

async function readState() {
  const [settings, themes, menuLocations, widgets, snippets] =
    await Promise.all([
      wpRequest(env, 'GET', '/wp-json/wp/v2/settings'),
      wpRequest(env, 'GET', '/wp-json/wp/v2/themes?context=edit'),
      wpRequest(env, 'GET', '/wp-json/wp/v2/menu-locations?context=edit'),
      wpRequest(
        env,
        'GET',
        '/wp-json/wp/v2/widgets?context=edit&per_page=100',
      ),
      wpRequest(
        env,
        'GET',
        '/wp-json/code-snippets/v1/snippets?context=edit&per_page=100',
      ),
    ]);

  const activeTheme = themes.data.find((theme) => theme.status === 'active');
  const duplicateTemporarySnippets = snippets.data.filter(
    (snippet) => snippet.name === temporarySnippetName,
  );
  const locations = Object.entries(menuLocations.data || {}).map(
    ([location, value]) => ({
      location,
      menu: Number(value?.menu || 0),
    }),
  );
  const widgetAssignments = widgets.data.map((widget) => ({
    id: widget.id,
    sidebar: widget.sidebar,
  }));

  return {
    siteTitle: settings.data.title,
    activeTheme: activeTheme
      ? {
          stylesheet: activeTheme.stylesheet,
          name: activeTheme.name?.rendered || activeTheme.name || '',
          version: activeTheme.version || '',
        }
      : null,
    menuLocations: locations,
    widgetAssignments,
    duplicateTemporarySnippetIds: duplicateTemporarySnippets.map(
      (snippet) => snippet.id,
    ),
  };
}

function buildTemporarySnippetCode() {
  return `
add_action( 'rest_api_init', function () {
\tregister_rest_route(
\t\t'kiduki-t0-r1/v1',
\t\t'/clone-theme-mods',
\t\tarray(
\t\t\t'methods'             => 'POST',
\t\t\t'permission_callback' => function () {
\t\t\t\treturn current_user_can( 'manage_options' );
\t\t\t},
\t\t\t'callback'            => function () {
\t\t\t\t$source = get_option( '${sourceOption}', null );
\t\t\t\tif ( ! is_array( $source ) ) {
\t\t\t\t\treturn new WP_Error(
\t\t\t\t\t\t'kiduki_source_theme_mods_missing',
\t\t\t\t\t\t'Source theme mods were not found.',
\t\t\t\t\t\tarray( 'status' => 409 )
\t\t\t\t\t);
\t\t\t\t}

\t\t\t\t$target_before = get_option( '${targetOption}', null );
\t\t\t\tupdate_option( '${targetOption}', $source, false );
\t\t\t\t$target_after = get_option( '${targetOption}', null );
\t\t\t\t$menus = isset( $source['nav_menu_locations'] ) && is_array( $source['nav_menu_locations'] )
\t\t\t\t\t? $source['nav_menu_locations']
\t\t\t\t\t: array();
\t\t\t\t$sidebars = get_option( 'sidebars_widgets', array() );
\t\t\t\t$widget_count = 0;
\t\t\t\tforeach ( $sidebars as $sidebar => $widgets ) {
\t\t\t\t\tif ( 'wp_inactive_widgets' !== $sidebar && is_array( $widgets ) ) {
\t\t\t\t\t\t$widget_count += count( $widgets );
\t\t\t\t\t}
\t\t\t\t}

\t\t\t\treturn array(
\t\t\t\t\t'copied'                    => true,
\t\t\t\t\t'target_existed_before'     => is_array( $target_before ),
\t\t\t\t\t'equal_after_copy'          => $target_after === $source,
\t\t\t\t\t'source_hash'               => hash( 'sha256', maybe_serialize( $source ) ),
\t\t\t\t\t'target_hash'               => hash( 'sha256', maybe_serialize( $target_after ) ),
\t\t\t\t\t'menu_location_count'       => count( $menus ),
\t\t\t\t\t'menu_assignment_count'     => count( array_filter( $menus ) ),
\t\t\t\t\t'active_sidebar_count'      => is_array( $sidebars ) ? count( $sidebars ) : 0,
\t\t\t\t\t'active_widget_count'       => $widget_count,
\t\t\t\t);
\t\t\t},
\t\t)
\t);
} );
`;
}

const before = await readState();

if (!before.activeTheme || before.activeTheme.stylesheet !== 'emanon-premium') {
  throw new Error(
    `Expected emanon-premium to be active, found ${
      before.activeTheme?.stylesheet || 'none'
    }.`,
  );
}

if (before.duplicateTemporarySnippetIds.length > 0) {
  throw new Error(
    `A previous temporary snippet still exists: ${before.duplicateTemporarySnippetIds.join(
      ', ',
    )}`,
  );
}

if (!apply) {
  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: 'dry-run',
        writes: false,
        activeTheme: before.activeTheme,
        sourceOption,
        targetOption,
        menuLocations: before.menuLocations,
        widgetAssignments: before.widgetAssignments,
        plannedOperations: [
          'Create a temporary inactive Code Snippets entry.',
          'Activate it and copy the parent theme_mods option.',
          'Verify source and target hashes match.',
          'Deactivate and delete the temporary snippet.',
        ],
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

let snippetId = null;
let cleanup = {
  deactivated: false,
  deleted: false,
};

try {
  const created = await wpRequest(
    env,
    'POST',
    '/wp-json/code-snippets/v1/snippets',
    {
      name: temporarySnippetName,
      desc: 'Temporary T0-R1 bridge. Must be removed immediately after use.',
      code: buildTemporarySnippetCode(),
      tags: ['codex', 'temporary', 't0-r1'],
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

  const cloned = await wpRequest(env, 'POST', temporaryRoute, {});
  if (!cloned.data.equal_after_copy) {
    throw new Error('theme_mods source and target do not match after copy.');
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: 'apply',
        activeThemeBeforeCopy: before.activeTheme,
        sourceOption,
        targetOption,
        cloneResult: cloned.data,
        menuLocationsBeforeActivation: before.menuLocations,
        widgetAssignmentsBeforeActivation: before.widgetAssignments,
      },
      null,
      2,
    ),
  );
} finally {
  if (snippetId) {
    try {
      await wpRequest(
        env,
        'POST',
        `/wp-json/code-snippets/v1/snippets/${snippetId}/deactivate`,
        {},
      );
      cleanup.deactivated = true;
    } catch {
      cleanup.deactivated = false;
    }

    try {
      await wpRequest(
        env,
        'DELETE',
        `/wp-json/code-snippets/v1/snippets/${snippetId}`,
      );
      cleanup.deleted = true;
    } catch {
      cleanup.deleted = false;
    }
  }

  if (snippetId && (!cleanup.deactivated || !cleanup.deleted)) {
    console.error(
      JSON.stringify(
        {
          ok: false,
          temporarySnippetCleanup: {
            id: snippetId,
            ...cleanup,
          },
        },
        null,
        2,
      ),
    );
    process.exitCode = 1;
  }
}
