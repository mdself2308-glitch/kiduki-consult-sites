import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync('consult/index.html', 'utf8');
const script = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map((match) => match[1])
  .find((source) => source.includes('contactUrl.searchParams'));
assert.ok(script, 'static contact attribution script was not found');

const makeAnchor = (role) => {
  const attributes = new Map([
    ['href', 'https://kdkconslt-sngyouijm.com/contact/'],
  ]);
  if (role) attributes.set('data-cta', role);
  const listeners = new Map();
  return {
    addEventListener(type, handler) {
      listeners.set(type, handler);
    },
    getAttribute(name) {
      return attributes.get(name) || null;
    },
    setAttribute(name, value) {
      attributes.set(name, String(value));
    },
    click() {
      listeners.get('click')();
    },
  };
};

const hero = makeAnchor('hero');
const footer = makeAnchor();
const header = {
  classList: {
    add() {},
    remove() {},
  },
};
const gtagCalls = [];
const context = {
  URL,
  document: {
    getElementById(id) {
      return id === 'header' ? header : null;
    },
    querySelectorAll(selector) {
      return selector.includes('/contact/') ? [hero, footer] : [];
    },
  },
  gtag(...args) {
    gtagCalls.push(args);
  },
  window: {
    addEventListener() {},
    scrollY: 0,
  },
};

vm.runInNewContext(script, context);
assert.equal(hero.getAttribute('href'), 'https://kdkconslt-sngyouijm.com/contact/');
assert.equal(footer.getAttribute('href'), 'https://kdkconslt-sngyouijm.com/contact/');

hero.click();
const heroUrl = new URL(hero.getAttribute('href'));
assert.equal(heroUrl.searchParams.get('kdk_source_page'), 'consult-home');
assert.equal(heroUrl.searchParams.get('kdk_target_offer'), 'general-inquiry');
assert.equal(heroUrl.searchParams.get('kdk_cta_role'), 'hero');
assert.equal(gtagCalls[0][1], 'service_contact_click');
assert.equal(gtagCalls[0][2].source_page, 'consult-home');
assert.equal(gtagCalls[0][2].transport_type, 'beacon');
assert.equal('lead_tracking_id' in gtagCalls[0][2], false);

footer.click();
const footerUrl = new URL(footer.getAttribute('href'));
assert.equal(footerUrl.searchParams.get('kdk_cta_role'), 'footer');
assert.equal(gtagCalls[1][2].cta_role, 'footer');

console.log(JSON.stringify({
  ok: true,
  checks: [
    'crawlable-contact-hrefs-remain-clean-before-click',
    'contact-hrefs-decorated-only-on-click',
    'standard-service-contact-click-event',
    'footer-role-fallback',
    'first-party-id-excluded-from-static-ga4',
  ],
}, null, 2));
