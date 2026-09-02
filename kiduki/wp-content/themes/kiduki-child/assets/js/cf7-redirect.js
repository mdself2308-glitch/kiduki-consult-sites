// 問い合わせの送信完了。wpcf7mailsent はメールが実際に送られたときだけ
// 発火するので、ここを事務所サイトの第一コンバージョン地点にする。
//
// GA4 の推奨イベント名 generate_lead を使う。独自名にすると GA4 側の
// 既定のレポートに乗らず、キーイベント指定も後追いになる。
//
// 送信直後に画面遷移するため、計測が飛ぶ前にページが消えないよう
// event_callback で遷移を待たせる。GA4への送信完了が確認できた場合だけ
// sessionStorageへ記録する。generate_lead はこの完了イベントだけで送信し、
// サンクスページから再送しない。コールバックが返らない場合も1秒で遷移する。
document.addEventListener('wpcf7mailsent', function (event) {
  var eventKey = 'kiduki_generate_lead_sent';
  var origin = readKidukiContentOrigin();
  try {
    window.sessionStorage.removeItem(eventKey);
  } catch (error) {
    // Analytics and navigation must work even when storage is unavailable.
  }
  var moved = false;
  var go = function () {
    if (moved) { return; }
    moved = true;
    location.href = '/contact/thanks/';
  };
  var clearAttributionAndGo = function (eventWasConfirmed) {
    try {
      if (eventWasConfirmed) {
        window.sessionStorage.setItem(eventKey, '1');
      }
      window.sessionStorage.removeItem('kiduki_content_origin');
    } catch (error) {
      // Analytics and navigation must work even when storage is unavailable.
    }
    go();
  };
  var markAndGo = function () { clearAttributionAndGo(true); };

  if (typeof window.gtag === 'function') {
    window.gtag('event', 'generate_lead', {
      form_id: event && event.detail ? event.detail.contactFormId : undefined,
      form_name: 'kdk_contact',
      site: 'office',
      source_article: origin.article_slug || '(direct)',
      source_page: origin.source_page || '(direct)',
      target_offer: origin.target_offer || '(not_set)',
      article_cta_role: origin.article_cta_role || '(not_set)',
      transport_type: 'beacon',
      event_timeout: 1000,
      event_callback: markAndGo
    });
    setTimeout(function () { clearAttributionAndGo(false); }, 1000);
  } else {
    clearAttributionAndGo(false);
  }
}, false);

