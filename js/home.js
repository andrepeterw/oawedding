/* Home page only: the sunrise scroll effect, the countdown, and sharing. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Sunrise: --p goes from 0 (dawn) to 1 (full sunrise) over the whole page, reaching 1 as
          the footer comes into view. The sky is fixed behind the content (see .sunrise-bg). ---- */
  var root = document.documentElement;
  if (!reduceMotion) {
    var ticking = false;
    var update = function () {
      ticking = false;
      var footer = document.getElementById("site-footer");
      // the scroll position at which the footer's top edge reaches the bottom of the screen
      var end = footer ? footer.getBoundingClientRect().top + window.pageYOffset - window.innerHeight : 0;
      if (!(end > 0)) end = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      var p = Math.min(1, Math.max(0, window.pageYOffset / end));
      root.style.setProperty("--p", p.toFixed(3));
    };
    var onScroll = function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("load", onScroll);
    // the shared footer is loaded after the page, so measure again once it is in place
    setTimeout(onScroll, 600);
    setTimeout(onScroll, 1800);
    update();
  } else {
    root.style.setProperty("--p", "0.7");
  }

  /* ---- Countdown to the Nigerian Ceremony, the nearer date ---- */
  var box = document.getElementById("countdown");
  if (box) {
    var target = Date.parse(box.getAttribute("data-target"));
    var cells = {};
    box.querySelectorAll("[data-unit]").forEach(function (el) { cells[el.getAttribute("data-unit")] = el; });
    var pad = function (n, len) { var s = String(n); while (s.length < len) s = "0" + s; return s; };
    var tick = function () {
      var diff = Math.max(0, target - Date.now());
      var days = Math.floor(diff / 864e5); diff -= days * 864e5;
      var hours = Math.floor(diff / 36e5); diff -= hours * 36e5;
      var minutes = Math.floor(diff / 6e4); diff -= minutes * 6e4;
      var seconds = Math.floor(diff / 1e3);
      cells.days.textContent = pad(days, 3);
      cells.hours.textContent = pad(hours, 2);
      cells.minutes.textContent = pad(minutes, 2);
      cells.seconds.textContent = pad(seconds, 2);
    };
    if (!isNaN(target)) { tick(); setInterval(tick, 1000); }
  }

  /* ---- Sharing: native share sheet where available, plus WhatsApp and copy link ---- */
  var lang = function () { return document.documentElement.getAttribute("data-lang") === "pt" ? "pt" : "en"; };
  var message = function () {
    return lang() === "pt"
      ? "Kev e Andre Peter vão se casar! Lagos, 12 de junho de 2027, e Salvador, 19 de junho de 2027. #OurAlliance2027"
      : "Kev and Andre Peter are getting married! Lagos, June 12, 2027, and Salvador, June 19, 2027. #OurAlliance2027";
  };
  var status = document.querySelector("[data-share-status]");
  var say = function (en, pt) { if (status) status.textContent = lang() === "pt" ? pt : en; };
  var url = function () { return window.location.origin + "/"; };

  var whatsapp = document.querySelector("[data-whatsapp]");
  var refreshWhatsapp = function () {
    if (whatsapp) whatsapp.setAttribute("href", "https://wa.me/?text=" + encodeURIComponent(message() + " " + url()));
  };
  refreshWhatsapp();
  new MutationObserver(refreshWhatsapp).observe(document.documentElement, { attributes: true, attributeFilter: ["data-lang"] });
  if (whatsapp) whatsapp.addEventListener("click", refreshWhatsapp);

  var copyLink = function () {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url()).then(
        function () { say("Link copied.", "Link copiado."); },
        function () { say("Copy this link: " + url(), "Copie este link: " + url()); }
      );
    } else {
      say("Copy this link: " + url(), "Copie este link: " + url());
    }
  };
  var copyBtn = document.querySelector("[data-copy-link]");
  if (copyBtn) copyBtn.addEventListener("click", copyLink);

  var shareBtn = document.querySelector("[data-share]");
  if (shareBtn) {
    shareBtn.addEventListener("click", function () {
      if (navigator.share) {
        navigator.share({ title: document.title, text: message(), url: url() }).catch(function () {});
      } else {
        copyLink();
      }
    });
  }
})();
