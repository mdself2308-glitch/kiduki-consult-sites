(function () {
  // generate_lead is emitted only by the verified wpcf7mailsent handler.
  // The thank-you page must not create a second conversion event.
  try {
    window.sessionStorage.removeItem('kiduki_content_origin');
  } catch (error) {
    // Storage cleanup must never block the thank-you page.
  }
}());