var kidukiAttributionTtlMs = 30 * 60 * 1000;
var kidukiAllowedArticleSlugs = {
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
var kidukiAllowedOffers = {
  'kiduki-basic': true,
  'kiduki-retain': true,
  'return-to-work': true,
  'casetra': true,
  'general-inquiry': true
};
var kidukiAllowedSourcePages = {
  'return-to-work-support': true,
  'consult-home': true
};
var kidukiAllowedCtaRoles = {
  primary: true,
  secondary: true,
  'service-primary': true,
  header: true,
  hero: true,
  service: true,
  final: true,
  footer: true
};
var kidukiAttributionQueryKeys = [
  'kdk_source_page',
  'kdk_target_offer',
  'kdk_cta_role'
];

function createKidukiLeadTrackingId() {
  var randomPart = Math.random().toString(36).slice(2);
  return 'kdk-' + Date.now().toString(36) + '-' + (randomPart + '00000000').slice(0, 8);
}

// The static consult home is a separate origin, so it cannot write this
// WordPress origin's sessionStorage. Accept only exact, non-PII allowlisted
// query values, create the pseudonymous first-party ID here, then remove the
// internal attribution parameters from the visible URL.
function seedKidukiContentOriginFromUrl() {
  var params;
  try {
    params = new URLSearchParams(window.location.search || '');
  } catch (error) {
    return;
  }

  var hasAttributionParams = kidukiAttributionQueryKeys.some(function (key) {
    return params.has(key);
  });
  if (!hasAttributionParams) { return; }

  var sourcePage = params.get('kdk_source_page') || '';
  var targetOffer = params.get('kdk_target_offer') || '';
  var ctaRole = params.get('kdk_cta_role') || '';
  var isValid = Boolean(
    kidukiAllowedSourcePages[sourcePage] &&
    kidukiAllowedOffers[targetOffer] &&
    kidukiAllowedCtaRoles[ctaRole]
  );

  if (isValid) {
    try {
      window.sessionStorage.setItem('kiduki_content_origin', JSON.stringify({
        article_slug: '',
        source_page: sourcePage,
        target_offer: targetOffer,
        article_cta_role: ctaRole,
        lead_tracking_id: createKidukiLeadTrackingId(),
        clicked_at: new Date().toISOString()
      }));
    } catch (error) {
      // The aggregate GA4 click still works when first-party storage is unavailable.
    }
  }

  try {
    var cleanUrl = new URL(window.location.href);
    kidukiAttributionQueryKeys.forEach(function (key) {
      cleanUrl.searchParams.delete(key);
    });
    window.history.replaceState(
      null,
      document.title,
      cleanUrl.pathname + cleanUrl.search + cleanUrl.hash
    );
  } catch (error) {
    // Attribution is already stored; URL cleanup must not block the form.
  }
}

function readKidukiContentOrigin() {
  var raw = {};
  try {
    raw = JSON.parse(window.sessionStorage.getItem('kiduki_content_origin') || '{}');
  } catch (error) {
    raw = {};
  }

  var clickedAt = Date.parse(raw.clicked_at || '');
  var now = Date.now();
  var isFresh = Number.isFinite(clickedAt) && clickedAt <= now && now - clickedAt <= kidukiAttributionTtlMs;
  var articleSlug = kidukiAllowedArticleSlugs[raw.article_slug] ? raw.article_slug : '';
  var sourcePage = kidukiAllowedSourcePages[raw.source_page] ? raw.source_page : '';
  var targetOffer = kidukiAllowedOffers[raw.target_offer] ? raw.target_offer : '';
  var articleCtaRole = kidukiAllowedCtaRoles[raw.article_cta_role] ? raw.article_cta_role : '';
  var leadTrackingId = /^kdk-[a-z0-9]+-[a-z0-9]{8}$/.test(raw.lead_tracking_id || '')
    ? raw.lead_tracking_id
    : '';
  if (!isFresh) {
    try { window.sessionStorage.removeItem('kiduki_content_origin'); } catch (error) {}
    return {};
  }
  if ((!articleSlug && !sourcePage) || !targetOffer || !articleCtaRole) {
    return {};
  }

  return {
    article_slug: articleSlug,
    source_page: sourcePage,
    target_offer: targetOffer,
    article_cta_role: articleCtaRole,
    lead_tracking_id: leadTrackingId
  };
}

// Keep the pseudonymous first-party attribution token in CF7/Flamingo only.
// It is deliberately excluded from GA4 to avoid a high-cardinality identifier.
function applyKidukiAttributionFields(form) {
  var origin = readKidukiContentOrigin();
  var fields = {
    'source-article': origin.article_slug || '(direct)',
    'source-page': origin.source_page || '(direct)',
    'target-offer': origin.target_offer || '(not_set)',
    'article-cta-role': origin.article_cta_role || '(not_set)',
    'lead-tracking-id': origin.lead_tracking_id || ''
  };
  Object.keys(fields).forEach(function (name) {
    var input = form.querySelector('input[data-kiduki-attribution="' + name + '"]');
    if (!input) {
      input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      input.setAttribute('data-kiduki-attribution', name);
      form.appendChild(input);
    }
    input.value = fields[name];
  });
}

(function () {
  seedKidukiContentOriginFromUrl();
  var form = document.querySelector('.wpcf7-form');
  if (!form) { return; }
  applyKidukiAttributionFields(form);
  form.addEventListener('submit', function () {
    applyKidukiAttributionFields(form);
  }, true);
}());

// 同意欄のプライバシーポリシーリンクは <label> の内側にある。クリックが
// ラベルまで伝わるとチェックボックスも切り替わるため、読むためのクリックが
// 同意状態を書き換えてしまう。リンク上のクリックだけ伝播を止める。
document.addEventListener('click', function (event) {
  var target = event.target;

  if (target && target.closest && target.closest('.wpcf7-list-item-label a')) {
    event.stopPropagation();
  }
}, false);
