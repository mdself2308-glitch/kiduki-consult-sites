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
 * Give the theme's icon-only header controls useful accessible names.
 */
function kiduki_child_header_control_labels() {
	?>
	<script>
	document.addEventListener('DOMContentLoaded', function () {
		document.querySelectorAll('.js-hamburger-menu').forEach(function (button) {
			button.setAttribute('aria-label', 'メニューを開く');
		});
		var searchOpen = document.querySelector('#js-header-search .switch-off');
		var searchClose = document.querySelector('#js-header-search .switch-on');
		if (searchOpen) searchOpen.setAttribute('aria-label', 'サイト内検索を開く');
		if (searchClose) searchClose.setAttribute('aria-label', 'サイト内検索を閉じる');
	});
	</script>
	<?php
}
add_action( 'wp_footer', 'kiduki_child_header_control_labels', 100 );

/**
 * Record aggregate article-to-service transitions without sending the
 * first-party attribution token to Google Analytics.
 *
 * The event is intentionally not a key event. It is an intermediate funnel
 * step between Search Console clicks and the generate_lead event.
 */
function kiduki_child_article_cta_tracking() {
	if ( ! is_single() && ! is_page( 164 ) ) {
		return;
	}
	?>
	<script>
	(function () {
		var attributionTtlMs = 30 * 60 * 1000;
		var allowedArticleSlugs = {
			'after-the-physician-opinion': true,
			'committee-minutes-three-year-retention': true,
			'drowsy-driving-workplace-safety': true,
			'industrial-physician-scheduling': true,
			'kenko-keiei-sleep-measures': true,
			'long-hours-interview-sleep': true,
			'night-shift-sleep-management': true,
			'return-to-work-sleep-assessment': true,
			'sas-screening-at-work': true,
			'sleep-findings-to-work-accommodation': true,
			'stresschecknew': true,
			'when-sleep-becomes-a-return-to-work-decision': true,
			'work-restriction-release-management': true
		};
		var allowedRoles = { primary: true, secondary: true, 'service-primary': true };
		var offerByPath = {
			'/service/komon/': 'kiduki-basic',
			'/service/sangyoui/': 'kiduki-retain',
			'/service/return-to-work-support/': 'return-to-work',
			'/service/cloud/': 'casetra'
		};
		var allowedOffers = {
			'kiduki-basic': true,
			'kiduki-retain': true,
			'return-to-work': true,
			'casetra': true
		};
		var isSpotServicePage = <?php echo is_page( 164 ) ? 'true' : 'false'; ?>;

		function getFreshAttributionId() {
			var storedOrigin = JSON.parse(window.sessionStorage.getItem('kiduki_content_origin') || '{}');
			var storedAt = Date.parse(storedOrigin.clicked_at || '');
			var storedId = storedOrigin.lead_tracking_id || '';
			var now = Date.now();
			var storedIsFresh = Number.isFinite(storedAt) && storedAt <= now && now - storedAt <= attributionTtlMs;
			var storedIdIsValid = /^kdk-[a-z0-9]+-[a-z0-9]{8}$/.test(storedId);
			if (storedIsFresh && storedIdIsValid) { return storedId; }
			return 'kdk-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
		}

		function saveFirstPartyOrigin(origin) {
			try {
				origin.lead_tracking_id = getFreshAttributionId();
				origin.clicked_at = new Date().toISOString();
				window.sessionStorage.setItem('kiduki_content_origin', JSON.stringify(origin));
			} catch (error) {
				// Navigation and aggregate analytics must continue without storage.
			}
		}

		document.addEventListener('click', function (event) {
		var link = event.target && event.target.closest
			? event.target.closest('.kdk-article-cta a[href^="/service/"]')
			: null;
		if (!link) { return; }

		var container = link.closest('.kdk-article-cta');
		var links = container ? Array.prototype.slice.call(container.querySelectorAll('a[href^="/service/"]')) : [];
		var articleSlug = container && container.getAttribute('data-kdk-article-slug');
		if (!articleSlug) {
			articleSlug = window.location.pathname.replace(/^\/+|\/+$/g, '');
		}
		if (!allowedArticleSlugs[articleSlug]) { return; }

		var role = link.getAttribute('data-kdk-article-cta') || (links.indexOf(link) === 0 ? 'primary' : 'secondary');
		if (!allowedRoles[role]) { return; }

		var linkPath = '';
		try {
			linkPath = new URL(link.href, window.location.origin).pathname;
		} catch (error) {
			return;
		}
		var targetOffer = link.getAttribute('data-kdk-target-offer') || offerByPath[linkPath] || '';
		if (!allowedOffers[targetOffer]) { return; }

		saveFirstPartyOrigin({
			article_slug: articleSlug,
			source_page: '',
			target_offer: targetOffer,
			article_cta_role: role
		});

		if (typeof window.gtag === 'function') {
			window.gtag('event', 'article_service_click', {
				article_slug: articleSlug,
				target_offer: targetOffer,
				article_cta_role: role,
				link_url: link.href
			});
		}
		});

		document.addEventListener('click', function (event) {
			if (!isSpotServicePage) { return; }
			var link = event.target && event.target.closest
				? event.target.closest('.kdk-return-page a[href*="/contact/"]')
				: null;
			if (!link) { return; }

			saveFirstPartyOrigin({
				article_slug: '',
				source_page: 'return-to-work-support',
				target_offer: 'return-to-work',
				article_cta_role: 'service-primary'
			});

			if (typeof window.gtag === 'function') {
				window.gtag('event', 'service_contact_click', {
					source_page: 'return-to-work-support',
					target_offer: 'return-to-work',
					cta_role: 'service-primary',
					link_url: link.href
				});
			}
		});
	}());
	</script>
	<?php
}
add_action( 'wp_footer', 'kiduki_child_article_cta_tracking', 90 );

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

