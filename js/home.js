// Good Again Contracting — homepage behavior
// (nav, scroll reveals, stat counters, scroll-driven walkthrough, before/after slider)

document.addEventListener("DOMContentLoaded", () => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Mobile nav toggle
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }

  // Header goes solid once you leave the hero top
  const hd = document.querySelector(".hd");
  const onScrollHd = () => hd.classList.toggle("is-scrolled", window.scrollY > 30);
  window.addEventListener("scroll", onScrollHd, { passive: true });
  onScrollHd();

  // Footer year
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  // Scroll reveals
  if (!reduced) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("in")),
      { threshold: 0.18 }
    );
    document.querySelectorAll(".rv").forEach((el) => io.observe(el));
  }

  // Stat counters (count up once visible)
  const counters = document.querySelectorAll("[data-count]");
  const runCounter = (el) => {
    const target = Number(el.dataset.count);
    if (reduced) { el.textContent = target; return; }
    const t0 = performance.now();
    const dur = 1600;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if (counters.length) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { runCounter(e.target); cio.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => cio.observe(el));
  }

  // ---------- Scroll-driven walkthrough ----------
  const walk = document.querySelector(".walk");
  if (walk) {
    const videos = [...walk.querySelectorAll(".walk-v")];
    const caps = [...walk.querySelectorAll(".walk-cap")];
    const dots = [...walk.querySelectorAll(".walk-dot")];
    const fill = walk.querySelector(".walk-fill");
    let active = -1;
    let near = false;

    const setActive = (i) => {
      if (i === active) return;
      active = i;
      videos.forEach((v, j) => {
        v.classList.toggle("on", j === i);
        if (j === i && !reduced) {
          if (v.preload === "none") v.preload = "auto";
          v.play().catch(() => {});
        } else {
          v.pause();
        }
      });
      caps.forEach((c, j) => c.classList.toggle("on", j === i));
      dots.forEach((d, j) => d.classList.toggle("on", j <= i));
    };

    const update = () => {
      const rect = walk.getBoundingClientRect();
      const total = walk.offsetHeight - window.innerHeight;
      const p = Math.min(1, Math.max(0, -rect.top / total));
      fill.style.height = p * 100 + "%";
      setActive(Math.min(videos.length - 1, Math.floor(p * videos.length)));
    };

    if (reduced) {
      setActive(0); // static first frame, no autoplay
    } else {
      // only do scroll math while the section is anywhere near the viewport
      new IntersectionObserver((entries) => {
        near = entries[0].isIntersecting;
        if (near) update();
        else videos.forEach((v) => v.pause());
      }, { rootMargin: "50% 0px" }).observe(walk);
      window.addEventListener("scroll", () => { if (near) update(); }, { passive: true });
      update();
    }
  }

  // ---------- Before / After slider ----------
  const ba = document.querySelector("#ba");
  if (ba) {
    const range = ba.querySelector(".ba-range");
    const apply = () => ba.style.setProperty("--pos", range.value + "%");
    range.addEventListener("input", apply);
    apply();
  }

  // ---------- Project filters (projects page) ----------
  const filterBtns = document.querySelectorAll(".filter-btn");
  const projects = document.querySelectorAll(".proj");
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => {
        b.classList.toggle("is-active", b === btn);
        b.setAttribute("aria-pressed", String(b === btn));
      });
      const filter = btn.dataset.filter;
      projects.forEach((card) => {
        card.hidden = filter !== "all" && card.dataset.category !== filter;
      });
    });
  });

  // ---------- Quote form (contact page) — opens the visitor's email client.
  // Swap for a Formspree/backend endpoint when one is set up. ----------
  const form = document.querySelector("#quote-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const subject = "Quote request — " + (data.get("projectType") || "General");
      const body = [
        "Name: " + data.get("name"),
        "Phone: " + data.get("phone"),
        "Email: " + data.get("email"),
        "Project type: " + data.get("projectType"),
        "Budget range: " + (data.get("budget") || "Not sure yet"),
        "Preferred timeline: " + (data.get("timeline") || "Flexible"),
        "",
        "Project details:",
        data.get("details"),
      ].join("\n");

      window.location.href =
        "mailto:themicahlong@gmail.com?subject=" +
        encodeURIComponent(subject) +
        "&body=" +
        encodeURIComponent(body);

      const success = document.querySelector("#form-success");
      if (success) {
        success.hidden = false;
        success.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      form.reset();
    });
  }
});
