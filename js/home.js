/* Home page only: the invitation background, the opening seal and veil, the countdown, and sharing. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- The invitation: --b goes from 0 (the monogram sharp, as on a cover) to 1 (a soft blur behind the
          cards) over the first part of the scroll. A cheap opacity fade of a second, already blurred copy. ---- */
  var root = document.documentElement;
  var ticking = false;

  /* ---- Opening gesture (seal and veil). Everything here is wrapped so a failure leaves Home as it was. ---- */
  var seal = document.getElementById("seal");
  var veil = document.querySelector(".veil");
  var sealOpen = false;
  var removeSeal = function () {
    if (seal && seal.parentNode) seal.parentNode.removeChild(seal);
    seal = null;
  };
  var openSeal = function () {
    if (sealOpen || !seal) return;
    sealOpen = true;                       // once per page load, it never comes back, not even at the very top
    try {
      var paper = seal;
      paper.classList.add("is-opening");
      var done = false;
      var finish = function () { if (!done) { done = true; removeSeal(); } };
      paper.addEventListener("animationend", function (e) { if (e.animationName === "seal-paper-away") finish(); });
      setTimeout(finish, 1300);            // never depends on the animation event
    } catch (e) { removeSeal(); }
  };
  try {
    root.classList.add("seal-armed");      // cancels the CSS fail safe that would let the seal go after 6 seconds
    if (reduceMotion) {
      removeSeal();
      if (veil && veil.parentNode) veil.parentNode.removeChild(veil);
      veil = null;
    } else if (seal) {
      if (window.getComputedStyle(seal).visibility === "hidden" || window.pageYOffset > 2 || location.hash) {
        removeSeal();                      // arrived mid page, on a #link, or the fail safe already fired
      } else {
        seal.addEventListener("click", openSeal);
        // a keyboard user tabbing into the page behind the seal opens it too
        document.addEventListener("focusin", function (e) { if (seal && !seal.contains(e.target)) openSeal(); });
      }
    }
  } catch (e) { removeSeal(); }

  /* ---- --b goes from 0 (the monogram sharp, as on a cover) to 1 (a soft blur behind the cards) over the first
          part of the scroll. A cheap opacity fade of a second, already blurred copy. The veil lifts with it
          (--v reaches 1 when --b reaches 0.7), and the first scroll opens the seal. One handler for all of it. ---- */
  var update = function () {
    ticking = false;
    var span = Math.max(1, window.innerHeight * 0.6);
    var y = window.pageYOffset;
    var b = Math.min(1, Math.max(0, y / span));
    root.style.setProperty("--b", b.toFixed(3));
    if (veil) {
      var v = Math.min(1, b / 0.7);
      veil.style.setProperty("--v", v.toFixed(3));
      veil.classList.toggle("is-gone", v >= 1);
    }
    if (seal && !sealOpen && y > 0) openSeal();
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
