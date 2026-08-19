(() => {
  const AUTH = { user: null, cloudAvailable: false, syncing: false };
  const PROFILE_IDS = ['profileButton', 'quickProfile'];

  function esc(value = '') {
    return String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  }

  async function api(path, options = {}) {
    const response = await fetch(`/api${path}`, {
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(payload.error || 'تعذر الاتصال بالخادم');
      error.status = response.status;
      throw error;
    }
    return payload;
  }

  function ensureLocalShape() {
    if (!state.personal || typeof state.personal !== 'object') state.personal = {};
    if (!state.lists) state.lists = { favorite: [], try: [], buy: [], owned: [] };
    for (const key of ['favorite','try','buy','owned']) {
      if (!Array.isArray(state.lists[key])) state.lists[key] = [];
    }
    saveState();
  }

  function buildModal() {
    if (document.getElementById('accountModal')) return;
    const wrap = document.createElement('div');
    wrap.id = 'accountModal';
    wrap.className = 'account-modal';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.innerHTML = `
      <div class="account-backdrop" data-auth-close></div>
      <section class="account-sheet" role="dialog" aria-modal="true" aria-labelledby="accountTitle">
        <button class="account-close" type="button" data-auth-close aria-label="إغلاق">×</button>
        <div class="account-brand"><span>✦</span><div><strong>SCENTORY</strong><small>Cloud Library</small></div></div>
        <div id="accountGuest">
          <div class="account-heading">
            <small>مزامنة مكتبتك</small>
            <h2 id="accountTitle">حساب Scentory</h2>
            <p>سجّل الدخول للوصول إلى مكتبتك نفسها من الهاتف والكمبيوتر.</p>
          </div>
          <div class="auth-tabs">
            <button type="button" class="active" data-auth-mode="login">تسجيل الدخول</button>
            <button type="button" data-auth-mode="register">إنشاء حساب</button>
          </div>
          <form id="accountForm" novalidate>
            <label>اسم المستخدم
              <input id="accountUsername" autocomplete="username" minlength="3" maxlength="40" required placeholder="مثال: Abdullah">
            </label>
            <label>كلمة المرور
              <input id="accountPassword" type="password" autocomplete="current-password" minlength="8" maxlength="128" required placeholder="8 أحرف على الأقل">
            </label>
            <button class="account-submit" id="accountSubmit" type="submit">تسجيل الدخول</button>
            <p class="account-message" id="accountMessage" aria-live="polite"></p>
          </form>
          <div class="account-local-note"><span>⌁</span><p>بدون حساب، يستمر الحفظ محليًا على هذا الجهاز. بعد تسجيل الدخول تتم مزامنة القوائم والتقييمات تلقائيًا.</p></div>
        </div>
        <div id="accountLogged" class="hidden">
          <div class="account-heading">
            <small>متصل بالسحابة</small>
            <h2>مرحبًا، <span id="accountLoggedName"></span></h2>
            <p>مكتبتك مرتبطة بحسابك وتُزامن تلقائيًا.</p>
          </div>
          <div class="cloud-status-card"><span>✓</span><div><b>Cloudflare D1</b><small id="cloudStatusText">متزامن</small></div></div>
          <button class="account-logout" id="accountLogout" type="button">تسجيل الخروج</button>
        </div>
      </section>`;
    document.body.appendChild(wrap);

    let mode = 'login';
    wrap.querySelectorAll('[data-auth-close]').forEach(el => el.addEventListener('click', closeModal));
    wrap.querySelectorAll('[data-auth-mode]').forEach(btn => btn.addEventListener('click', () => {
      mode = btn.dataset.authMode;
      wrap.querySelectorAll('[data-auth-mode]').forEach(x => x.classList.toggle('active', x === btn));
      const password = document.getElementById('accountPassword');
      password.autocomplete = mode === 'login' ? 'current-password' : 'new-password';
      document.getElementById('accountSubmit').textContent = mode === 'login' ? 'تسجيل الدخول' : 'إنشاء الحساب';
      document.getElementById('accountMessage').textContent = '';
    }));

    document.getElementById('accountForm').addEventListener('submit', async event => {
      event.preventDefault();
      const username = document.getElementById('accountUsername').value.trim();
      const password = document.getElementById('accountPassword').value;
      const submit = document.getElementById('accountSubmit');
      const message = document.getElementById('accountMessage');
      message.textContent = '';
      submit.disabled = true;
      submit.textContent = 'جارٍ الاتصال…';
      try {
        const result = await api(`/auth/${mode}`, { method: 'POST', body: JSON.stringify({ username, password }) });
        AUTH.user = result.user;
        AUTH.cloudAvailable = true;
        await mergeCloudState();
        updateAccountUI();
        toast(mode === 'login' ? 'تم تسجيل الدخول والمزامنة' : 'تم إنشاء الحساب وربط مكتبتك');
      } catch (error) {
        message.textContent = error.message;
      } finally {
        submit.disabled = false;
        submit.textContent = mode === 'login' ? 'تسجيل الدخول' : 'إنشاء الحساب';
      }
    });

    document.getElementById('accountLogout').addEventListener('click', async () => {
      try { await api('/auth/logout', { method: 'POST', body: '{}' }); } catch (_) {}
      AUTH.user = null;
      updateAccountUI();
      toast('تم تسجيل الخروج — ستبقى بيانات هذا الجهاز محفوظة محليًا');
    });
  }

  function openModal() {
    const modal = document.getElementById('accountModal');
    if (!modal) return;
    updateAccountUI();
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('account-open');
    if (!AUTH.user) setTimeout(() => document.getElementById('accountUsername')?.focus(), 60);
  }

  function closeModal() {
    const modal = document.getElementById('accountModal');
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('account-open');
  }

  function updateAccountUI() {
    const guest = document.getElementById('accountGuest');
    const logged = document.getElementById('accountLogged');
    if (guest) guest.classList.toggle('hidden', !!AUTH.user);
    if (logged) logged.classList.toggle('hidden', !AUTH.user);
    const loggedName = document.getElementById('accountLoggedName');
    if (loggedName) loggedName.textContent = AUTH.user?.username || '';

    const profile = document.getElementById('profileButton');
    if (profile) {
      const avatar = profile.querySelector('.avatar');
      const title = profile.querySelector('b');
      const subtitle = profile.querySelector('small');
      if (avatar) avatar.textContent = AUTH.user ? AUTH.user.username.slice(0,1).toUpperCase() : 'ع';
      if (title) title.textContent = AUTH.user ? AUTH.user.username : 'مكتبتي الخاصة';
      if (subtitle) subtitle.textContent = AUTH.user ? 'متزامنة عبر Cloudflare' : 'محفوظة على الجهاز';
      profile.classList.toggle('cloud-connected', !!AUTH.user);
    }
    const quick = document.getElementById('quickProfile');
    if (quick) quick.textContent = AUTH.user ? AUTH.user.username.slice(0,1).toUpperCase() : 'ع';
  }

  async function mergeCloudState() {
    if (!AUTH.user || AUTH.syncing) return;
    AUTH.syncing = true;
    try {
      const remote = await api('/library');
      const remoteLists = remote.lists || {};
      const localOnly = { lists: {}, personal: {} };
      for (const list of ['favorite','try','buy','owned']) {
        const local = new Set(state.lists[list] || []);
        const cloud = new Set(remoteLists[list] || []);
        localOnly.lists[list] = [...local].filter(id => !cloud.has(id));
        state.lists[list] = [...new Set([...cloud, ...local])];
      }

      const remotePersonal = remote.personal || {};
      for (const [id, value] of Object.entries(state.personal || {})) {
        if (!remotePersonal[id]) localOnly.personal[id] = value;
      }
      state.personal = { ...(state.personal || {}), ...remotePersonal };
      saveState();
      renderAll();

      const hasLocalLists = Object.values(localOnly.lists).some(arr => arr.length);
      const hasLocalPersonal = Object.keys(localOnly.personal).length > 0;
      if (hasLocalLists || hasLocalPersonal) {
        await api('/import', { method: 'POST', body: JSON.stringify(localOnly) });
      }
    } finally {
      AUTH.syncing = false;
    }
  }

  function patchListSync() {
    const originalToggleList = toggleList;
    toggleList = function(list, id) {
      const wasActive = isIn(list, id);
      originalToggleList(list, id);
      if (AUTH.user) {
        api('/library', {
          method: 'POST',
          body: JSON.stringify({ perfume_id: id, list_name: list, active: !wasActive })
        }).catch(() => toast('تم الحفظ محليًا، وستتم المزامنة عند عودة الاتصال'));
      }
    };
  }

  function patchPersonalEditor() {
    const originalRenderDetail = renderDetail;
    renderDetail = function() {
      originalRenderDetail();
      mountPersonalEditor();
    };
  }

  function mountPersonalEditor() {
    const detail = document.querySelector('#detailContent .detail-card');
    if (!detail || detail.querySelector('.personal-review')) return;
    const p = byId(state.selected);
    if (!p) return;
    const current = state.personal?.[p.id] || { rating: 0, note: '' };
    const section = document.createElement('div');
    section.className = 'detail-section personal-review';
    section.innerHTML = `
      <div class="section-label"><h3>MY REVIEW</h3><small>تقييمي الشخصي</small></div>
      <div class="personal-review-grid">
        <label class="personal-rating-label">تقييمي <strong id="personalRatingValue">${Number(current.rating || 0)}/10</strong>
          <input id="personalRating" type="range" min="0" max="10" step="1" value="${Number(current.rating || 0)}">
        </label>
        <label>ملاحظتي
          <textarea id="personalNote" maxlength="1000" placeholder="كيف وجدت الرائحة، الثبات، الفوحان…">${esc(current.note || '')}</textarea>
        </label>
        <div class="personal-review-actions">
          <button type="button" id="savePersonalReview">حفظ التقييم</button>
          <small>${AUTH.user ? 'سيتم حفظه ومزامنته مع حسابك.' : 'محفوظ محليًا حتى تسجل الدخول.'}</small>
        </div>
      </div>`;
    const reminds = [...detail.querySelectorAll('.detail-section')].find(el => el.querySelector('h3')?.textContent.toLowerCase().includes('reminds'));
    detail.insertBefore(section, reminds || null);
    const slider = section.querySelector('#personalRating');
    const value = section.querySelector('#personalRatingValue');
    slider.addEventListener('input', () => value.textContent = `${slider.value}/10`);
    section.querySelector('#savePersonalReview').addEventListener('click', async () => {
      const item = { rating: Number(slider.value), note: section.querySelector('#personalNote').value.trim(), updatedAt: Date.now() };
      state.personal[p.id] = item;
      saveState();
      if (AUTH.user) {
        try {
          await api('/personal', { method: 'POST', body: JSON.stringify({ perfume_id: p.id, rating: item.rating, note: item.note }) });
          toast('تم حفظ تقييمك ومزامنته');
        } catch (_) {
          toast('تم حفظ التقييم محليًا، وستتم مزامنته لاحقًا');
        }
      } else {
        toast('تم حفظ تقييمك على هذا الجهاز');
      }
    });
  }

  async function bootstrapAuth() {
    try {
      const health = await api('/health');
      AUTH.cloudAvailable = !!health.ok;
      const result = await api('/auth/me');
      AUTH.user = result.user || null;
      if (AUTH.user) await mergeCloudState();
    } catch (_) {
      AUTH.cloudAvailable = false;
      AUTH.user = null;
    }
    updateAccountUI();
    mountPersonalEditor();
  }

  function interceptProfileClicks() {
    PROFILE_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        openModal();
      }, true);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    ensureLocalShape();
    buildModal();
    patchListSync();
    patchPersonalEditor();
    interceptProfileClicks();
    updateAccountUI();
    mountPersonalEditor();
    bootstrapAuth();
  });
})();
