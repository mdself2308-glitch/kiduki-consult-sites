import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const cf7Source = fs.readFileSync(
  'kiduki/wp-content/themes/kiduki-child/assets/js/cf7-redirect.js',
  'utf8',
);
const thanksSource = fs.readFileSync(
  'kiduki/wp-content/themes/kiduki-child/assets/js/contact-thanks.js',
  'utf8',
);

const createStorage = (initial = {}) => {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => (values.has(key) ? values.get(key) : null),
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
};

const createHarness = (origin, options = {}) => {
  const listeners = new Map();
  const formListeners = new Map();
  const inputs = [];
  const initialStorage = origin
    ? { kiduki_content_origin: JSON.stringify(origin) }
    : {};
  const storage = createStorage(initialStorage);
  const gtagCalls = [];
  const replacedUrls = [];

  const form = {
    querySelector(selector) {
      const name = selector.match(/data-kiduki-attribution="([^"]+)"/)?.[1];
      return inputs.find((input) => input.attributes['data-kiduki-attribution'] === name) || null;
    },
    appendChild(input) {
      inputs.push(input);
    },
    addEventListener(type, handler) {
      formListeners.set(type, handler);
    },
  };

  const document = {
    title: 'KIDUKI contact',
    addEventListener(type, handler) {
      listeners.set(type, handler);
    },
    querySelector(selector) {
      return selector === '.wpcf7-form' ? form : null;
    },
    createElement() {
      return {
        attributes: {},
        setAttribute(name, value) {
          this.attributes[name] = value;
        },
      };
    },
  };

  const startingHref = options.href || 'https://kdkconslt-sngyouijm.com/contact/';
  const parsedLocation = new URL(startingHref);
  const location = {
    href: parsedLocation.href,
    search: parsedLocation.search,
    pathname: parsedLocation.pathname,
    hash: parsedLocation.hash,
  };
  const history = {
    replaceState(_state, _title, nextUrl) {
      replacedUrls.push(nextUrl);
      const parsed = new URL(nextUrl, location.href);
      location.href = parsed.href;
      location.search = parsed.search;
      location.pathname = parsed.pathname;
      location.hash = parsed.hash;
    },
  };
  const window = {
    history,
    location,
    sessionStorage: storage,
    gtag(...args) {
      gtagCalls.push(args);
    },
  };
  const context = {
    Date,
    JSON,
    Math,
    Number,
    RegExp,
    URL,
    URLSearchParams,
    document,
    location,
    setTimeout() {},
    window,
  };
  vm.runInNewContext(cf7Source, context);

  return {
    context,
    documentListeners: listeners,
    field(name) {
      return inputs.find((input) => input.name === name)?.value;
    },
    formListeners,
    gtagCalls,
    replacedUrls,
    storage,
  };
};

const validToken = 'kdk-m123abc9-a1b2c3d4';
const freshArticle = createHarness({
  article_slug: 'night-shift-sleep-management',
  source_page: '',
  target_offer: 'kiduki-basic',
  article_cta_role: 'primary',
  lead_tracking_id: validToken,
  clicked_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
});

assert.equal(freshArticle.field('source-article'), 'night-shift-sleep-management');
assert.equal(freshArticle.field('source-page'), '(direct)');
assert.equal(freshArticle.field('lead-tracking-id'), validToken);

freshArticle.storage.setItem('kiduki_content_origin', JSON.stringify({
  article_slug: 'night-shift-sleep-management',
  source_page: '',
  target_offer: 'kiduki-basic',
  article_cta_role: 'primary',
  lead_tracking_id: validToken,
  clicked_at: new Date(Date.now() - 31 * 60 * 1000).toISOString(),
}));
freshArticle.formListeners.get('submit')();
assert.equal(freshArticle.field('source-article'), '(direct)');
assert.equal(freshArticle.field('target-offer'), '(not_set)');
assert.equal(freshArticle.field('lead-tracking-id'), '');

const freshService = createHarness({
  article_slug: '',
  source_page: 'return-to-work-support',
  target_offer: 'return-to-work',
  article_cta_role: 'service-primary',
  lead_tracking_id: validToken,
  clicked_at: new Date(Date.now() - 60 * 1000).toISOString(),
});
assert.equal(freshService.field('source-page'), 'return-to-work-support');
assert.equal(freshService.field('lead-tracking-id'), validToken);

freshService.documentListeners.get('wpcf7mailsent')({ detail: { contactFormId: 123 } });
assert.equal(freshService.gtagCalls.length, 1);
assert.equal(freshService.gtagCalls[0][1], 'generate_lead');
assert.equal(freshService.gtagCalls[0][2].source_page, 'return-to-work-support');
assert.equal('lead_tracking_id' in freshService.gtagCalls[0][2], false);

const consultHome = createHarness(null, {
  href: 'https://kdkconslt-sngyouijm.com/contact/?kdk_source_page=consult-home&kdk_target_offer=general-inquiry&kdk_cta_role=hero&utm_source=manual',
});
assert.equal(consultHome.field('source-article'), '(direct)');
assert.equal(consultHome.field('source-page'), 'consult-home');
assert.equal(consultHome.field('target-offer'), 'general-inquiry');
assert.equal(consultHome.field('article-cta-role'), 'hero');
assert.match(consultHome.field('lead-tracking-id'), /^kdk-[a-z0-9]+-[a-z0-9]{8}$/);
assert.equal(consultHome.replacedUrls[0], '/contact/?utm_source=manual');
consultHome.documentListeners.get('wpcf7mailsent')({ detail: { contactFormId: 123 } });
assert.equal(consultHome.gtagCalls[0][2].source_page, 'consult-home');
assert.equal(consultHome.gtagCalls[0][2].target_offer, 'general-inquiry');
assert.equal('lead_tracking_id' in consultHome.gtagCalls[0][2], false);

const invalidConsultHome = createHarness(null, {
  href: 'https://kdkconslt-sngyouijm.com/contact/?kdk_source_page=untrusted&kdk_target_offer=general-inquiry&kdk_cta_role=hero',
});
assert.equal(invalidConsultHome.field('source-page'), '(direct)');
assert.equal(invalidConsultHome.field('lead-tracking-id'), '');
assert.equal(invalidConsultHome.replacedUrls[0], '/contact/');

vm.runInNewContext(thanksSource, freshService.context);
assert.equal(freshService.gtagCalls.length, 1, 'thank-you page must not emit a second generate_lead');

console.log(JSON.stringify({
  ok: true,
  checks: [
    'fresh-article-attribution',
    'expired-attribution-cleared-before-submit',
    'spot-service-source-page-attribution',
    'consult-home-query-bridge-attribution',
    'consult-home-query-cleanup',
    'invalid-consult-home-attribution-rejected',
    'first-party-id-excluded-from-ga4',
    'generate-lead-emitted-once',
  ],
}, null, 2));
