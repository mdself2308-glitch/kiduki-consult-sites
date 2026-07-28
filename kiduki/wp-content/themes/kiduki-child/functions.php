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
}
add_action( 'wp_enqueue_scripts', 'kiduki_child_enqueue_styles' );