/**
 * ---------------------------------------------------------------------------
 * 検索対策の土台（2026-09-02）
 *
 * ここから下は、公開されている本文（文言）を変えずに、検索エンジンへの
 * 伝え方だけを直す。文言そのものの変更は kiduki/docs/copy/site-copy.md の
 * 承認を経て、別の手順で行う。
 * ---------------------------------------------------------------------------
 */

/**
 * <title> の区切りを「  |  」から「｜」に統一する。
 *
 * Emanon は WordPress 標準の title-tag を使っているため、区切り文字だけを
 * 差し替えれば、タイトル本文とサイト名はそのまま残る。
 * 例: スポット産業医・単発相談｜復職判定・睡眠研修｜KIDUKIコンサルティング産業医事務所
 *
 * @param string $separator Current separator.
 * @return string
 */
function kiduki_seo_document_title_separator( $separator ) {
	return '｜';
}
add_filter( 'document_title_separator', 'kiduki_seo_document_title_separator', 20 );

/**
 * WordPress 本体は区切り文字の前後に半角スペースを足すので、全角の「｜」に
 * 揃えてスペースを取り除く。
 *
 * @param string $title Rendered document title.
 * @return string
 */
function kiduki_seo_document_title( $title ) {
	$title = preg_replace( '/\s*(?:｜|\|)\s*/u', '｜', (string) $title );
	$title = preg_replace( '/^｜+|｜+$/u', '', (string) $title );

	return trim( (string) $title );
}
add_filter( 'document_title', 'kiduki_seo_document_title', 20 );

/**
 * meta description の後始末。
 *
 * Emanon は個別指定がないページで本文の冒頭120文字を description に使う。
 * 記事では冒頭が「執筆・監修：…最終確認：…」の署名行になり、固定ページでは
 * 本文先頭の CSS が混ざることがあった。手で指定した description があれば
 * そのまま使い、無い場合だけ次の順で差し替える。
 *
 * 1. 投稿に抜粋（excerpt）があれば抜粋を使う（記事台帳の excerpt と同じ文）。
 * 2. それ以外は署名行と CSS を取り除いてから120文字に整える。
 *
 * @param string $description Description Emanon is about to print.
 * @return string
 */
function kiduki_seo_meta_description( $description ) {
	if ( ! is_singular() ) {
		return $description;
	}

	$post = get_queried_object();
	if ( ! $post instanceof WP_Post ) {
		return $description;
	}

	$manual = trim( (string) get_post_meta( $post->ID, 'emanon_meta_description', true ) );
	if ( '' !== $manual ) {
		return $description;
	}

	if ( 'post' === $post->post_type && '' !== trim( (string) $post->post_excerpt ) ) {
		return kiduki_seo_trim_description( wp_strip_all_tags( $post->post_excerpt ) );
	}

	return kiduki_seo_trim_description( kiduki_seo_clean_description( $description ) );
}
add_filter( 'emanon_custom_description', 'kiduki_seo_meta_description', 20 );

