/* Site content overrides — published from the portal's Website editor.
   Also boots the in-place editor (cms-edit.js) when the portal asks. */
(function () {
  var okColor = function (v) { return /^#[0-9a-fA-F]{3,8}$/.test(v || ""); };
  var okNum = function (v) { return typeof v === "number" && isFinite(v); };

  // tag every element's ORIGINAL position before any overrides move things —
  // override selectors are built from these so they always target pristine HTML
  function tagIdx() {
    ["header", "main", "footer"].forEach(function (root) {
      var r = document.querySelector(root);
      if (!r) return;
      var walk = function (el) {
        [].slice.call(el.children).forEach(function (c, i) {
          c.dataset.cmsIdx = i + 1;
          walk(c);
        });
      };
      walk(r);
    });
  }

  function apply(c) {
    if (!c) return;
    var here = location.pathname.split("/").pop() || "index.html";
    var orders = [];
    (c.overrides || []).forEach(function (o) {
      if (o.page && o.page !== here) return; // overrides are per-page
      if (o.type === "order") { orders.push(o); return; }
      try {
        document.querySelectorAll(o.sel).forEach(function (el) {
          if (o.type === "text") el.textContent = o.value;
          else if (o.type === "html") el.innerHTML = o.value;
          else if (o.type === "attr") el.setAttribute(o.attr || "src", o.value);
        });
      } catch (e) { /* bad selector — skip */ }
    });
    orders.forEach(function (o) { // reorder children by original index
      try {
        var p = document.querySelector(o.sel);
        if (!p) return;
        var byIdx = {};
        [].slice.call(p.children).forEach(function (k) { byIdx[k.dataset.cmsIdx] = k; });
        (o.value || []).forEach(function (idx) { if (byIdx[idx]) p.appendChild(byIdx[idx]); });
      } catch (e) { /* skip */ }
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

  tagIdx();
  fetch("content.json?v=" + Date.now())
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(apply)
    .catch(function () {});

  window.addEventListener("message", function (e) {
    var d = e.data || {};
    if (d.type === "cms-preview") apply(d.content);
    if (d.type === "cms-edit-on" && !window.__cmsEdit) {
      window.__cmsEdit = true;
      if (d.content) apply(d.content);
      var s = document.createElement("script");
      s.src = "js/cms-edit.js?v=" + Date.now();
      document.body.appendChild(s);
    }
  });
})();
