(() => {
  'use strict';
  const canonical = 'https://ggarofalo-dev.github.io/truffe-digitali/';
  const title = 'Truffe Digitali | 10 regole per riconoscerle e proteggersi';
  const message = 'Dieci regole pratiche per riconoscere le truffe digitali e proteggere te stesso e i tuoi familiari. Un documento da leggere, stampare e condividere.';
  const params = new URLSearchParams(location.search);
  const campaign = new URLSearchParams();
  // Only campaign labels: never forward arbitrary query parameters or identifiers.
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(key => {
    const value = params.get(key);
    if (value) campaign.set(key, value.slice(0, 80).replace(/[^\p{L}\p{N} _.-]/gu, ''));
  });
  let referrer = '';
  if (campaign.size) referrer = `campaign:${campaign.toString()}`;
  else if (document.referrer) {
    try { referrer = new URL(document.referrer).origin; } catch { /* No referrer. */ }
  }
  const pending = [];
  function track(name) {
    const event = { path: name, title: name, event: true, no_session: true, referrer };
    if (typeof window.goatcounter?.count === 'function') window.goatcounter.count(event);
    else if (pending.length < 30) pending.push(event);
  }
  // Reuse the site's existing GoatCounter account. No cookies or local counters.
  window.goatcounter = { no_onload: true };
  const analytics = document.createElement('script');
  analytics.src = 'https://gc.zgo.at/count.js';
  analytics.async = true;
  analytics.dataset.goatcounter = 'https://ggarofalo.goatcounter.com/count';
  analytics.addEventListener('load', () => {
    if (typeof window.goatcounter?.count !== 'function') return;
    window.goatcounter.count({ path: '/truffe-digitali/', title: document.title, referrer });
    track('guide_page_view');
    pending.splice(0).forEach(event => window.goatcounter.count(event));
  });
  document.head.append(analytics);
  document.querySelectorAll('[data-event]').forEach(link => {
    link.addEventListener('click', () => track(link.dataset.event));
  });
  const encodedURL = encodeURIComponent(canonical);
  const encodedText = encodeURIComponent(message);
  const shares = {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${message}\n${canonical}`)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedURL}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedURL}`,
    telegram: `https://t.me/share/url?url=${encodedURL}&text=${encodedText}`,
    x: `https://twitter.com/intent/tweet?url=${encodedURL}&text=${encodedText}`,
    email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${message}\n\n${canonical}`)}`
  };
  document.querySelectorAll('[data-share]').forEach(link => { link.href = shares[link.dataset.share]; });
  const status = document.getElementById('share-status');
  document.getElementById('copy-link').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(canonical);
      document.getElementById('copy-manual').hidden = true;
      status.textContent = 'Link copiato. Ora puoi incollarlo dove preferisci.';
      const button = document.getElementById('copy-link');
      button.dataset.copied = 'true';
      button.title = 'Link copiato';
      track('copy_link');
    } catch {
      const button = document.getElementById('copy-link');
      delete button.dataset.copied;
      button.title = 'Copia link';
      const fallback = document.getElementById('copy-fallback');
      document.getElementById('copy-manual').hidden = false;
      fallback.focus();
      fallback.select();
      status.textContent = 'La copia automatica non è disponibile. Copia il link selezionato.';
    }
  });
  if (typeof navigator.share === 'function') {
    const button = document.getElementById('native-share');
    button.hidden = false;
    button.addEventListener('click', async () => {
      try {
        await navigator.share({ title, text: message, url: canonical });
        track('share_native');
        status.textContent = 'Documento condiviso.';
      } catch (error) {
        if (error.name !== 'AbortError') status.textContent = 'Usa uno dei pulsanti di condivisione disponibili.';
      }
    });
  }
})();