/**
 * 署名行と CSS を description から取り除く。
 *
 * @param string $text Raw description text.
 * @return string
 */
function kiduki_seo_clean_description( $text ) {
	$text = html_entity_decode( (string) $text, ENT_QUOTES, 'UTF-8' );
	// 「執筆・監修：宮部 大輔（…）　最終確認：2026年8月31日」までを落とす。
	$text = preg_replace( '/^.*?最終確認[：:]\s*\d{4}年\d{1,2}月\d{1,2}日\s*/u', '', $text, 1 );
	// 本文先頭に CSS が置かれている固定ページ向け。
	$text = preg_replace( '/@import\s+url\([^)]*\)\s*;?/u', '', $text );
	$text = preg_replace( '/[A-Za-z0-9_.#:>*,\[\]="\'\s-]*\{[^{}]*\}/u', '', $text );
	$text = preg_replace( '/\s+/u', ' ', $text );

	return trim( (string) $text );
}

/**
 * description を120文字に整える。
 *
 * @param string $text Cleaned description text.
 * @return string
 */
function kiduki_seo_trim_description( $text ) {
	$text = trim( preg_replace( '/\s+/u', ' ', (string) $text ) );
	if ( mb_strlen( $text, 'UTF-8' ) > 120 ) {
		$text = rtrim( mb_substr( $text, 0, 119, 'UTF-8' ) ) . '…';
	}

	return $text;
}

/**
 * 事務所（Organization）とサイト（WebSite）の構造化データ。
 *
 * 静的トップ（consult.）と同じ事務所情報を WordPress 側の全ページにも出し、
 * 検索エンジンが「同じ事務所のサイト」と結び付けられるようにする。
 * 住所・資格・設立年月は公開中の事務所概要・代表者紹介の記載と同じ値だけを使う。
 * 代表者紹介ページでは Person を追加する。
 */
