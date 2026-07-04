// Good Again Contracting — shared site behavior

document.addEventListener("DOMContentLoaded", () => {
  // Mobile nav toggle
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }

  // Sticky header shadow
  const header = document.querySelector(".site-header");
  if (header) {
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 4);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // Footer year
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  // Portfolio filters
  const filterBtns = document.querySelectorAll(".filter-btn");
  const projects = document.querySelectorAll(".project-card");
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

  // Testimonial rotator (home page)
  const rotator = document.querySelector(".rotator");
  if (rotator) {
    const quotes = JSON.parse(rotator.dataset.quotes);
    const quoteEl = rotator.querySelector("blockquote");
    const citeEl = rotator.querySelector("cite");
    const dotsWrap = rotator.querySelector(".rotator-dots");
    let index = 0;
    let timer;

    const show = (i) => {
      index = i;
      quoteEl.textContent = "“" + quotes[i].text + "”";
      citeEl.textContent = "— " + quotes[i].name;
      dotsWrap.querySelectorAll("button").forEach((d, j) => {
        d.classList.toggle("is-active", j === i);
      });
    };

    const restart = () => {
      clearInterval(timer);
      timer = setInterval(() => show((index + 1) % quotes.length), 6000);
    };

    quotes.forEach((q, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("aria-label", "Show review " + (i + 1));
      dot.addEventListener("click", () => { show(i); restart(); });
      dotsWrap.appendChild(dot);
    });

    show(0);
    restart();
  }

  // Quote form — opens the visitor's email client with a pre-filled message.
  // Swap the handler for a Formspree/Netlify/backend endpoint when one is set up.
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
