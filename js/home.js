/* Home page only: the invitation background, the opening seal and veil, the countdown, and sharing. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- The invitation: kraft paper behind the page, a seal on top at first, a sheer veil that lifts as you scroll. ---- */
  var root = document.documentElement;
  var ticking = false;

  /* ---- Opening gesture (seal and veil). Everything here is wrapped so a failure leaves Home as it was. ---- */
  var seal = document.getElementById("seal");
  var veil = document.querySelector(".veil");
  // The seal is a closed invitation. State: "closed" (shown), "open" (hidden). It opens on the first scroll, a tap
  // or keyboard focus, and closes again when the visitor scrolls back up to the very top.
  var sealState = "closed";
  var away = false;                        // scrolled far enough down that coming back to the top closes it again
  var removeSeal = function () {
    if (seal && seal.parentNode) seal.parentNode.removeChild(seal);
    seal = null;
  };
  var after = function (el, name, fn) {    // run fn when the animation ends, never depending on the event alone
    var done = false;
    var run = function () { if (!done) { done = true; fn(); } };
    el.addEventListener("animationend", function (e) { if (e.animationName === name) run(); });
    setTimeout(run, 1300);
  };
  var openSeal = function () {
    if (!seal || sealState === "open") return;
    sealState = "open";
    try {
      seal.classList.remove("is-closing");
      seal.classList.add("is-opening");
      var el = seal;
      after(el, "seal-paper-away", function () {
        if (sealState === "open") { el.classList.remove("is-opening"); el.classList.add("is-gone"); }
      });
    } catch (e) { removeSeal(); }
  };
  var closeSeal = function () {
    if (!seal || sealState === "closed") return;
    sealState = "closed";
    away = false;
    try {
      var el = seal;
      el.classList.remove("is-gone", "is-opening");
      el.classList.add("is-closing");
      after(el, "seal-paper-in", function () { if (sealState === "closed") el.classList.remove("is-closing"); });
    } catch (e) { removeSeal(); }
  };
  try {
    root.classList.add("seal-armed");      // cancels the CSS fail safe that would let the seal go after 6 seconds
    if (reduceMotion) {
      removeSeal();
      if (veil && veil.parentNode) veil.parentNode.removeChild(veil);
      veil = null;
    } else if (seal) {
      if (window.getComputedStyle(seal).visibility === "hidden") {
        removeSeal();                      // the fail safe already fired, the seal is not coming back
      } else {
        seal.addEventListener("click", openSeal);
        // a keyboard user tabbing into the page behind the seal opens it too
        document.addEventListener("focusin", function (e) { if (seal && sealState === "closed" && !seal.contains(e.target)) openSeal(); });
        if (window.pageYOffset > 2 || location.hash) {
          sealState = "open";              // arrived mid page or on a #link: start open, it still closes on return to the top
          seal.classList.add("is-gone");
        }
      }
    }
  } catch (e) { removeSeal(); }

  /* ---- One scroll handler: the veil lifts (--v goes from 0 to 1 over the first 42% of a screen of scrolling),
          the first scroll opens the seal, and coming back to the very top closes it again. ---- */
  var update = function () {
    ticking = false;
    var span = Math.max(1, window.innerHeight * 0.6);
    var y = window.pageYOffset;
    var b = Math.min(1, Math.max(0, y / span));
    if (veil) {
      var v = Math.min(1, b / 0.7);
      veil.style.setProperty("--v", v.toFixed(3));
      veil.classList.toggle("is-gone", v >= 1);
    }
    if (seal) {
      if (sealState === "closed" && y > 0) openSeal();
      else if (sealState === "open") {
        if (y > 60) away = true;
        else if (away && y <= 1) closeSeal();   // back at the very top: the invitation closes again
      }
    }
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
