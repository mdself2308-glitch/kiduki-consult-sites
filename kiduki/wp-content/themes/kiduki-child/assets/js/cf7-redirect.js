// 問い合わせの送信完了。wpcf7mailsent はメールが実際に送られたときだけ
// 発火するので、ここを事務所サイトの第一コンバージョン地点にする。
//
// GA4 の推奨イベント名 generate_lead を使う。独自名にすると GA4 側の
// 既定のレポートに乗らず、キーイベント指定も後追いになる。
//
// 送信直後に画面遷移するため、計測が飛ぶ前にページが消えないよう
// event_callback で遷移を待たせる。GA4への送信完了が確認できた場合だけ
// sessionStorageへ記録し、遷移先サンクスページでの二重発火を防ぐ。
// コールバックが返らない場合は1秒で遷移し、サンクスページ側が計測を補完する。
document.addEventListener('wpcf7mailsent', function (event) {
  var eventKey = 'kiduki_generate_lead_sent';
  var moved = false;
  var go = function () {
    if (moved) { return; }
    moved = true;
    location.href = '/contact/thanks/';
  };
  var markAndGo = function () {
    try {
      window.sessionStorage.setItem(eventKey, '1');
    } catch (error) {
      // Analytics and navigation must work even when storage is unavailable.
    }
    go();
  };

  if (typeof window.gtag === 'function') {
    window.gtag('event', 'generate_lead', {
      form_id: event && event.detail ? event.detail.contactFormId : undefined,
      form_name: 'kdk_contact',
      site: 'office',
      event_callback: markAndGo
    });
    setTimeout(go, 1000);
  } else {
    go();
  }
}, false);

// 同意欄のプライバシーポリシーリンクは <label> の内側にある。クリックが
// ラベルまで伝わるとチェックボックスも切り替わるため、読むためのクリックが
// 同意状態を書き換えてしまう。リンク上のクリックだけ伝播を止める。
document.addEventListener('click', function (event) {
  var target = event.target;

  if (target && target.closest && target.closest('.wpcf7-list-item-label a')) {
    event.stopPropagation();
  }
}, false);
