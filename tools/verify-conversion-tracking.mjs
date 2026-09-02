import fs from 'node:fs';

const cf7Redirect = fs.readFileSync(
  'kiduki/wp-content/themes/kiduki-child/assets/js/cf7-redirect.js',
  'utf8',
);
const contactThanks = fs.readFileSync(
  'kiduki/wp-content/themes/kiduki-child/assets/js/contact-thanks.js',
  'utf8',
);
const functionsPhp = fs.readFileSync(
  'kiduki/wp-content/themes/kiduki-child/functions.php',
  'utf8',
);
const staticHome = fs.readFileSync('consult/index.html', 'utf8');
const packForm = fs.readFileSync(
  'consult/return-to-work-pack/index.html',
  'utf8',
);
const spotForm = fs.readFileSync(
  'consult/return-to-work-spot/index.html',
  'utf8',
);
const articleSources = fs
  .readdirSync('content/articles')
  .filter((name) => name.endsWith('.html'))
  .map((name) => fs.readFileSync(`content/articles/${name}`, 'utf8'));

const checks = [];
const check = (name, condition) => checks.push({ name, ok: Boolean(condition) });
const eventAfterSuccessfulResponse = (source) => {
  const failureGuard = source.indexOf('!response.ok');
  const event = source
    .slice(Math.max(failureGuard, 0))
    .search(/gtag\s*\(\s*['"]event['"]\s*,\s*['"]generate_lead['"]/);
  return failureGuard >= 0 && event >= 0;
};
const eventPayload = (source, eventName) => {
  const match = new RegExp(
    `(?:window\\.)?gtag\\s*\\(\\s*['"]event['"]\\s*,\\s*['"]${eventName}['"]`,
  ).exec(source);
  const start = match?.index ?? -1;
  if (start < 0) return '';
  const remainder = source.slice(start);
  const end = remainder.indexOf('});');
  return end >= 0 ? remainder.slice(0, end + 3) : remainder.slice(0, 1200);
};

check('cf7-tracks-only-after-mail-sent', cf7Redirect.includes('wpcf7mailsent'));
check('cf7-sends-recommended-generate-lead-event', cf7Redirect.includes("window.gtag('event', 'generate_lead'"));
check('cf7-marks-dispatched-event-before-redirect', /if \(eventWasConfirmed\) \{[\s\S]*sessionStorage\.setItem\(eventKey, '1'\);[\s\S]*go\(\);/.test(cf7Redirect));
check('cf7-callback-uses-dispatch-marker', cf7Redirect.includes('event_callback: markAndGo'));
check('cf7-keeps-thank-you-fallback-timeout', cf7Redirect.includes('setTimeout(function () { clearAttributionAndGo(false); }, 1000)'));
check('thank-you-page-does-not-send-generate-lead', !contactThanks.includes("window.gtag('event', 'generate_lead'"));
check('pack-form-tracks-only-after-success-response', eventAfterSuccessfulResponse(packForm));
check('spot-form-tracks-only-after-success-response', eventAfterSuccessfulResponse(spotForm));
check('pack-form-ga4-excludes-first-party-lead-id', !eventPayload(packForm, 'generate_lead').includes('lead_id'));
check('spot-form-ga4-excludes-first-party-lead-id', !eventPayload(spotForm, 'generate_lead').includes('lead_id'));
check('pack-form-ga4-uses-aggregate-funnel-dimensions',
  eventPayload(packForm, 'generate_lead').includes("source_page: 'return-to-work-pack'") &&
  eventPayload(packForm, 'generate_lead').includes("target_offer: 'return-to-work'") &&
  eventPayload(packForm, 'generate_lead').includes("cta_role: 'form-submit'"));
check('spot-form-ga4-uses-aggregate-funnel-dimensions',
  eventPayload(spotForm, 'generate_lead').includes("source_page:'return-to-work-spot'") &&
  eventPayload(spotForm, 'generate_lead').includes("target_offer:'return-to-work'") &&
  eventPayload(spotForm, 'generate_lead').includes("cta_role:'form-submit'") &&
  !eventPayload(spotForm, 'generate_lead').includes('support_reason'));
check('article-service-click-is-recorded', functionsPhp.includes("window.gtag('event', 'article_service_click'"));
check('spot-service-contact-click-is-recorded', functionsPhp.includes("window.gtag('event', 'service_contact_click'"));
check('spot-service-page-gets-first-party-origin', functionsPhp.includes("source_page: 'return-to-work-support'"));
check('article-origin-is-persisted-first-party', functionsPhp.includes("window.sessionStorage.setItem('kiduki_content_origin'"));
check('contact-event-includes-source-article', cf7Redirect.includes('source_article: origin.article_slug'));
check('contact-event-includes-source-page', cf7Redirect.includes('source_page: origin.source_page'));
check('contact-event-includes-target-offer', cf7Redirect.includes('target_offer: origin.target_offer'));
check('cf7-record-receives-source-article', cf7Redirect.includes("'source-article': origin.article_slug"));
check('cf7-record-receives-source-page', cf7Redirect.includes("'source-page': origin.source_page"));
check('cf7-record-receives-first-party-attribution-id', cf7Redirect.includes("'lead-tracking-id': origin.lead_tracking_id"));
check('ga4-article-click-excludes-attribution-id', !eventPayload(functionsPhp, 'article_service_click').includes('lead_tracking_id'));
check('ga4-contact-event-excludes-attribution-id', !eventPayload(cf7Redirect, 'generate_lead').includes('lead_tracking_id'));
check('ga4-thanks-fallback-excludes-attribution-id', !eventPayload(contactThanks, 'generate_lead').includes('lead_tracking_id'));
check('article-origin-has-thirty-minute-ttl', functionsPhp.includes('30 * 60 * 1000') && cf7Redirect.includes('30 * 60 * 1000'));
check('article-origin-is-cleared-after-success', cf7Redirect.includes("window.sessionStorage.removeItem('kiduki_content_origin')"));
check('article-origin-values-use-allowlists', functionsPhp.includes('allowedArticleSlugs') && cf7Redirect.includes('kidukiAllowedArticleSlugs'));
check('stresscheck-article-attribution-is-allowlisted',
  functionsPhp.includes("'stresschecknew': true") &&
  cf7Redirect.includes("'stresschecknew': true"));
check('service-source-page-uses-allowlist', cf7Redirect.includes('kidukiAllowedSourcePages'));
check('hidden-attribution-refreshes-before-submit', /addEventListener\('submit',[\s\S]*applyKidukiAttributionFields\(form\)/.test(cf7Redirect));
check('static-home-records-standard-contact-event', staticHome.includes("gtag('event', 'service_contact_click'"));
check('static-home-decorates-contact-links-with-aggregate-attribution',
  staticHome.includes('decorate only an actual user navigation') &&
  staticHome.includes("contactUrl.searchParams.set('kdk_source_page', 'consult-home')") &&
  staticHome.includes("contactUrl.searchParams.set('kdk_target_offer', 'general-inquiry')") &&
  staticHome.includes("contactUrl.searchParams.set('kdk_cta_role', ctaRole)"));
check('static-home-ga4-event-excludes-first-party-id', !eventPayload(staticHome, 'service_contact_click').includes('lead_tracking_id'));
check('contact-seeds-consult-home-first-party-origin',
  cf7Redirect.includes('seedKidukiContentOriginFromUrl') &&
  cf7Redirect.includes("'consult-home': true") &&
  cf7Redirect.includes("'general-inquiry': true"));
check('contact-strips-internal-attribution-query',
  cf7Redirect.includes('window.history.replaceState') &&
  cf7Redirect.includes('cleanUrl.searchParams.delete(key)'));
check('unapproved-scoped-consultation-is-not-used', articleSources.every((source) => !source.includes('scoped-consultation')));

const failures = checks.filter((item) => !item.ok);
console.log(JSON.stringify({ ok: failures.length === 0, checks, failures }, null, 2));
if (failures.length > 0) process.exit(1);
