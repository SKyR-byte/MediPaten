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
  if (scene && !reduceMotion) {
    // Ohne JavaScript oder bei reduzierter Bewegung bleibt das fertige Bild stehen.
    scene.classList.add("armed");
    var played = false;
    var start = function () {
      if (played) return;
      played = true;
      setTimeout(play, 300);
    };
    if (hasIO) {
      new IntersectionObserver(function (entries, obs) {
        if (entries[0].isIntersecting) { start(); obs.disconnect(); }
      }, { threshold: 0.25 }).observe(scene);
      // Sicherheitsnetz, falls der Beobachter in einer Vorschau nie meldet
      setTimeout(start, 6000);
    } else {
      start();
    }
    replay.addEventListener("click", play);
  } else if (replay) {
    replay.hidden = true;
  }

  /* ---------- Kontaktformular: Reiter ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".form-tab"));
  function openTab(id, focus) {
    tabs.forEach(function (t) {
      var on = t.getAttribute("aria-controls") === id;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
      if (on && focus) t.focus();
    });
    document.querySelectorAll(".intro-panel").forEach(function (p) { p.hidden = p.getAttribute("data-panel") !== id; });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { openTab(t.getAttribute("aria-controls")); });
    t.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      var next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
      openTab(next.getAttribute("aria-controls"), true);
    });
  });
  // Links wie „Dein Standort fehlt?“ öffnen direkt den passenden Reiter
  document.querySelectorAll("[data-open-tab]").forEach(function (a) {
    a.addEventListener("click", function () { openTab(a.getAttribute("data-open-tab")); });
  });
  // Links auf das Formular („Kontakt“, „Pat:in werden“) zeigen den ersten Reiter
  document.querySelectorAll('a[href="#mitmachen"]:not([data-open-tab])').forEach(function (a) {
    a.addEventListener("click", function () { openTab("signup"); });
  });

  /* ---------- Kontaktformular: Absenden ---------- */
  var cfg = window.MEDIPATEN_CONFIG || {};
  var LABELS = { name: "Name", email: "E-Mail", telefon: "Telefon", semester: "Semester", studiengang: "Studiengang", alter: "Alter", alter_kind: "Alter des Kindes", sprachen: "Sprache(n)", klinik: "Klinik / Standort", interesse: "Interesse", taetigkeit: "Studiengang/Beruf", bereich: "Bereich", stadt: "Stadt", uni_klinik: "Uni / Klinik", nachricht: "Nachricht" };

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function setupForm(form) {
    var status = form.querySelector(".form-status");
    // Eltern werden gesiezt, Studierende geduzt
    var formal = form.hasAttribute("data-formal");
    var T = formal ? {
      required: "Bitte füllen Sie alle Pflichtfelder (*) aus.",
      insta: "Bei Fragen erreichen Sie uns auch auf Instagram –",
      failed: "Formspree hat die Nachricht abgelehnt: ",
      offline: "Die Nachricht konnte nicht gesendet werden, weil keine Verbindung zu Formspree möglich war. In Vorschauen (z. B. im Claude-Chat) ist das blockiert – auf der veröffentlichten Website funktioniert es. Sonst prüfen Sie bitte Ihre Internetverbindung oder schreiben Sie uns über Instagram."
    } : {
      required: "Bitte fülle alle Pflichtfelder (*) aus.",
      insta: "Bis dahin: Schau gern auf unserem Instagram-Profil vorbei –",
      failed: "Formspree hat die Nachricht abgelehnt: ",
      offline: "Die Nachricht konnte nicht gesendet werden, weil keine Verbindung zu Formspree möglich war. In Vorschauen (z. B. im Claude-Chat) ist das blockiert – auf der veröffentlichten Website funktioniert es. Sonst bitte Internetverbindung prüfen oder uns über Instagram schreiben."
    };
    function setStatus(msg, type) {
      status.textContent = msg;
      status.className = "form-status" + (type ? " " + type : "");
    }
    function validate() {
      var ok = true;
      form.querySelectorAll("[required]").forEach(function (f) {
        var valid, target;
        if (f.type === "checkbox") { valid = f.checked; target = f.closest(".consent"); }
        else if (f.type === "radio") { valid = !!form.querySelector('input[name="' + f.name + '"]:checked'); target = f.closest(".choice-group"); }
        else { valid = f.value.trim() !== "" && f.checkValidity(); target = f; }
        target.classList.toggle("invalid", !valid);
        if (!valid) ok = false;
      });
      return ok;
    }
    form.addEventListener("input", function (e) {
      var t = e.target.type === "checkbox" ? e.target.closest(".consent") : e.target.type === "radio" ? e.target.closest(".choice-group") : e.target;
      if (t && t.classList.contains("invalid")) validate();
    });

    function showSuccess(name) {
      form.classList.add("sent");
      form.innerHTML =
        '<div class="success"><span class="big" aria-hidden="true">💛</span>' +
        "<h3>" + escapeHtml(form.getAttribute("data-success-title") || "Danke, " + name.split(" ")[0] + "!") + "</h3>" +
        "<p>" + escapeHtml(form.getAttribute("data-success")) + "</p>" +
        '<p class="muted">' + T.insta + ' <a href="https://www.instagram.com/medipatenwitten.herdecke/" target="_blank" rel="noopener">@medipatenwitten.herdecke</a></p></div>';
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.elements._gotcha.value) return; // Bot
      if (!validate()) {
        setStatus(T.required, "err");
        var first = form.querySelector(".invalid");
        if (first) (first.querySelector("input") || first).focus();
        return;
      }

      var data = { anliegen: form.getAttribute("data-topic") };
      Array.prototype.forEach.call(form.elements, function (el) {
        if (!el.name || el.name === "_gotcha" || el.name === "datenschutz") return;
        if ((el.type === "radio" || el.type === "checkbox") && !el.checked) return;
        data[el.name] = el.value.trim();
      });
      data.datenschutz = "zugestimmt";
      data._subject = form.getAttribute("data-subject") + ": " + data.name;
      data._replyto = data.email;
      // Zusatzoptionen, die nur FormSubmit versteht
      if (/formsubmit\.co/.test(cfg.FORM_ENDPOINT || "")) {
        data._template = "table";
        data._captcha = "false";
      }

      if (!cfg.FORM_ENDPOINT) {
        if (cfg.CONTACT_EMAIL) {
          var body = Object.keys(LABELS).filter(function (k) { return data[k]; })
            .map(function (k) { return LABELS[k] + ": " + data[k]; }).join("\n");
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
        if (res.ok) return showSuccess(data.name);
        // Formspree antwortet mit einer Begründung, z. B. bei abgelehnten Absendern
        return res.json().catch(function () { return {}; }).then(function (j) {
          var why = (j.errors || []).map(function (x) { return x.message; }).join(" ") || j.error || ("Fehlercode " + res.status);
          var err = new Error(why); err.fromServer = true; throw err;
        });
      }).catch(function (err) {
        btn.disabled = false;
        btn.textContent = form.getAttribute("data-button");
        if (err && err.fromServer) {
          setStatus(T.failed + err.message, "err");
        } else {
          // Keine Antwort: Verbindung blockiert (z. B. Vorschau im Claude-Chat) oder offline
          setStatus(T.offline, "err");
        }
      });
    });
  }
  document.querySelectorAll(".contact-form").forEach(setupForm);
})();
