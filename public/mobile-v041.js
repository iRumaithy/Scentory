(() => {
  const VERSION = '0.5.0';
  const REMOTE_PREFIX = 'api-';
  let liveTimer = null;
  let liveAbort = null;
  let lastRemoteQuery = '';

  function patchCatalogImages() {
    if (typeof PERFUMES === 'undefined' || !Array.isArray(PERFUMES)) return;

    const layton = PERFUMES.find(p => p.id === 'layton');
    if (layton) {
      layton.image = 'assets/perfumes/layton.webp';
      layton.imageApproved = true;
    }

    PERFUMES.forEach(p => {
      if (!p.image) p.image = 'assets/bottle-placeholder.svg';
    });
  }

  function protectImages() {
    document.querySelectorAll('.card-image img,.detail-product img,.similar-card img,.banner-bottles img').forEach(img => {
      img.decoding = 'async';
      img.loading = img.closest('.detail-product') ? 'eager' : 'lazy';
      if (img.dataset.scentoryProtected === '1') return;
      img.dataset.scentoryProtected = '1';
      img.addEventListener('error', () => {
        if (!img.dataset.fallbackDone) {
          img.dataset.fallbackDone = '1';
          img.src = 'assets/bottle-placeholder.svg';
        }
      });
    });
  }

  function protectNotes() {
    document.querySelectorAll('.note-thumb img').forEach(img => {
      img.decoding = 'async';
      img.loading = 'lazy';
      if (img.dataset.scentoryNoteProtected === '1') return;
      img.dataset.scentoryNoteProtected = '1';
      img.addEventListener('error', () => {
        const fallback = img.dataset.fallback || 'assets/notes/resin.jpg';
        if (img.src !== fallback) img.src = fallback;
      });
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

  function ensureLiveUi() {
    if (document.getElementById('liveCatalogStyle')) return;

    const style = document.createElement('style');
    style.id = 'liveCatalogStyle';
    style.textContent = `
      .live-catalog-status{
        display:none;align-items:center;gap:7px;
        margin:-4px 2px 12px;color:#87939b;font-size:10px
      }
      .live-catalog-status.show{display:flex}
      .live-catalog-status .dot{
        width:7px;height:7px;border-radius:50%;background:#d7b36b;
        box-shadow:0 0 0 4px rgba(215,179,107,.10)
      }
      .live-catalog-status.loading .dot{animation:scentoryPulse 1s infinite alternate}
      .live-catalog-status.error .dot{background:#d46a6a}
      .live-provider-badge{
        position:absolute;right:10px;top:10px;
        font-size:8px;letter-spacing:.6px;color:#d9ba7a;
        background:rgba(9,14,18,.82);border:1px solid rgba(215,179,107,.22);
        border-radius:999px;padding:4px 7px;z-index:2
      }
      @keyframes scentoryPulse{to{opacity:.35;transform:scale(.8)}}
      @media(max-width:820px){
        .live-catalog-status{font-size:9px;margin:0 2px 10px}
      }
    `;
    document.head.appendChild(style);

    const row = document.getElementById('filterRow');
    if (row) {
      const status = document.createElement('div');
      status.id = 'liveCatalogStatus';
      status.className = 'live-catalog-status';
      status.innerHTML = '<span class="dot"></span><span class="text"></span>';
      row.insertAdjacentElement('afterend', status);
    }
  }

  function setLiveStatus(message = '', mode = '') {
    const el = document.getElementById('liveCatalogStatus');
    if (!el) return;
    el.className = `live-catalog-status ${message ? 'show' : ''} ${mode}`.trim();
    const t = el.querySelector('.text');
    if (t) t.textContent = message;
  }

  function removeRemotePerfumes() {
    if (typeof PERFUMES === 'undefined') return;
    for (let i = PERFUMES.length - 1; i >= 0; i--) {
      if (String(PERFUMES[i]?.id || '').startsWith(REMOTE_PREFIX)) PERFUMES.splice(i, 1);
    }
  }

  function mergeRemotePerfumes(items) {
    if (typeof PERFUMES === 'undefined' || !Array.isArray(items)) return 0;
    removeRemotePerfumes();

    const localKeys = new Set(
      PERFUMES.map(p => `${String(p.brand || '').toLowerCase()}|${String(p.name || '').toLowerCase()}`)
    );

    let added = 0;
    for (const item of items) {
      const key = `${String(item.brand || '').toLowerCase()}|${String(item.name || '').toLowerCase()}`;
      if (localKeys.has(key)) continue;
      item.similar = Array.isArray(item.similar) ? item.similar : [];
      item.accords = item.accords && typeof item.accords === 'object' ? item.accords : {};
      item.notes = item.notes || { top: [], middle: [], base: [] };
      item.tags = Array.isArray(item.tags) ? item.tags : [];
      PERFUMES.push(item);
      added++;
    }
    return added;
  }

  function markRemoteCards() {
    document.querySelectorAll('.perfume-card[data-open]').forEach(card => {
      if (!String(card.dataset.open || '').startsWith(REMOTE_PREFIX)) return;
      if (card.querySelector('.live-provider-badge')) return;
      const badge = document.createElement('span');
      badge.className = 'live-provider-badge';
      badge.textContent = 'LIVE • EXPERIMENTAL';
      card.appendChild(badge);
    });
  }

  async function runLiveSearch(query) {
    if (query.length < 3) {
      lastRemoteQuery = '';
      removeRemotePerfumes();
      setLiveStatus('');
      if (typeof renderDiscover === 'function') renderDiscover();
      return;
    }

    if (query === lastRemoteQuery) return;
    lastRemoteQuery = query;

    if (liveAbort) liveAbort.abort();
    liveAbort = new AbortController();

    setLiveStatus('جاري توسيع البحث خارج الكتالوج المحلي…', 'loading');

    try {
      const response = await fetch(`/api/catalog/search?q=${encodeURIComponent(query)}&limit=24`, {
        signal: liveAbort.signal,
        headers: { 'Accept': 'application/json' },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || `HTTP_${response.status}`);

      const added = mergeRemotePerfumes(data.items || []);
      if (typeof renderDiscover === 'function') renderDiscover();

      if (added) {
        setLiveStatus(
          `${added} نتيجة إضافية من مصدر تجريبي${data.cached ? ' • من الذاكرة المؤقتة' : ''}${data.stale ? ' • نسخة محفوظة' : ''}`
        );
      } else {
        setLiveStatus('لا توجد نتائج إضافية خارج الكتالوج المحلي');
      }

      setTimeout(markRemoteCards, 0);
    } catch (err) {
      if (err?.name === 'AbortError') return;
      removeRemotePerfumes();
      if (typeof renderDiscover === 'function') renderDiscover();
      setLiveStatus('تعذر الوصول إلى البحث الموسّع الآن — النتائج المحلية ما زالت تعمل', 'error');
    }
  }

  function setupLiveSearch() {
    const input = document.getElementById('searchInput');
    if (!input) return;

    input.addEventListener('input', () => {
      clearTimeout(liveTimer);
      const q = input.value.trim();
      liveTimer = setTimeout(() => runLiveSearch(q), 550);
    });

    const clear = document.getElementById('clearSearch');
    clear?.addEventListener('click', () => {
      lastRemoteQuery = '';
      if (liveAbort) liveAbort.abort();
      removeRemotePerfumes();
      setLiveStatus('');
      if (typeof renderDiscover === 'function') renderDiscover();
    });
  }

  function reapply() {
    protectImages();
    protectNotes();
    ensureVersion();
    markRemoteCards();
  }

  document.addEventListener('DOMContentLoaded', () => {
    patchCatalogImages();
    ensureVersion();
    ensureLiveUi();
    setupLiveSearch();

    if (typeof renderAll === 'function') {
      try { renderAll(); } catch (_) {}
    }
    reapply();

    const obs = new MutationObserver(() => reapply());
    obs.observe(document.body, { childList:true, subtree:true });
  });
})();
