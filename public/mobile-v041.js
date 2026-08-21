(() => {
  const VERSION = '0.5.1';
  const REMOTE_PREFIX = 'api-';
  let liveTimer = null;
  let liveAbort = null;
  let lastRemoteQuery = '';

  function patchCatalogImages() {
    if (typeof PERFUMES === 'undefined' || !Array.isArray(PERFUMES)) return;

    // Restore a complete Layton bottle image.
    const layton = PERFUMES.find(p => p.id === 'layton');
    if (layton) {
      layton.image = 'assets/perfumes/layton.webp';
      layton.imageApproved = true;
    }

    for (const p of PERFUMES) {
      if (!p.image) p.image = 'assets/bottle-placeholder.svg';
      if (!Array.isArray(p.similar)) p.similar = [];
      if (!p.notes || typeof p.notes !== 'object') p.notes = { top: [], middle: [], base: [] };
      p.notes.top = Array.isArray(p.notes.top) ? p.notes.top : [];
      p.notes.middle = Array.isArray(p.notes.middle) ? p.notes.middle : [];
      p.notes.base = Array.isArray(p.notes.base) ? p.notes.base : [];
      p.accords = p.accords && typeof p.accords === 'object' ? p.accords : {};
      p.tags = Array.isArray(p.tags) ? p.tags : [];
    }
  }

  function ensureVersion() {
    let footer = document.getElementById('appVersionFooter');
    if (!footer) {
      footer = document.createElement('footer');
      footer.id = 'appVersionFooter';
      footer.className = 'app-version-footer';
      document.querySelector('.workspace')?.appendChild(footer);
    }
    const value = `SCENTORY • v${VERSION}`;
    if (footer && footer.textContent !== value) footer.textContent = value;
  }

  function ensureLiveUi() {
    if (!document.getElementById('liveCatalogStyle')) {
      const style = document.createElement('style');
      style.id = 'liveCatalogStyle';
      style.textContent = `
        .live-catalog-status{display:none;align-items:center;gap:7px;margin:-4px 2px 12px;color:#87939b;font-size:10px}
        .live-catalog-status.show{display:flex}
        .live-catalog-status .dot{width:7px;height:7px;border-radius:50%;background:#d7b36b;box-shadow:0 0 0 4px rgba(215,179,107,.10)}
        .live-catalog-status.loading .dot{animation:scentoryPulse 1s infinite alternate}
        .live-catalog-status.error .dot{background:#d46a6a}
        .live-provider-badge{position:absolute;right:10px;top:10px;font-size:8px;letter-spacing:.5px;color:#d9ba7a;background:rgba(9,14,18,.86);border:1px solid rgba(215,179,107,.22);border-radius:999px;padding:4px 7px;z-index:2}
        @keyframes scentoryPulse{to{opacity:.35;transform:scale(.8)}}
        @media(max-width:820px){.live-catalog-status{font-size:9px;margin:0 2px 10px}}
      `;
      document.head.appendChild(style);
    }

    if (!document.getElementById('liveCatalogStatus')) {
      const row = document.getElementById('filterRow');
      if (row) {
        const status = document.createElement('div');
        status.id = 'liveCatalogStatus';
        status.className = 'live-catalog-status';
        status.innerHTML = '<span class="dot"></span><span class="text"></span>';
        row.insertAdjacentElement('afterend', status);
      }
    }
  }

  function setLiveStatus(message = '', mode = '') {
    const el = document.getElementById('liveCatalogStatus');
    if (!el) return;
    el.className = `live-catalog-status ${message ? 'show' : ''} ${mode}`.trim();
    const t = el.querySelector('.text');
    if (t && t.textContent !== message) t.textContent = message;
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
      item.notes.top = Array.isArray(item.notes.top) ? item.notes.top : [];
      item.notes.middle = Array.isArray(item.notes.middle) ? item.notes.middle : [];
      item.notes.base = Array.isArray(item.notes.base) ? item.notes.base : [];
      item.tags = Array.isArray(item.tags) ? item.tags : [];
      item.image = item.image || 'assets/bottle-placeholder.svg';

      PERFUMES.push(item);
      localKeys.add(key);
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

  function safeRenderDiscover() {
    try {
      if (typeof renderDiscover === 'function') renderDiscover();
      requestAnimationFrame(markRemoteCards);
    } catch (err) {
      console.error('Scentory render error:', err);
    }
  }

  async function runLiveSearch(query) {
    if (query.length < 3) {
      lastRemoteQuery = '';
      removeRemotePerfumes();
      setLiveStatus('');
      safeRenderDiscover();
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
        headers: { Accept: 'application/json' },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || `HTTP_${response.status}`);

      const added = mergeRemotePerfumes(data.items || []);
      safeRenderDiscover();

      if (added) {
        setLiveStatus(`${added} نتيجة إضافية من المصدر التجريبي${data.cached ? ' • cached' : ''}${data.stale ? ' • stale' : ''}`);
      } else {
        setLiveStatus('لا توجد نتائج إضافية خارج الكتالوج المحلي');
      }
    } catch (err) {
      if (err?.name === 'AbortError') return;
      removeRemotePerfumes();
      safeRenderDiscover();
      setLiveStatus('تعذر الوصول إلى البحث الموسّع الآن — الكتالوج المحلي ما زال يعمل', 'error');
    }
  }

  function setupLiveSearch() {
    const input = document.getElementById('searchInput');
    if (!input || input.dataset.liveSearchBound === '1') return;
    input.dataset.liveSearchBound = '1';

    input.addEventListener('input', () => {
      clearTimeout(liveTimer);
      const q = input.value.trim();
      liveTimer = setTimeout(() => runLiveSearch(q), 600);
    });

    document.getElementById('clearSearch')?.addEventListener('click', () => {
      lastRemoteQuery = '';
      liveAbort?.abort();
      removeRemotePerfumes();
      setLiveStatus('');
      safeRenderDiscover();
    });
  }

  // Global image fallback without a MutationObserver.
  document.addEventListener('error', event => {
    const img = event.target;
    if (!(img instanceof HTMLImageElement)) return;

    if (img.closest('.note-thumb')) {
      const fallback = img.dataset.fallback || 'assets/notes/resin.jpg';
      if (!img.dataset.noteFallbackDone) {
        img.dataset.noteFallbackDone = '1';
        img.src = fallback;
      }
      return;
    }

    if (img.matches('.card-image img,.detail-product img,.similar-card img,.banner-bottles img')) {
      if (!img.dataset.fallbackDone) {
        img.dataset.fallbackDone = '1';
        img.src = 'assets/bottle-placeholder.svg';
      }
    }
  }, true);

  document.addEventListener('DOMContentLoaded', () => {
    patchCatalogImages();
    ensureLiveUi();
    setupLiveSearch();
    ensureVersion();

    // catalog-extra.js has already loaded by DOMContentLoaded; render all 50 now.
    try {
      if (typeof renderAll === 'function') renderAll();
    } catch (err) {
      console.error('Scentory initial render error:', err);
      try {
        if (typeof renderDiscover === 'function') renderDiscover();
      } catch {}
    }

    requestAnimationFrame(() => {
      ensureVersion();
      markRemoteCards();
    });
  });
})();
