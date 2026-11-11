/*
 * Happy Client widget loader.
 * Paste the script tag where the testimonials should appear. It puts an iframe
 * there and keeps the iframe exactly as tall as its content.
 */
(function () {
  var script =
    document.currentScript ||
    (function () {
      var all = document.getElementsByTagName("script");
      return all[all.length - 1];
    })();

  if (!script || script.getAttribute("data-hc-loaded")) return;
  var widgetId = script.getAttribute("data-widget-id");
  if (!widgetId || widgetId === "YOUR_WIDGET_ID") return;
  script.setAttribute("data-hc-loaded", "1");

  var origin = new URL(script.src).origin;
  var iframe = document.createElement("iframe");
  iframe.src = origin + "/embed/widget/" + encodeURIComponent(widgetId);
  iframe.title = "Customer testimonials";
  iframe.loading = "lazy";
  iframe.setAttribute("scrolling", "no");
  iframe.setAttribute("allowtransparency", "true");
  iframe.setAttribute("allow", "fullscreen");
  iframe.style.cssText =
    "display:block;width:100%;height:320px;border:0;background:transparent;overflow:hidden;color-scheme:normal;";

  window.addEventListener("message", function (event) {
    if (event.origin !== origin || event.source !== iframe.contentWindow) return;
    var height = event.data && Number(event.data.hcHeight);
    if (height >= 0 && height < 20000) iframe.style.height = height + "px";
  });

  script.parentNode.insertBefore(iframe, script);
})();
