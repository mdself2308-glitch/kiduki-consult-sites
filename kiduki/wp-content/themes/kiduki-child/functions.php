<?php
/**
 * KIDUKI child theme bootstrap.
 *
 * @package Kiduki_Child
 */

defined( 'ABSPATH' ) || exit;

/**
 * Load the parent and child stylesheets.
 */
function kiduki_child_enqueue_styles() {
	$parent_theme = wp_get_theme( get_template() );
	$child_theme  = wp_get_theme();

	wp_enqueue_style(
		'emanon-premium-parent',
		get_template_directory_uri() . '/style.css',
		array(),
		$parent_theme->get( 'Version' )
	);

	// Noto Sans JP: 静的トップと書体を統一する。
	wp_enqueue_style(
		'kiduki-noto-sans-jp',
		'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap',
		array(),
		null
	);

	wp_enqueue_style(
		'kiduki-child',
		get_stylesheet_uri(),
		array( 'emanon-premium-parent', 'kiduki-noto-sans-jp' ),
		$child_theme->get( 'Version' )
	);

	if ( is_page( 'contact' ) ) {
		wp_enqueue_script(
			'kiduki-cf7-redirect',
			get_stylesheet_directory_uri() . '/assets/js/cf7-redirect.js',
			array(),
			$child_theme->get( 'Version' ),
			true
		);
	}

	if ( kiduki_is_contact_thanks_page() ) {
		wp_enqueue_script(
			'kiduki-contact-thanks',
			get_stylesheet_directory_uri() . '/assets/js/contact-thanks.js',
			array(),
			$child_theme->get( 'Version' ),
			true
		);
	}
}
add_action( 'wp_enqueue_scripts', 'kiduki_child_enqueue_styles' );

/**
 * Preconnect to the font CDN so the webfont does not delay first paint.
 */
function kiduki_child_resource_hints( $urls, $relation_type ) {
	if ( 'preconnect' === $relation_type ) {
		$urls[] = array( 'href' => 'https://fonts.googleapis.com' );
		$urls[] = array(
			'href'        => 'https://fonts.gstatic.com',
			'crossorigin' => 'anonymous',
		);
	}

	return $urls;
}
add_filter( 'wp_resource_hints', 'kiduki_child_resource_hints', 10, 2 );

/**
 * Whether the current page is the contact thank-you page.
 *
 * @return bool
 */
function kiduki_is_contact_thanks_page() {
	if ( ! is_page() ) {
		return false;
	}

	$page = get_queried_object();

	return $page instanceof WP_Post
		&& 'page' === $page->post_type
		&& 1743 === (int) $page->ID
		&& 1741 === (int) $page->post_parent
		&& 'thanks' === $page->post_name;
}

/**
 * Keep the thank-you page out of search results.
 *
 * @param array $robots Existing robots directives.
 * @return array
 */
function kiduki_contact_thanks_robots( $robots ) {
	if ( kiduki_is_contact_thanks_page() ) {
		$robots['noindex'] = true;
		$robots['follow']  = true;
	}

	return $robots;
}
add_filter( 'wp_robots', 'kiduki_contact_thanks_robots' );

/**
 * Keep redirected and noindex pages out of the XML sitemap.
 *
 * Google XML Sitemaps exposes this filter for extending its post-ID exclusion
 * list. These URLs remain available for their intended purposes, but should
 * not be submitted to search engines as indexable pages.
 *
 * @param int[] $post_ids Existing post IDs excluded from the sitemap.
 * @return int[]
 */
function kiduki_exclude_nonindexable_pages_from_sitemap( $post_ids ) {
	$post_ids = array_map( 'intval', (array) $post_ids );

	return array_values(
		array_unique(
			array_merge(
				$post_ids,
				array(
					37,   // Retired /question/ page; permanently redirects to /contact/.
					1743, // /contact/thanks/ page; intentionally noindex.
				)
			)
		)
	);
}
add_filter(
	'sm_exclude_from_sitemap_by_post_ids',
	'kiduki_exclude_nonindexable_pages_from_sitemap'
);

/**
 * Permanently redirect the retired inquiry page to the unified contact form.
 */
function kiduki_redirect_legacy_question() {
	if ( is_page( 'question' ) ) {
		wp_safe_redirect( home_url( '/contact/' ), 301, 'KIDUKI' );
		exit;
	}
}
add_action( 'template_redirect', 'kiduki_redirect_legacy_question', 0 );

/**
 * Permanently redirect the retired spot-service slug to its replacement.
 */
function kiduki_redirect_legacy_service_spot() {
	$request_uri = isset( $_SERVER['REQUEST_URI'] )
		? wp_unslash( $_SERVER['REQUEST_URI'] )
		: '';
	$path        = wp_parse_url( $request_uri, PHP_URL_PATH );
	$path        = '/' . ltrim( (string) $path, '/' );

	if ( '/service/spot/' === trailingslashit( $path ) ) {
		wp_safe_redirect(
			home_url( '/service/return-to-work-support/' ),
			301,
			'KIDUKI'
		);
		exit;
	}
}
add_action( 'template_redirect', 'kiduki_redirect_legacy_service_spot', 0 );
