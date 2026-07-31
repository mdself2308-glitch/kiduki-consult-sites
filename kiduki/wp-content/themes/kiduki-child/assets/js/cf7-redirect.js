// 問い合わせの送信完了。wpcf7mailsent はメールが実際に送られたときだけ
// 発火するので、ここが事務所サイトの唯一のコンバージョン地点になる。
//
// GA4 の推奨イベント名 generate_lead を使う。独自名にすると GA4 側の
// 既定のレポートに乗らず、キーイベント指定も後追いになる。
//
// 送信直後に画面遷移するため、計測が飛ぶ前にページが消えないよう
// event_callback で遷移を待たせる。コールバックが返らない場合に備えて
// 1秒でタイムアウトさせ、遷移が止まることはないようにしてある。
document.addEventListener('wpcf7mailsent', function (event) {
  var moved = false;
  var go = function () {
    if (moved) { return; }
    moved = true;
    location.href = '/contact/thanks/';
  };

  if (typeof window.gtag === 'function') {
    window.gtag('event', 'generate_lead', {
      form_id: event && event.detail ? event.detail.contactFormId : undefined,
      form_name: 'kdk_contact',
      site: 'office',
      event_callback: go
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