function kiduki_seo_organization_jsonld() {
	if ( is_admin() || is_feed() || is_404() ) {
		return;
	}

	$organization_id = 'https://consult.kdkconslt-sngyouijm.com/#organization';
	$website_id      = 'https://consult.kdkconslt-sngyouijm.com/#website';
	$person_id       = 'https://kdkconslt-sngyouijm.com/office/greeting/#person';

	$founder = array(
		'@type'    => 'Person',
		'@id'      => $person_id,
		'name'     => '宮部 大輔',
		'jobTitle' => '内科専門医・心療内科専門医・労働衛生コンサルタント',
		'url'      => 'https://kdkconslt-sngyouijm.com/office/greeting/',
	);

	$organization = array(
		'@type'           => 'ProfessionalService',
		'@id'             => $organization_id,
		'name'            => 'KIDUKIコンサルティング産業医事務所',
		'alternateName'   => 'KIDUKI',
		'description'     => '睡眠を専門とし、事業場における産業衛生業務の標準化・効率化を支援する産業医事務所',
		'url'             => 'https://consult.kdkconslt-sngyouijm.com/',
		'logo'            => 'https://kdkconslt-sngyouijm.com/wp-content/uploads/2026/07/kiduki-logo-dark.webp',
		'image'           => 'https://consult.kdkconslt-sngyouijm.com/og-image.png',
		'email'           => 'info@kdkconslt-sngyouijm.com',
		'foundingDate'    => '2023-08',
		'areaServed'      => '東京都',
		'address'         => array(
			'@type'           => 'PostalAddress',
			'postalCode'      => '105-0004',
			'addressRegion'   => '東京都',
			'addressLocality' => '港区',
			'streetAddress'   => '新橋1-18-21 第一日比谷ビル',
			'addressCountry'  => 'JP',
		),
		'founder'         => $founder,
		'hasOfferCatalog' => array(
			'@type'           => 'OfferCatalog',
			'name'            => 'サービス',
			'itemListElement' => array(
				array(
					'@type'       => 'Offer',
					'itemOffered' => array(
						'@type' => 'Service',
						'name'  => '睡眠に特化した嘱託産業医',
						'url'   => 'https://kdkconslt-sngyouijm.com/service/sangyoui/',
					),
				),
				array(
					'@type'       => 'Offer',
					'itemOffered' => array(
						'@type' => 'Service',
						'name'  => '産業医の追加・顧問支援',
						'url'   => 'https://kdkconslt-sngyouijm.com/service/komon/',
					),
				),
				array(
					'@type'       => 'Offer',
					'itemOffered' => array(
						'@type' => 'Service',
						'name'  => 'スポット産業医・単発相談',
						'url'   => 'https://kdkconslt-sngyouijm.com/service/return-to-work-support/',
					),
				),
				array(
					'@type'       => 'Offer',
					'itemOffered' => array(
						'@type' => 'Service',
						'name'  => '産業衛生DX・Casetra',
						'url'   => 'https://kdkconslt-sngyouijm.com/service/cloud/',
					),
				),
			),
		),
	);

	$website = array(
		'@type'         => 'WebSite',
		'@id'           => $website_id,
		'url'           => 'https://consult.kdkconslt-sngyouijm.com/',
		'name'          => 'KIDUKIコンサルティング産業医事務所',
		'alternateName' => 'KIDUKI',
		'inLanguage'    => 'ja',
		'publisher'     => array( '@id' => $organization_id ),
	);

	$graph = array( $organization, $website );

	if ( is_page( 43 ) ) {
		$graph[] = array(
			'@type'       => 'Person',
			'@id'         => $person_id,
			'name'        => '宮部 大輔',
			'jobTitle'    => '内科専門医・心療内科専門医・労働衛生コンサルタント',
			'url'         => 'https://kdkconslt-sngyouijm.com/office/greeting/',
			'worksFor'    => array( '@id' => $organization_id ),
			'alumniOf'    => array(
				'@type' => 'CollegeOrUniversity',
				'name'  => '産業医科大学',
			),
			'memberOf'    => array(
				array( '@type' => 'Organization', 'name' => '日本内科学会' ),
				array( '@type' => 'Organization', 'name' => '日本心身医学会' ),
				array( '@type' => 'Organization', 'name' => '日本心療内科学会' ),
				array( '@type' => 'Organization', 'name' => '日本職業・災害医学会' ),
				array( '@type' => 'Organization', 'name' => '日本産業衛生学会' ),
			),
			'knowsAbout'  => array( '産業医業務', '睡眠', '休職・復職支援', '治療と仕事の両立支援', '労働衛生' ),
		);
	}

	$payload = array(
		'@context' => 'https://schema.org',
		'@graph'   => $graph,
	);

	echo '<script type="application/ld+json">'
		. wp_json_encode( $payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES )
		. '</script>' . "\n";
}
add_action( 'wp_head', 'kiduki_seo_organization_jsonld', 5 );

/**
 * 検索結果から外す（noindex）投稿・固定ページの ID。
 *
 * 2025年の個人向けコラム等は、Search Console の query×page と被リンクを
 * 記事ごとに確認し、宮部大輔が「外す」と決めた ID だけをここへ書く。
 * 空のままなら何も変わらない。候補一覧は
 * content/seo-ranking-recovery-plan-2026-09-02.md の「旧記事の整理」を参照。
 *
 * @return int[]
 */
function kiduki_seo_noindex_ids() {
	// 2026-09-02 宮部大輔承認（S6）。2025年1〜2月の個人向けコラム19本。
	// 根拠: content/evidence/old-article-noindex-approval.json
	return array_map(
		'intval',
		array(
			937,  // kyuushoku 休職中の過ごし方
			944,  // howwork 働くということ
			952,  // sleepup 睡眠改善バイブル
			975,  // motiveup モチベーションを上げるコツ
			976,  // irareset イライラ知らずの働き方
			1001, // setgoal 目標設定の重要性
			1007, // goodrest 効果的な休息
			1071, // communicatetrouble 人間関係のトラブル
			1081, // yarukimotivate やる気を引き出す
			1092, // howtohoriday 休日の過ごし方
			1122, // hiroukaihuku 疲労回復法
			1141, // hirou 疲労感の原因と対策
			1161, // seisansei 健康と仕事の生産性
			1164, // hayounahataraki 働き方の多様化
			1170, // dijitalhirou デジタル文明病
			1173, // jikokoutei OKR・KPIと自己肯定感
			1176, // smartphonesleep スマホ依存と睡眠不足
			1181, // mywork キャリア危機
			1348, // stressfat 職場ストレス太り
		)
	);
}

