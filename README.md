# MEDIPATEN – Website

Informations-Website für das Charity-Projekt **MEDIPATEN** (Universität Witten/Herdecke · Gemeinschaftskrankenhaus Herdecke, unterstützt von der Children Cancer Foundation).

Reine statische Seite (HTML/CSS/JS) – kein Build-Schritt nötig.

```
index.html          Startseite (alle Abschnitte)
styles.css          Design (Farben/Schriften aus Logo & Instagram-Slides)
script.js           Animationen, Mobile-Menü, Formular
config.js           ← Formular-Empfänger hier eintragen
impressum.html      Platzhalter – bitte ausfüllen
datenschutz.html    Platzhalter – bitte ausfüllen
assets/img/         Logos & Otter-Maskottchen
```

## Lokal ansehen

`index.html` im Browser öffnen – oder `python3 -m http.server` und `http://localhost:8000` aufrufen.

## Anmeldeformular → automatische E-Mail

**Status:** eingerichtet mit Formspree (`https://formspree.io/f/xkjoogbb`, siehe `config.js`). Empfänger-Adressen werden im Formspree-Konto verwaltet.

Die Seite ist statisch, deshalb übernimmt ein kostenloser Formular-Dienst den Mailversand. Trage in `config.js` bei `FORM_ENDPOINT` eine der beiden Varianten ein:

**A) Formspree (empfohlen)**
1. Auf <https://formspree.io> kostenlos registrieren (mit der Projekt-Mailadresse).
2. „New Form“ anlegen → ihr bekommt eine Adresse wie `https://formspree.io/f/abcdwxyz`.
3. Diese in `config.js` eintragen: `FORM_ENDPOINT: "https://formspree.io/f/abcdwxyz"`.

**B) FormSubmit (ohne Konto)**
1. `FORM_ENDPOINT: "https://formsubmit.co/ajax/eure@email.de"` eintragen.
2. Einmal das Formular selbst absenden → FormSubmit schickt eine Bestätigungsmail, Link anklicken. Ab dann kommt jede Anmeldung per Mail.

Das Kontaktformular hat drei Reiter, alle schicken an dieselbe Formspree-Adresse:

- **Pat:in werden** – Betreff „Neue MEDIPATEN-Anmeldung: Name“; enthält Name, E-Mail, Fachsemester, Studiengang, optionale Nachricht.
- **Mitwirken** (auch ohne Medizinstudium) – Betreff „Neue Anfrage zum Mitwirken bei MEDIPATEN: Name“; enthält Name, E-Mail, Studiengang/Beruf, optional Bereich, Ideen.
- **Dein Standort fehlt?** – Betreff „Idee für einen neuen MEDIPATEN-Standort: Name“; enthält Name, E-Mail, Stadt, optional Uni/Klinik, Ideen und Anregungen.

Das Feld „anliegen“ in jeder Mail zeigt, aus welchem Reiter sie kommt.

## Weitere Social-Media-Plattformen

Im Abschnitt „Socials“ in `index.html` steht eine auskommentierte Vorlage für LinkedIn. Kommentarzeichen entfernen, Profil-Link eintragen und die Karte in das `<div class="social-grid">` verschieben – fertig. Weitere Plattformen nach demselben Muster.

## Veröffentlichen

Z. B. kostenlos mit **GitHub Pages** (Repository → Settings → Pages → Branch wählen), Netlify oder Cloudflare Pages.

## Vor dem Livegang

- `impressum.html` und `datenschutz.html` ausfüllen (in Deutschland Pflicht).
