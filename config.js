/* =========================================================
   MEDIPATEN – Einstellungen für das Anmeldeformular
   ---------------------------------------------------------
   Damit ihr bei jeder Anmeldung automatisch eine E-Mail bekommt,
   tragt hier EINE der beiden Varianten ein (Details in README.md):

   A) Formspree (empfohlen):  "https://formspree.io/f/DEINE_FORM_ID"
   B) FormSubmit (ohne Konto): "https://formsubmit.co/ajax/eure@email.de"

   CONTACT_EMAIL wird nur als Rückfall genutzt, falls FORM_ENDPOINT
   leer ist: Dann öffnet sich das E-Mail-Programm der Besucher:innen
   mit einer vorausgefüllten Nachricht.
   ========================================================= */
window.MEDIPATEN_CONFIG = {
  FORM_ENDPOINT: "",
  CONTACT_EMAIL: ""
};
