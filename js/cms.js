/* Site content overrides — driven by content.json (published from the portal's
   Website editor) and live-previewed via postMessage from the portal. */
(function () {
  var okColor = function (v) { return /^#[0-9a-fA-F]{3,8}$/.test(v || ""); };
  var okNum = function (v) { return typeof v === "number" && isFinite(v); };

  function apply(c) {
    if (!c) return;
    (c.overrides || []).forEach(function (o) {
      try {
        document.querySelectorAll(o.sel).forEach(function (el) {
          if (o.type === "text") el.textContent = o.value;
          else if (o.type === "html") el.innerHTML = o.value;
          else if (o.type === "attr") el.setAttribute(o.attr || "src", o.value);
        });
      } catch (e) { /* bad selector — skip */ }
    });
    var s = c.style || {};
    var css = "";
    if (okColor(s.gold)) css += ":root{--gold:" + s.gold + ";--gold-deep:" + s.gold + "}";
    if (okColor(s.paper)) css += ":root{--paper:" + s.paper + "}";
    if (okColor(s.ink)) css += ":root{--ink:" + s.ink + "}";
    if (okNum(s.rvDur)) css += ".rv{transition-duration:" + s.rvDur + "s}";
    if (s.reveals === false) css += ".rv{opacity:1 !important;transform:none !important;transition:none !important}";
    if (okNum(s.walkVh)) css += ".walk{height:" + s.walkVh + "vh}";
    var tag = document.getElementById("cms-style");
    if (!tag) { tag = document.createElement("style"); tag.id = "cms-style"; document.head.appendChild(tag); }
    tag.textContent = css;
  }

  fetch("content.json?v=" + Date.now())
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(apply)
    .catch(function () {});

  window.addEventListener("message", function (e) {
    if (e.data && e.data.type === "cms-preview") apply(e.data.content);
  });
})();
