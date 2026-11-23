/* Home page only: the invitation background, the countdown, and sharing. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- The invitation: --b goes from 0 (the monogram sharp, as on a cover) to 1 (a soft blur behind the
          cards) over the first part of the scroll. A cheap opacity fade of a second, already blurred copy. ---- */
  var root = document.documentElement;
  var ticking = false;
  var update = function () {
    ticking = false;
    var span = Math.max(1, window.innerHeight * 0.6);
    var b = Math.min(1, Math.max(0, window.pageYOffset / span));
    root.style.setProperty("--b", b.toFixed(3));
  };
  var onScroll = function () {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();

  /* ---- Cards settle in as the top of each one comes into view. Checked on every scroll, so a card the visitor
          jumped past (an anchor, a fast flick) is never left hidden. Not with reduced motion. ---- */
  var pending = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  var revealDue = function () {
    var line = window.innerHeight * 0.92;
    pending = pending.filter(function (el) {
      if (el.getBoundingClientRect().top < line) { el.classList.add("in"); return false; }
      return true;
    });
  };
  if (!reduceMotion && pending.length) {
    root.classList.add("reveal-on");
    window.addEventListener("scroll", revealDue, { passive: true });
    window.addEventListener("resize", revealDue);
    revealDue();
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
