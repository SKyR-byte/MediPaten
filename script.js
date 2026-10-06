/* MEDIPATEN – Interaktionen */
(function () {
  "use strict";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasIO = "IntersectionObserver" in window;

  /* ---------- Jahr im Footer ---------- */
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Header: Schatten + Mobile-Menü ---------- */
  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");
  function onScroll() { header.classList.toggle("scrolled", window.scrollY > 10); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  toggle.addEventListener("click", function () {
    var open = header.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
  });
  document.querySelectorAll(".main-nav a, .btn-header").forEach(function (a) {
    a.addEventListener("click", function () {
      header.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });

  /* ---------- Aktiver Navigationspunkt ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".main-nav a"));
  if (hasIO) {
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        navLinks.forEach(function (l) {
          l.classList.toggle("active", l.getAttribute("href") === "#" + e.target.id);
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    navLinks.forEach(function (l) {
      var t = document.querySelector(l.getAttribute("href"));
      if (t) navIO.observe(t);
    });
  }

  /* ---------- Sanftes Einblenden beim Scrollen ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if (!hasIO || reduceMotion) {
    reveals.forEach(function (el) { el.classList.add("visible"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        // Geschwister nacheinander einblenden (z. B. Timeline, Karten)
        var siblings = Array.prototype.filter.call(el.parentNode.children, function (c) { return c.classList.contains("reveal"); });
        el.style.transitionDelay = Math.min(siblings.indexOf(el), 5) * 110 + "ms";
        el.classList.add("visible");
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Hero-Animation: Pat:innen nehmen das Kind an die Hand ---------- */
  var scene = document.getElementById("scene");
  var replay = document.getElementById("replay");
  function play() {
    scene.classList.remove("play");
    void scene.getBoundingClientRect(); // Reflow, damit die Animation neu startet
    scene.classList.add("play");
    replay.classList.remove("show");
    setTimeout(function () { replay.classList.add("show"); }, 4300);
  }
  if (scene) {
    if (reduceMotion) {
      scene.classList.add("final");
    } else if (hasIO) {
      var played = false;
      new IntersectionObserver(function (entries, obs) {
        if (entries[0].isIntersecting && !played) {
          played = true;
          setTimeout(play, 350);
          obs.disconnect();
        }
      }, { threshold: 0.4 }).observe(scene);
    } else {
      play();
    }
    replay.addEventListener("click", play);
  }

  /* ---------- Anmeldeformular ---------- */
  var form = document.getElementById("signup");
  var status = document.getElementById("form-status");
  var cfg = window.MEDIPATEN_CONFIG || {};

  function setStatus(msg, type) {
    status.textContent = msg;
    status.className = "form-status" + (type ? " " + type : "");
  }

  function validate() {
    var ok = true;
    form.querySelectorAll("[required]").forEach(function (f) {
      var valid = f.type === "checkbox" ? f.checked : f.value.trim() !== "" && f.checkValidity();
      var target = f.type === "checkbox" ? f.closest(".consent") : f;
      target.classList.toggle("invalid", !valid);
      if (!valid) ok = false;
    });
    return ok;
  }
  form.addEventListener("input", function (e) {
    var t = e.target.type === "checkbox" ? e.target.closest(".consent") : e.target;
    if (t && t.classList.contains("invalid")) validate();
  });

  function showSuccess(name) {
    form.classList.add("sent");
    form.innerHTML =
      '<div class="success"><span class="big" aria-hidden="true">💛</span>' +
      "<h3>Danke, " + escapeHtml(name.split(" ")[0]) + "!</h3>" +
      "<p>Deine Anmeldung ist bei uns angekommen. Wir melden uns bald persönlich bei dir.</p>" +
      '<p class="muted">Bis dahin: Schau gern auf unserem Instagram-Profil vorbei – <a href="https://www.instagram.com/medipatenwitten.herdecke/" target="_blank" rel="noopener">@medipatenwitten.herdecke</a></p></div>';
  }
  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (form.elements._gotcha.value) return; // Bot
    if (!validate()) {
      setStatus("Bitte fülle alle Pflichtfelder (*) aus.", "err");
      var first = form.querySelector(".invalid");
      if (first) (first.querySelector("input") || first).focus();
      return;
    }

    var data = {
      name: form.elements.name.value.trim(),
      email: form.elements.email.value.trim(),
      semester: form.elements.semester.value,
      studiengang: form.elements.studiengang.value.trim(),
      nachricht: form.elements.nachricht.value.trim(),
      datenschutz: "zugestimmt",
      _subject: "Neue MEDIPATEN-Anmeldung: " + form.elements.name.value.trim(),
      _replyto: form.elements.email.value.trim(),
      _template: "table",
      _captcha: "false"
    };

    if (!cfg.FORM_ENDPOINT) {
      if (cfg.CONTACT_EMAIL) {
        var body = "Name: " + data.name + "\nE-Mail: " + data.email + "\nSemester: " + data.semester +
          "\nStudiengang: " + data.studiengang + "\n\n" + data.nachricht;
        window.location.href = "mailto:" + cfg.CONTACT_EMAIL + "?subject=" +
          encodeURIComponent(data._subject) + "&body=" + encodeURIComponent(body);
        setStatus("Dein E-Mail-Programm öffnet sich – bitte sende die Nachricht dort ab.", "ok");
      } else {
        setStatus("Das Formular ist noch nicht eingerichtet. Bitte schreib uns vorerst über Instagram.", "err");
      }
      return;
    }

    var btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = "Wird gesendet …";
    setStatus("");

    fetch(cfg.FORM_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(data)
    }).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      showSuccess(data.name);
    }).catch(function () {
      btn.disabled = false;
      btn.textContent = "Anmeldung absenden";
      setStatus("Das hat leider nicht geklappt. Bitte versuche es später erneut oder schreib uns über Instagram.", "err");
    });
  });
})();
