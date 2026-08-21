import fs from 'node:fs';

const cf7Redirect = fs.readFileSync(
  'kiduki/wp-content/themes/kiduki-child/assets/js/cf7-redirect.js',
  'utf8',
);
const contactThanks = fs.readFileSync(
  'kiduki/wp-content/themes/kiduki-child/assets/js/contact-thanks.js',
  'utf8',
);
const packForm = fs.readFileSync(
  'consult/return-to-work-pack/index.html',
  'utf8',
);
const spotForm = fs.readFileSync(
  'consult/return-to-work-spot/index.html',
  'utf8',
);

const checks = [];
const check = (name, condition) => checks.push({ name, ok: Boolean(condition) });
const storageKey = (source) =>
  source.match(/var eventKey = '([^']+)'/)?.[1] || null;
const eventAfterSuccessfulResponse = (source) => {
  const failureGuard = source.indexOf('!response.ok');
  const event = source
    .slice(Math.max(failureGuard, 0))
    .search(/gtag\s*\(\s*['"]event['"]\s*,\s*['"]generate_lead['"]/);
  return failureGuard >= 0 && event >= 0;
};

check('cf7-tracks-only-after-mail-sent', cf7Redirect.includes('wpcf7mailsent'));
check('cf7-sends-recommended-generate-lead-event', cf7Redirect.includes("window.gtag('event', 'generate_lead'"));
check('cf7-marks-dispatched-event-before-redirect', /var markAndGo = function \(\) \{[\s\S]*sessionStorage\.setItem\(eventKey, '1'\);[\s\S]*go\(\);/.test(cf7Redirect));
check('cf7-callback-uses-dispatch-marker', cf7Redirect.includes('event_callback: markAndGo'));
check('cf7-keeps-thank-you-fallback-timeout', cf7Redirect.includes('setTimeout(go, 1000)'));
check('thank-you-page-skips-an-already-dispatched-event', /sessionStorage\.getItem\(eventKey\)[\s\S]*return;/.test(contactThanks));
check('thank-you-page-sends-fallback-generate-lead-event', contactThanks.includes("window.gtag('event', 'generate_lead'"));
check('cf7-and-thank-you-page-share-deduplication-key', storageKey(cf7Redirect) !== null && storageKey(cf7Redirect) === storageKey(contactThanks));
check('pack-form-tracks-only-after-success-response', eventAfterSuccessfulResponse(packForm));
check('spot-form-tracks-only-after-success-response', eventAfterSuccessfulResponse(spotForm));

const failures = checks.filter((item) => !item.ok);
console.log(JSON.stringify({ ok: failures.length === 0, checks, failures }, null, 2));
if (failures.length > 0) process.exit(1);
