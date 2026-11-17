/* RSVP pages (RSVP Lagos and RSVP Salvador): send the form to /api/rsvp (see api/rsvp.js)
   and show a thank you. No sync code and no account, the server knows where to write.

   One script serves both pages. The form says which page it is with data-rsvp-page:
   - "lagos":    asks "Will you join Our Ceremony?" (Yes or No). A Yes is sent as the Lagos
                 celebration, a No as "cannot come", both tagged page "lagos".
   - "salvador": keeps the full celebration choice (Lagos, Salvador, both, or cannot come).
   Either way the payload has the same shape that js/rsvp-core.js expects. */
(function () {
  "use strict";

  var form = document.getElementById("rsvp-form");
  if (!form) return;
  var page = form.getAttribute("data-rsvp-page") === "lagos" ? "lagos" : "salvador";
  var attending = document.getElementById("rsvp-attending");
  var other = document.getElementById("rsvp-other");
  var diet = document.getElementById("rsvp-dietary");
  var send = document.getElementById("rsvp-send");
  var errorBox = document.getElementById("rsvp-error");
  var thanks = document.getElementById("rsvp-thanks");
  var again = document.getElementById("rsvp-again");
  var thanksYes = document.getElementById("rsvp-thanks-yes");
  var thanksNo = document.getElementById("rsvp-thanks-no");

  var MESSAGES = {
    en: {
      invalid: "Please add your name and choose an answer, then try again.",
      too_many: "That is a lot of tries in a short time. Please wait a few minutes and try again.",
      generic: "We could not save your answer just now. Please try again in a little while."
    },
    pt: {
      invalid: "Por favor, preencha seu nome e escolha uma resposta, e tente de novo.",
      too_many: "Foram muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo.",
      generic: "Não conseguimos salvar sua resposta agora. Tente novamente daqui a pouco."
    }
  };

  function lang() {
    return document.documentElement.getAttribute("data-lang") === "pt" ? "pt" : "en";
  }

  // The dropdown labels switch with the language toggle.
  function labelOptions() {
    var pt = lang() === "pt";
    Array.prototype.forEach.call(diet.options, function (o) {
      if (!o.dataset.en) o.dataset.en = o.textContent;
      o.textContent = pt ? o.dataset.pt : o.dataset.en;
    });
  }
  labelOptions();
  new MutationObserver(labelOptions).observe(document.documentElement, { attributes: true, attributeFilter: ["data-lang"] });

  // The answer in the shape the server expects: "lagos", "salvador", "both" or "no".
  function selectedEvent() {
    if (page === "lagos") {
      var j = form.querySelector('input[name="join"]:checked');
      return j ? (j.value === "yes" ? "lagos" : "no") : "";
    }
    var r = form.querySelector('input[name="event"]:checked');
    return r ? r.value : "";
  }

  function syncVisibility() {
    attending.hidden = selectedEvent() === "no";
    other.hidden = diet.value !== "other" || selectedEvent() === "no";
  }
  form.addEventListener("change", syncVisibility);
  syncVisibility();

  function showError(kind) {
    errorBox.textContent = MESSAGES[lang()][kind] || MESSAGES[lang()].generic;
    errorBox.hidden = false;
  }

  again.addEventListener("click", function () {
    thanks.hidden = true;
    form.hidden = false;
    send.disabled = false;
    form.elements.name.focus();
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    errorBox.hidden = true;

    var nameField = form.elements.name;
    var name = nameField.value.trim();
    var event = selectedEvent();
    nameField.setAttribute("aria-invalid", name.length < 2 ? "true" : "false");
    if (name.length < 2 || !event) { showError("invalid"); return; }

    var payload = {
      page: page,
      name: name,
      event: event,
      guests: Number(form.elements.guests.value) || 1,
      dietary: diet.value,
      dietaryOther: form.elements.dietaryOther.value,
      travelHelp: form.elements.travelHelp.checked,
      website: form.elements.website.value   // honeypot, people leave it empty
    };

    send.disabled = true;   // also stops an accidental double click
    fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        if (res.ok) {
          // the message follows the guest's own answer, not whether we matched them to the list
          thanksYes.hidden = payload.event === "no";
          thanksNo.hidden = payload.event !== "no";
          form.hidden = true;
          thanks.hidden = false;
          thanks.focus();
          if (thanks.scrollIntoView) thanks.scrollIntoView({ block: "center" });
          return;
        }
        return res.json().catch(function () { return {}; }).then(function (body) {
          showError(res.status === 429 ? "too_many" : res.status === 400 ? "invalid" : "generic");
          // a short reference so the couple can tell what went wrong
          if (res.status >= 500 || res.status === 413) errorBox.textContent += " (" + (body.error || "error " + res.status) + ")";
          send.disabled = false;
        });
      })
      .catch(function () {
        showError("generic");
        errorBox.textContent += " (network)";
        send.disabled = false;
      });
  });
})();
