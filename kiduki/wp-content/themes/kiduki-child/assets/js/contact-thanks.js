(function () {
  var eventKey = 'kiduki_generate_lead_sent';

  try {
    if (window.sessionStorage.getItem(eventKey)) {
      return;
    }
  } catch (error) {
    // Analytics must never block the thank-you page.
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer.push(arguments);
  };
  window.gtag('event', 'generate_lead', {
    event_category: 'engagement',
    event_label: 'contact_form',
  });

  try {
    window.sessionStorage.setItem(eventKey, '1');
  } catch (error) {
    // The event has already been dispatched; storage is optional.
  }
}());
