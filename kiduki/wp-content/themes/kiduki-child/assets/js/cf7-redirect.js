document.addEventListener('wpcf7mailsent', function () {
  location.href = '/contact/thanks/';
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