/**
 * 健康経営・生産性の重複4本を1本（/kenkoutoushi/）へ統合する 301。
 *
 * 2026-09-02 宮部大輔承認（S6）。統合元の3本は公開状態を変えず、URLだけ統合先へ転送する。
 * サイトマップからも外す（kiduki_seo_merged_post_ids）。
 */
function kiduki_seo_merged_post_ids() {
	return array( 1352, 1361, 1368 ); // kennkoseisannsei, health-company, kenkousokutei
}

function kiduki_redirect_merged_health_management_posts() {
	$request_uri = isset( $_SERVER['REQUEST_URI'] )
		? wp_unslash( $_SERVER['REQUEST_URI'] )
		: '';
	$path        = wp_parse_url( $request_uri, PHP_URL_PATH );
	$path        = trailingslashit( '/' . ltrim( (string) $path, '/' ) );
	$merged      = array( '/kennkoseisannsei/', '/health-company/', '/kenkousokutei/' );

	if ( in_array( $path, $merged, true ) ) {
		wp_safe_redirect( home_url( '/kenkoutoushi/' ), 301, 'KIDUKI' );
		exit;
	}
}
add_action( 'template_redirect', 'kiduki_redirect_merged_health_management_posts', 0 );

/**
 * 承認済み ID に noindex,follow を付ける。
 *
 * @param array $robots Existing robots directives.
 * @return array
 */
function kiduki_seo_noindex_robots( $robots ) {
	if ( is_singular() && in_array( (int) get_queried_object_id(), kiduki_seo_noindex_ids(), true ) ) {
		$robots['noindex'] = true;
		$robots['follow']  = true;
	}

	return $robots;
}
add_filter( 'wp_robots', 'kiduki_seo_noindex_robots' );

/**
 * noindex にした ID を XML サイトマップからも外す。
 *
 * @param int[] $post_ids Existing post IDs excluded from the sitemap.
 * @return int[]
 */
function kiduki_seo_exclude_noindex_from_sitemap( $post_ids ) {
	return array_values(
		array_unique(
			array_merge(
				array_map( 'intval', (array) $post_ids ),
				kiduki_seo_noindex_ids(),
				kiduki_seo_merged_post_ids()
			)
		)
	);
}
add_filter( 'sm_exclude_from_sitemap_by_post_ids', 'kiduki_seo_exclude_noindex_from_sitemap', 20 );

/**
 * ---------------------------------------------------------------------------
 * 検索対策の土台 その2（2026-09-02）: OGP、著者アーカイブのcanonical、表示速度
 * ---------------------------------------------------------------------------
 */

/**
 * OGP / Twitter カード。WordPress側の全ページで og: が出ていなかった（2026-09-02 実測）。
 * Emanon側のOGPを有効にした場合は二重出力になるので、その時はこの関数を外す。
 */
