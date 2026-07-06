/* In-place editor — loaded by cms.js ONLY when the portal's Website page asks.
   Talks to the portal via postMessage; visitors never see this. */
(function () {
  var send = function (m) { parent.postMessage(m, "*"); };

  // selector from ORIGINAL positions (data-cms-idx set by cms.js before overrides)
  function pathOf(el) {
    if (!el || el === document.body) return "body";
    var tag = el.tagName.toLowerCase();
    if (tag === "header" || tag === "main" || tag === "footer") return tag;
    var idx = el.dataset.cmsIdx || (1 + [].indexOf.call(el.parentElement.children, el));
    return pathOf(el.parentElement) + " > :nth-child(" + idx + ")";
  }

  var st = document.createElement("style");
  st.textContent = ".cms-hover{outline:2px dashed #f2a900 !important;outline-offset:-2px;cursor:pointer}" +
    ".cms-sel{outline:3px solid #f2a900 !important;outline-offset:-3px}" +
    ".cms-tb{position:fixed;z-index:2147483647;background:#14161a;border-radius:9px;padding:6px;display:flex;gap:6px;align-items:center;box-shadow:0 4px 18px rgba(0,0,0,.4)}" +
    ".cms-tb button{background:#363b44;color:#fff;border:none;border-radius:5px;min-width:30px;height:30px;cursor:pointer;font-weight:700;font-size:14px}" +
    ".cms-tb input[type=color]{width:30px;height:30px;border:none;padding:0;background:none;cursor:pointer}" +
    "html{scroll-behavior:auto !important}";
  document.head.appendChild(st);

  var sel = null, hover = null;

  function cleanHtml(el) {
    var c = el.cloneNode(true);
    [].slice.call(c.querySelectorAll(".cms-hover,.cms-sel")).forEach(function (n) { n.classList.remove("cms-hover", "cms-sel"); });
    [].slice.call(c.querySelectorAll("[contenteditable]")).forEach(function (n) { n.removeAttribute("contenteditable"); });
    return c.innerHTML;
  }
  function reportText() { if (sel) send({ type: "cms-text", path: pathOf(sel), html: cleanHtml(sel) }); }

  document.addEventListener("mouseover", function (e) {
    if (tb.contains(e.target)) return;
    if (hover) hover.classList.remove("cms-hover");
    hover = e.target;
    if (hover !== sel && hover !== document.body) hover.classList.add("cms-hover");
  });

  document.addEventListener("click", function (e) {
    if (tb.contains(e.target)) return;
    e.preventDefault(); e.stopPropagation();
    if (sel) { sel.classList.remove("cms-sel"); sel.removeAttribute("contenteditable"); }
    sel = e.target;
    sel.classList.remove("cms-hover");
    sel.classList.add("cms-sel");
    var kind = sel.tagName === "IMG" ? "image" : sel.tagName === "VIDEO" ? "video" : "text";
    if (kind === "text") { sel.setAttribute("contenteditable", "true"); sel.focus(); }
    send({ type: "cms-selected", path: pathOf(sel), kind: kind, tag: sel.tagName.toLowerCase(), label: kind === "text" ? sel.textContent.trim().slice(0, 60) : (sel.getAttribute("src") || "") });
  }, true);

  document.addEventListener("input", function (e) { if (sel && (e.target === sel || sel.contains(e.target))) reportText(); });

  // floating selection toolbar: bold, italic, gold, any color
  var tb = document.createElement("div");
  tb.className = "cms-tb";
  tb.style.display = "none";
  tb.innerHTML = '<button data-cmd="bold">B</button><button data-cmd="italic" style="font-style:italic">I</button>' +
    '<button data-gold style="color:#f2a900">A</button><input type="color" title="Text color" value="#f2a900">';
  document.body.appendChild(tb);
  document.addEventListener("selectionchange", function () {
    var s = getSelection();
    if (s && !s.isCollapsed && sel && s.anchorNode && sel.contains(s.anchorNode)) {
      var r = s.getRangeAt(0).getBoundingClientRect();
      tb.style.display = "flex";
      tb.style.left = Math.max(8, Math.min(innerWidth - 180, r.left)) + "px";
      tb.style.top = Math.max(8, r.top - 44) + "px";
    } else if (document.activeElement !== tb.querySelector("input")) {
      tb.style.display = "none";
    }
  });
  tb.addEventListener("mousedown", function (e) {
    var b = e.target.closest("button");
    if (!b) return;
    e.preventDefault();
    if (b.dataset.cmd) document.execCommand(b.dataset.cmd);
    else document.execCommand("foreColor", false, "#f2a900");
    reportText();
  });
  tb.querySelector("input").addEventListener("input", function (e) {
    document.execCommand("foreColor", false, e.target.value);
    reportText();
  });

  // section outline (Google-Sites-style block list in the portal)
  function outline() {
    var secs = [].slice.call(document.querySelectorAll("main > *")).map(function (s) {
      var h = s.querySelector("h1,h2,h3");
      var label = (h && h.textContent.trim().replace(/\s+/g, " ").slice(0, 42)) || s.className.split(" ")[0] || s.tagName.toLowerCase();
      return { path: pathOf(s), label: label };
    });
    send({ type: "cms-outline", sections: secs });
  }

  function orderReport(p) {
    send({ type: "cms-order", sel: pathOf(p), value: [].slice.call(p.children).map(function (k) { return Number(k.dataset.cmsIdx); }) });
  }

  window.addEventListener("message", function (e) {
    var d = e.data || {};
    try {
      if (d.type === "cms-set-attr") {
        var el = document.querySelector(d.path);
        if (el) { el.setAttribute(d.attr || "src", d.value); if (el.tagName === "VIDEO") el.load(); }
      }
      if (d.type === "cms-move") {
        var m = document.querySelector(d.path);
        if (!m) return;
        var p = m.parentElement;
        var sib = d.dir < 0 ? m.previousElementSibling : m.nextElementSibling;
        if (!sib) return;
        p.insertBefore(m, d.dir < 0 ? sib : sib.nextSibling);
        orderReport(p);
        outline();
        m.scrollIntoView({ block: "center" });
      }
      if (d.type === "cms-scroll") {
        var t = document.querySelector(d.path);
        if (t) t.scrollIntoView({ block: "center" });
      }
    } catch (err) { /* bad path — ignore */ }
  });

  outline();
  send({ type: "cms-edit-ready" });
})();
