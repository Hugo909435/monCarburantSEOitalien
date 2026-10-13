// Raccolta del consenso per i cookie di statistica (Google Analytics).
// Caricato da src/components/CookieBanner.astro, solo se SITE.gaId è compilato.
//
// Regole applicate, lette il 13 ottobre 2026 nelle Linee guida cookie del
// Garante (provv. n. 231 del 10 giugno 2021, doc. web 9677876) e nelle FAQ del
// Garante (garanteprivacy.it/faq/cookie):
// - senza consenso non si installa nulla che non sia tecnico: qui Google
//   Analytics non viene nemmeno caricato prima dell'accettazione;
// - chiudere l'avviso con la X lascia le impostazioni predefinite (nessun consenso);
// - l'avviso non viene riproposto prima di 6 mesi;
// - la scelta si può cambiare in ogni momento da un link nel footer;
// - per ricordare la scelta è ammesso uno strumento tecnico, senza consenso.
(function () {
  var GA_ID = document.currentScript && document.currentScript.dataset.ga;
  var banner = document.getElementById('cookie-banner');
  if (!GA_ID || !banner) return;

  var CHIAVE = 'mc-cookie';
  var SEI_MESI = 183 * 24 * 60 * 60 * 1000;
  var caricato = false;

  function leggi() {
    try {
      var s = JSON.parse(localStorage.getItem(CHIAVE));
      if (s && typeof s.statistiche === 'boolean' && Date.now() - s.data < SEI_MESI) return s;
    } catch (e) {}
    return null;
  }

  function salva(statistiche) {
    try {
      localStorage.setItem(CHIAVE, JSON.stringify({ statistiche: statistiche, data: Date.now() }));
    } catch (e) {}
  }

  function caricaAnalytics() {
    window['ga-disable-' + GA_ID] = false;
    if (caricato) return;
    caricato = true;
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    // Solo la misurazione è consentita: tutto ciò che riguarda la pubblicità resta negato.
    gtag('consent', 'default', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'granted',
    });
    gtag('js', new Date());
    gtag('config', GA_ID, { allow_google_signals: false, allow_ad_personalization_signals: false });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
    document.head.appendChild(s);
  }

  function fermaAnalytics() {
    window['ga-disable-' + GA_ID] = true;
    var parti = location.hostname.split('.');
    var domini = [''];
    for (var i = 0; i < parti.length - 1; i++) domini.push('; domain=.' + parti.slice(i).join('.'));
    document.cookie.split(';').forEach(function (c) {
      var nome = c.split('=')[0].trim();
      if (nome.indexOf('_ga') !== 0) return;
      domini.forEach(function (d) {
        document.cookie = nome + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + d;
      });
    });
  }

  function aggiornaStato() {
    var s = leggi();
    var testo = !s ? 'nessuna scelta registrata'
      : s.statistiche ? 'cookie di statistica attivati' : 'cookie di statistica disattivati';
    document.querySelectorAll('[data-cookie-stato]').forEach(function (el) { el.textContent = testo; });
    banner.querySelector('[data-cookie-prima]').hidden = !!s;
    banner.querySelector('[data-cookie-attuale]').hidden = !s;
  }

  function apri(conFocus) {
    aggiornaStato();
    banner.hidden = false;
    if (conFocus) banner.focus();
  }

  function scegli(statistiche) {
    salva(statistiche);
    if (statistiche) caricaAnalytics(); else fermaAnalytics();
    banner.hidden = true;
    aggiornaStato();
  }

  banner.addEventListener('click', function (e) {
    var comando = e.target.closest('[data-cookie]');
    if (!comando) return;
    var azione = comando.dataset.cookie;
    if (azione === 'accetta') scegli(true);
    else if (azione === 'rifiuta') scegli(false);
    // X: alla prima presentazione equivale a nessun consenso; se l'avviso è
    // stato riaperto dal footer, la scelta già registrata resta com'è.
    else if (leggi()) banner.hidden = true;
    else scegli(false);
  });

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-cookie-apri]')) apri(true);
  });

  var scelta = leggi();
  if (scelta && scelta.statistiche) caricaAnalytics();
  aggiornaStato();
  if (!scelta) apri(false);
})();
