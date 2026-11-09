/* Shared header/footer injection, EN/PT language toggle, and mobile nav.
   Loaded on every page via <script src="/js/main.js" defer></script>. */

(function () {
  "use strict";

  var LANG_KEY = "kev-peter-wedding-lang";

  function applyLanguage(lang) {
    document.documentElement.setAttribute("data-lang", lang);
    document.querySelectorAll("[data-lang-btn]").forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(btn.dataset.langBtn === lang));
    });
  }

  function setLanguage(lang) {
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch (e) {
      /* localStorage unavailable — language just won't persist */
    }
    applyLanguage(lang);
  }

  function detectInitialLanguage() {
    var stored;
    try {
      stored = localStorage.getItem(LANG_KEY);
    } catch (e) {
      stored = null;
    }
    if (stored === "en" || stored === "pt") return stored;
    return navigator.language && navigator.language.toLowerCase().indexOf("pt") === 0
      ? "pt"
      : "en";
  }

  function markActiveNavLink() {
    var current = document.body.getAttribute("data-page");
    if (!current) return;
    document.querySelectorAll("#site-nav a[data-nav]").forEach(function (link) {
      if (link.dataset.nav === current) {
        link.classList.add("is-active");
        link.setAttribute("aria-current", "page");
        var group = link.closest(".nav-group");
        if (group) {
          var label = group.querySelector(".nav-group__label");
          if (label) label.classList.add("is-active-group");
        }
      }
    });
  }

  function wireLangButtons() {
    document.querySelectorAll("[data-lang-btn]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setLanguage(btn.dataset.langBtn);
      });
    });
  }

  function wireMobileNav() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.getElementById("site-nav");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  function loadPartial(url, target) {
    return fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error("Failed to load " + url);
        return res.text();
      })
      .then(function (html) {
        target.innerHTML = html;
      })
      .catch(function (err) {
        console.error(err);
      });
  }

  document.addEventListener("DOMContentLoaded", function () {
    applyLanguage(detectInitialLanguage());

    var header = document.getElementById("site-header");
    var footer = document.getElementById("site-footer");

    var headerReady = header
      ? loadPartial("/partials/nav.html", header)
      : Promise.resolve();
    var footerReady = footer
      ? loadPartial("/partials/footer.html", footer)
      : Promise.resolve();

    Promise.all([headerReady, footerReady]).then(function () {
      applyLanguage(detectInitialLanguage());
      wireLangButtons();
      wireMobileNav();
      markActiveNavLink();
    });
  });
})();