function kiduki_seo_open_graph() {
	if ( is_admin() || is_feed() || is_404() || is_search() ) {
		return;
	}

	$default_image = 'https://consult.kdkconslt-sngyouijm.com/og-image.png';
	$site_name     = 'KIDUKIコンサルティング産業医事務所';
	$title         = wp_get_document_title();
	$url           = '';
	$type          = 'website';
	$image         = $default_image;
	$description   = '';

	if ( is_singular() ) {
		$post = get_queried_object();
		if ( $post instanceof WP_Post ) {
			$url  = get_permalink( $post );
			$type = ( 'post' === $post->post_type ) ? 'article' : 'website';
			$description = trim( (string) get_post_meta( $post->ID, 'emanon_meta_description', true ) );
			if ( '' === $description && '' !== trim( (string) $post->post_excerpt ) ) {
				$description = kiduki_seo_trim_description( wp_strip_all_tags( $post->post_excerpt ) );
			}
			if ( has_post_thumbnail( $post ) ) {
				$thumb = wp_get_attachment_image_url( get_post_thumbnail_id( $post ), 'large' );
				if ( $thumb ) {
					$image = $thumb;
				}
			}
		}
	} elseif ( is_author() ) {
		$url = get_author_posts_url( get_queried_object_id() );
	} else {
		$url = home_url( add_query_arg( array(), $GLOBALS['wp']->request ) );
		$url = trailingslashit( $url );
	}

	$tags = array(
		array( 'property', 'og:site_name', $site_name ),
		array( 'property', 'og:locale', 'ja_JP' ),
		array( 'property', 'og:type', $type ),
		array( 'property', 'og:title', $title ),
		array( 'property', 'og:url', $url ),
		array( 'property', 'og:image', $image ),
		array( 'name', 'twitter:card', 'summary_large_image' ),
		array( 'name', 'twitter:title', $title ),
	);
	if ( '' !== $description ) {
		$tags[] = array( 'property', 'og:description', $description );
		$tags[] = array( 'name', 'twitter:description', $description );
	}
	foreach ( $tags as $tag ) {
		if ( '' === (string) $tag[2] ) {
			continue;
		}
		printf( "<meta %s=\"%s\" content=\"%s\">\n", esc_attr( $tag[0] ), esc_attr( $tag[1] ), esc_attr( $tag[2] ) );
	}
}
add_action( 'wp_head', 'kiduki_seo_open_graph', 6 );

/**
 * 著者アーカイブに canonical と rel=prev/next（2026-09-02 実測で無かった）。
 */
function kiduki_seo_author_archive_links() {
	if ( ! is_author() ) {
		return;
	}
	$author_id = get_queried_object_id();
	$base      = get_author_posts_url( $author_id );
	$paged     = max( 1, (int) get_query_var( 'paged' ) );
	$canonical = $paged > 1 ? trailingslashit( $base ) . 'page/' . $paged . '/' : $base;
	printf( "<link rel=\"canonical\" href=\"%s\">\n", esc_url( $canonical ) );

	global $wp_query;
	$max = (int) $wp_query->max_num_pages;
	if ( $paged > 1 ) {
		$prev = $paged - 1 === 1 ? $base : trailingslashit( $base ) . 'page/' . ( $paged - 1 ) . '/';
		printf( "<link rel=\"prev\" href=\"%s\">\n", esc_url( $prev ) );
	}
	if ( $max > $paged ) {
		printf( "<link rel=\"next\" href=\"%s\">\n", esc_url( trailingslashit( $base ) . 'page/' . ( $paged + 1 ) . '/' ) );
	}
}
add_action( 'wp_head', 'kiduki_seo_author_archive_links', 4 );

/**
 * Google Fonts（子テーマが読む Noto Sans JP）を描画ブロックにしない。
 * Lighthouse（2026-09-02）で Google Fonts CSS が FCP を約2秒遅らせていた。
 *
 * @param string $html   The link tag.
 * @param string $handle Style handle.
 * @return string
 */
function kiduki_seo_async_google_fonts( $html, $handle ) {
	if ( 'kiduki-noto-sans-jp' !== $handle ) {
		return $html;
	}
	$blocking = $html;
	$async    = str_replace( "media='all'", "media='print' onload=\"this.media='all'\"", $html );
	if ( $async === $html ) {
		$async = str_replace( 'media="all"', 'media="print" onload="this.media=\'all\'"', $html );
	}
	if ( $async === $html ) {
		return $html;
	}
	return $async . '<noscript>' . $blocking . '</noscript>' . "\n";
}
add_filter( 'style_loader_tag', 'kiduki_seo_async_google_fonts', 10, 2 );

/**
 * reCAPTCHA（約350KB）はお問い合わせページ以外では読まない。
 * Contact Form 7 のフォームは /contact/ だけにある。
 */
function kiduki_seo_dequeue_recaptcha_off_contact() {
	if ( is_page( 'contact' ) || kiduki_is_contact_thanks_page() ) {
		return;
	}
	wp_dequeue_script( 'google-recaptcha' );
	wp_dequeue_script( 'wpcf7-recaptcha' );
}
add_action( 'wp_enqueue_scripts', 'kiduki_seo_dequeue_recaptcha_off_contact', 100 );
