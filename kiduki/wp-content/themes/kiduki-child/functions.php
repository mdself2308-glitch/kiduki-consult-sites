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

	wp_enqueue_style(
		'kiduki-child',
		get_stylesheet_uri(),
		array( 'emanon-premium-parent' ),
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
		&& 'contact/thanks' === get_page_uri( $page );
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
 * Permanently redirect the retired inquiry page to the unified contact form.
 */
function kiduki_redirect_legacy_question() {
	if ( is_page( 'question' ) ) {
		wp_safe_redirect( home_url( '/contact/' ), 301, 'KIDUKI' );
		exit;
	}
}
add_action( 'template_redirect', 'kiduki_redirect_legacy_question', 0 );
