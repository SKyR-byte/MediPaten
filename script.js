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
    }, { threshold: 0, rootMargin: "0px 0px -6% 0px" });
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

  /* ---------- Kontaktformular: Absenden (mit Steckbrief in Schritten) ---------- */
  var cfg = window.MEDIPATEN_CONFIG || {};

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  // Ist ein Element gerade sichtbar (nicht in einem versteckten Schritt/Bereich)?
  function shown(el) { return !el.closest("[hidden]"); }
  function labelText(el) {
    var t = "";
    if (el.getAttribute("data-label")) return el.getAttribute("data-label");
    if (el.labels && el.labels[0]) t = el.labels[0].textContent;
    else if (el.getAttribute("aria-label")) t = el.getAttribute("aria-label");
    return t.replace(/\(freiwillig[^)]*\)|\(mehrere möglich\)|\*/g, "").replace(/\s+/g, " ").trim();
  }
  function legendText(fs) {
    var l = fs.querySelector("legend");
    return l ? l.textContent.replace(/\(freiwillig[^)]*\)|\(mehrere möglich\)|\*/g, "").replace(/\s+/g, " ").trim() : "";
  }

  function setupForm(form) {
    var status = form.querySelector(".form-status");
    var formal = form.hasAttribute("data-formal"); // Eltern werden gesiezt, Studierende geduzt
    var T = formal ? {
      missing: "Bitte ergänzen Sie noch: ",
      insta: "Bei Fragen erreichen Sie uns auch auf Instagram –",
      failed: "Formspree hat die Nachricht abgelehnt: ",
      offline: "Die Nachricht konnte nicht gesendet werden, weil keine Verbindung zu Formspree möglich war. In Vorschauen (z. B. im Claude-Chat) ist das blockiert – auf der veröffentlichten Website funktioniert es. Sonst prüfen Sie bitte Ihre Internetverbindung oder schreiben Sie uns über Instagram."
    } : {
      missing: "Bitte ergänze noch: ",
      insta: "Bis dahin: Schau gern auf unserem Instagram-Profil vorbei –",
      failed: "Formspree hat die Nachricht abgelehnt: ",
      offline: "Die Nachricht konnte nicht gesendet werden, weil keine Verbindung zu Formspree möglich war. In Vorschauen (z. B. im Claude-Chat) ist das blockiert – auf der veröffentlichten Website funktioniert es. Sonst bitte Internetverbindung prüfen oder uns über Instagram schreiben."
    };
    function setStatus(msg, type) {
      status.textContent = msg;
      status.className = "form-status" + (type ? " " + type : "");
    }

    /* ---- Prüfen: liefert die Namen der fehlenden Angaben im Bereich ---- */
    function check(scope, mark) {
      var missing = [], firstBad = null;
      function bad(target, name, focusEl) {
        if (mark) target.classList.add("invalid");
        if (missing.indexOf(name) < 0) missing.push(name);
        if (!firstBad) firstBad = focusEl || target;
      }
      function good(target) { if (mark) target.classList.remove("invalid"); }
      // Textfelder, Auswahllisten, Zahlen, E-Mail
      scope.querySelectorAll("input[required]:not([type=checkbox]):not([type=radio]), select[required], textarea[required]").forEach(function (f) {
        if (!shown(f)) return;
        if (f.value.trim() === "" || !f.checkValidity()) bad(f, labelText(f), f); else good(f);
      });
      // Auswahlknöpfe (genau eine Antwort)
      var seen = {};
      scope.querySelectorAll("input[type=radio][required]").forEach(function (r) {
        if (!shown(r) || seen[r.name]) return; seen[r.name] = 1;
        var group = r.closest(".choice-group");
        if (!form.querySelector('input[name="' + r.name + '"]:checked')) bad(group, legendText(group), r); else good(group);
      });
      // Ankreuzfelder mit Mindestanzahl
      scope.querySelectorAll(".choice-group[data-min]").forEach(function (g) {
        if (!shown(g)) return;
        var n = g.querySelectorAll("input[type=checkbox]:checked").length;
        if (n < +g.getAttribute("data-min")) bad(g, legendText(g), g.querySelector("input")); else good(g);
      });
      // Einzelne Pflicht-Häkchen (Bestätigungen, Einwilligungen)
      scope.querySelectorAll("input[type=checkbox][required]").forEach(function (c) {
        if (!shown(c)) return;
        var box = c.closest(".consent") || c.parentNode;
        var grp = c.closest(".confirm-group");
        var name = grp ? legendText(grp) : c.name === "datenschutz" ? "Einverständnis zum Datenschutz" : /^Einwilligung/.test(c.name) ? "Einwilligung zu den Angaben über Ihr Kind" : "Bestätigung";
        if (!c.checked) bad(box, name, c); else good(box);
      });
      return { ok: missing.length === 0, missing: missing, first: firstBad };
    }
    function report(res) {
      setStatus(T.missing + res.missing.join(" · "), "err");
      if (res.first) {
        res.first.scrollIntoView({ behavior: "smooth", block: "center" });
        try { res.first.focus({ preventScroll: true }); } catch (e) { res.first.focus(); }
      }
    }
    // Fehler-Markierung verschwindet, sobald das Feld korrigiert ist
    function fixed(t) {
      if (t.matches("input, select, textarea")) return t.value.trim() !== "" && t.checkValidity();
      if (t.hasAttribute("data-min")) return t.querySelectorAll("input[type=checkbox]:checked").length >= +t.getAttribute("data-min");
      if (t.classList.contains("choice-group")) return !!t.querySelector("input[type=radio]:checked");
      var c = t.querySelector("input[type=checkbox]");
      return c ? c.checked : true;
    }
    function onFix(e) {
      var t = e.target.classList.contains("invalid") ? e.target : e.target.closest(".invalid");
      if (t && fixed(t)) t.classList.remove("invalid");
      if (!form.querySelector(".invalid")) setStatus("");
    }
    form.addEventListener("input", onFix);
    form.addEventListener("change", onFix);

    /* ---- Schritte ---- */
    var steps = Array.prototype.slice.call(form.querySelectorAll(".wz-step"));
    var idx = 0;
    var progress = form.querySelector(".wizard-progress");
    var back = form.querySelector(".step-back"), next = form.querySelector(".step-next"), submit = form.querySelector('button[type="submit"]');
    var infoOnly = form.querySelector(".info-only");
    function infoMode() {
      var r = form.querySelector('input[name="interesse"]:checked');
      return !!(r && /Informationen/.test(r.value));
    }
    function render() {
      if (!steps.length) return;
      var info = infoMode() && idx === 0;
      steps.forEach(function (st, k) { st.hidden = k !== idx; });
      if (infoOnly) infoOnly.hidden = !info;
      var last = idx === steps.length - 1;
      back.hidden = idx === 0;
      next.hidden = last || info;
      submit.hidden = !(last || info);
      next.textContent = idx === 0 ? (form.getAttribute("data-first-next") || "Weiter") : "Weiter";
      submit.textContent = info ? form.getAttribute("data-button-info") : form.getAttribute("data-button");
      var total = info ? 1 : steps.length;
      progress.querySelector(".wizard-bar span").style.width = (info ? 100 : Math.round((idx + 1) / steps.length * 100)) + "%";
      progress.querySelector(".wizard-label").textContent = "Schritt " + (idx + 1) + " von " + total + " · " + steps[idx].getAttribute("data-step-title");
    }
    function goTo(k) {
      idx = k; render(); setStatus("");
      var card = form.closest(".contact-card") || form;
      var top = card.getBoundingClientRect().top + window.scrollY - 90;
      if (window.scrollY > top) window.scrollTo({ top: top, behavior: "smooth" });
    }
    if (steps.length) {
      next.addEventListener("click", function () {
        var res = check(steps[idx], true);
        if (!res.ok) return report(res);
        goTo(idx + 1);
      });
      back.addEventListener("click", function () { goTo(idx - 1); });
      form.addEventListener("change", function (e) { if (e.target.name === "interesse") render(); });
      render();
    }

    function showSuccess(name) {
      var card = form.closest(".contact-card") || form;
      form.classList.add("sent");
      form.innerHTML =
        '<div class="success"><span class="big" aria-hidden="true">💛</span>' +
        "<h3>" + escapeHtml(form.getAttribute("data-success-title") || "Danke, " + String(name).split(" ")[0] + "!") + "</h3>" +
        "<p>" + escapeHtml(form.getAttribute("data-success")) + "</p>" +
        '<p class="muted">' + T.insta + ' <a href="https://www.instagram.com/medipatenwitten.herdecke/" target="_blank" rel="noopener">@medipatenwitten.herdecke</a></p></div>';
      var top = card.getBoundingClientRect().top + window.scrollY - 90;
      if (window.scrollY > top) window.scrollTo({ top: top, behavior: "smooth" });
    }

    /* ---- Daten einsammeln ---- */
    function collect(info) {
      var scopes = steps.length ? (info ? [steps[0]] : steps) : [form];
      var data = { anliegen: info ? form.getAttribute("data-topic-info") : form.getAttribute("data-topic") };
      scopes.forEach(function (sc) {
        sc.querySelectorAll("input, select, textarea").forEach(function (el) {
          if (!el.name || el.name === "_gotcha") return;
          if (el.closest(".info-only") && !info) return;
          if (el.type === "radio" && !el.checked) return;
          if (el.type === "checkbox") {
            if (!el.checked) return;
            if (el.name === "datenschutz") { data.datenschutz = "zugestimmt"; return; }
            data[el.name] = data[el.name] ? data[el.name] + ", " + el.value : el.value;
            return;
          }
          var v = el.value.trim();
          if (v !== "") data[el.name] = v;
        });
      });
      if (steps.length) data["Datum"] = new Date().toLocaleDateString("de-DE");
      data._subject = (info ? form.getAttribute("data-subject-info") : form.getAttribute("data-subject")) + ": " + data.name;
      data._replyto = data.email;
      if (/formsubmit\.co/.test(cfg.FORM_ENDPOINT || "")) { data._template = "table"; data._captcha = "false"; }
      return data;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.elements._gotcha.value) return; // Bot
      var info = steps.length && infoMode() && idx === 0;
      if (steps.length && !info && idx !== steps.length - 1) return; // Enter-Taste mitten im Steckbrief
      var res = check(steps.length ? steps[idx] : form, true);
      if (!res.ok) return report(res);
      var data = collect(info);

      if (!cfg.FORM_ENDPOINT) {
        setStatus("Das Formular ist noch nicht eingerichtet. Bitte schreib uns vorerst über Instagram.", "err");
        return;
      }
      submit.disabled = true;
      submit.textContent = "Wird gesendet …";
      setStatus("");

      // Als Datei geöffnet (file://): Der Browser blockiert hier die Antwort von Formspree (CORS).
      // Deshalb die Nachricht als klassisches Formular in einen unsichtbaren Rahmen schicken.
      if (location.protocol === "file:") {
        var frameName = "fs-" + Date.now();
        var frame = document.createElement("iframe");
        frame.name = frameName; frame.hidden = true; frame.setAttribute("aria-hidden", "true");
        var direct = document.createElement("form");
        direct.method = "POST"; direct.action = cfg.FORM_ENDPOINT; direct.target = frameName; direct.hidden = true;
        Object.keys(data).forEach(function (k) {
          var input = document.createElement("input"); input.type = "hidden"; input.name = k; input.value = data[k]; direct.appendChild(input);
        });
        var done = false;
        var finish = function () {
          if (done) return; done = true;
          showSuccess(data.name);
          setTimeout(function () { frame.remove(); direct.remove(); }, 1000);
        };
        frame.addEventListener("load", finish);
        setTimeout(finish, 6000);
        document.body.appendChild(frame); document.body.appendChild(direct);
        direct.submit();
        return;
      }

      // FormData statt JSON: so empfiehlt es Formspree, und der Browser braucht keine Vorab-Anfrage
      var body = new FormData();
      Object.keys(data).forEach(function (k) { body.append(k, data[k]); });
      fetch(cfg.FORM_ENDPOINT, { method: "POST", headers: { Accept: "application/json" }, body: body })
        .then(function (r) {
          if (r.ok) return showSuccess(data.name);
          return r.json().catch(function () { return {}; }).then(function (j) {
            var why = (j.errors || []).map(function (x) { return x.message; }).join(" ") || j.error || ("Fehlercode " + r.status);
            var err = new Error(why); err.fromServer = true; throw err;
          });
        })
        .catch(function (err) {
          submit.disabled = false;
          render();
          if (!steps.length) submit.textContent = form.getAttribute("data-button");
          setStatus(err && err.fromServer ? T.failed + err.message : T.offline, "err");
        });
    });
  }
  document.querySelectorAll(".contact-form").forEach(setupForm);
})();
