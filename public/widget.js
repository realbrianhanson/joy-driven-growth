(function () {
  var script = document.currentScript || (function () {
    var s = document.getElementsByTagName('script');
    return s[s.length - 1];
  })();

  if (!script) return;
  var widgetId = script.getAttribute('data-widget-id');
  if (!widgetId || widgetId === 'YOUR_WIDGET_ID') return;

  var origin = new URL(script.src).origin;
  var iframe = document.createElement('iframe');
  iframe.src = origin + '/embed/widget/' + encodeURIComponent(widgetId);
  iframe.style.border = '0';
  iframe.style.width = '100%';
  iframe.style.minHeight = '320px';
  iframe.setAttribute('loading', 'lazy');
  iframe.setAttribute('title', 'Happy Client testimonials');

  window.addEventListener('message', function (e) {
    if (e.source === iframe.contentWindow && e.data && e.data.hcHeight) {
      iframe.style.height = e.data.hcHeight + 'px';
    }
  });

  script.parentNode.insertBefore(iframe, script);
})();