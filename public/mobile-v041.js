
(() => {
  const VERSION = '0.4.1';

  function patchCatalogImages() {
    if (typeof PERFUMES === 'undefined' || !Array.isArray(PERFUMES)) return;

    /* The processed Layton PNG was visibly missing/cropping the cap.
       Use the original full product asset instead. */
    const layton = PERFUMES.find(p => p.id === 'layton');
    if (layton) {
      layton.image = 'assets/perfumes/layton.webp';
      layton.imageApproved = true;
    }

    /* Never show a broken-image icon. Keep the elegant bottle fallback if
       an image is not yet approved, and tag the card so it can be upgraded later. */
    PERFUMES.forEach(p => {
      if (!p.image) p.image = 'assets/bottle-placeholder.svg';
    });
  }

  function protectImages() {
    document.querySelectorAll('.card-image img,.detail-product img,.similar-card img,.banner-bottles img').forEach(img => {
      img.decoding = 'async';
      img.loading = img.closest('.detail-product') ? 'eager' : 'lazy';
      img.addEventListener('error', () => {
        if (!img.dataset.fallbackDone) {
          img.dataset.fallbackDone = '1';
          img.src = 'assets/bottle-placeholder.svg';
        }
      }, { once: true });
    });
  }

  function protectNotes() {
    document.querySelectorAll('.note-thumb img').forEach(img => {
      img.decoding = 'async';
      img.loading = 'lazy';
      img.addEventListener('error', () => {
        const fallback = img.dataset.fallback || 'assets/notes/resin.jpg';
        if (img.src !== fallback) img.src = fallback;
      }, { once: true });
    });
  }

  function ensureVersion() {
    let f = document.getElementById('appVersionFooter');
    if (!f) {
      f = document.createElement('footer');
      f.id = 'appVersionFooter';
      f.className = 'app-version-footer';
      document.querySelector('.workspace')?.appendChild(f);
    }
    if (f) f.textContent = `SCENTORY • v${VERSION}`;
  }

  function reapply() {
    protectImages();
    protectNotes();
    ensureVersion();
  }

  document.addEventListener('DOMContentLoaded', () => {
    patchCatalogImages();
    ensureVersion();

    /* Re-render once after catalog patch so Layton uses the corrected asset. */
    if (typeof renderAll === 'function') {
      try { renderAll(); } catch (_) {}
    }
    reapply();

    const obs = new MutationObserver(() => reapply());
    obs.observe(document.body, { childList:true, subtree:true });
  });
})();
