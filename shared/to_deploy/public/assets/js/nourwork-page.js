/* ═══════════════════════════════════════════════════════
   NourWork page controller
   — loads Ra Workshop data from /api/ra/* + /api/nourwork/*
   ═══════════════════════════════════════════════════════ */

(function() {
  'use strict';

  const API_BASE = ''; // same origin (/unified/ via ngrok)
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => r.querySelectorAll(s);

  // ─── State ────────────────────────────────────────
  const state = {
    projects: [],
    materials: [],
    templates: { arcs: [], doors: [], glasses: [] },
    currentProject: null,
    searchProjects: '',
    searchMaterials: '',
    templateFilter: 'all'
  };

  // ─── Utilities ────────────────────────────────────
  async function api(path) {
    try {
      const res = await fetch(API_BASE + path, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } catch (err) {
      console.error('API error:', path, err);
      return { ok: false, error: err.message };
    }
  }

  function fmt(n) {
    if (n == null) return '—';
    if (typeof n === 'number') {
      if (n >= 1000) return n.toLocaleString('en-US');
      return String(n);
    }
    return n;
  }

  function fmtDate(s) {
    if (!s) return '—';
    try {
      const d = new Date(s);
      return d.toISOString().slice(0, 10);
    } catch {
      return s;
    }
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
  }

  // ─── Load & render ─────────────────────────────────
  async function loadProjects() {
    const r = await api('/api/ra/projects');
    if (r.ok && Array.isArray(r.items)) {
      state.projects = r.items;
      $('#statProjects').textContent = r.items.length;
      renderProjects();
    } else {
      $('#projectsGrid').innerHTML = '<div class="nw-loading">تعذّر تحميل المشاريع.</div>';
    }
  }

  async function loadMaterials() {
    const r = await api('/api/ra/materials');
    if (r.ok && Array.isArray(r.items)) {
      state.materials = r.items;
      $('#statMaterials').textContent = fmt(r.items.length);
    }
  }

  async function loadTemplates() {
    const r = await api('/api/nourwork/templates');
    if (r.ok && r.templates) {
      state.templates = r.templates;
      const total = (r.templates.arcs || []).length +
                    (r.templates.doors || []).length +
                    (r.templates.glasses || []).length;
      $('#statTemplates').textContent = fmt(total);
    }
  }

  async function loadHealth() {
    const r = await api('/api/ra/health');
    const el = $('#statHealth');
    if (r.ok) {
      el.textContent = '●';
      el.classList.remove('bad');
    } else {
      el.textContent = '○';
      el.classList.add('bad');
    }
  }

  function renderProjects() {
    const q = state.searchProjects.trim().toLowerCase();
    const filtered = q
      ? state.projects.filter(p =>
          (p.Code || '').toLowerCase().includes(q) ||
          (p.Designation || '').toLowerCase().includes(q))
      : state.projects;

    const grid = $('#projectsGrid');
    if (!filtered.length) {
      grid.innerHTML = '<div class="nw-loading">لا توجد نتائج.</div>';
      return;
    }

    grid.innerHTML = filtered.map(p => `
      <div class="nw-project-card" data-id="${p.Id}">
        <div class="nw-project-code">${escapeHtml(p.Code || '—')} · ${escapeHtml(p.ProjectType || '—')}</div>
        <div class="nw-project-name">${escapeHtml(p.Designation || '—')}</div>
        <div class="nw-project-meta">
          <span>${fmtDate(p.CreationDate)}</span>
          <span class="nw-project-value">${fmt(p.ValueNoTaxes)} ${escapeHtml(p.Currency || '')}</span>
        </div>
      </div>
    `).join('');

    // wire clicks
    $$('.nw-project-card', grid).forEach(card => {
      card.addEventListener('click', () => openProject(Number(card.dataset.id)));
    });
  }

  function renderMaterials() {
    const q = state.searchMaterials.trim().toLowerCase();
    const mats = state.materials || [];
    const filtered = q
      ? mats.filter(m =>
          (m.Code || '').toLowerCase().includes(q) ||
          (m.Designation || '').toLowerCase().includes(q))
      : mats.slice(0, 200); // first 200 for perf

    const grid = $('#materialsGrid');
    if (!filtered.length) {
      grid.innerHTML = '<div class="nw-loading">لا توجد نتائج.</div>';
      return;
    }

    grid.innerHTML = filtered.map(m => `
      <div class="nw-material-card">
        <div class="nw-material-code">${escapeHtml(m.Code || '—')}</div>
        <div class="nw-material-name">${escapeHtml(m.Designation || m.Name || '—')}</div>
      </div>
    `).join('');
  }

  function renderTemplates() {
    const filter = state.templateFilter;
    let items = [];
    if (filter === 'all') {
      items = [
        ...(state.templates.arcs || []),
        ...(state.templates.doors || []),
        ...(state.templates.glasses || [])
      ];
    } else {
      items = state.templates[filter] || [];
    }

    const grid = $('#templatesGrid');
    if (!items.length) {
      grid.innerHTML = '<div class="nw-loading">لا توجد قوالب.</div>';
      return;
    }

    const icon = {
      arcs: '⌒',
      doors: '▯',
      glasses: '▢'
    };

    grid.innerHTML = items.slice(0, 120).map(t => `
      <div class="nw-template-item" data-url="${escapeHtml(t.url)}">
        <div class="nw-template-icon">${icon[t.category] || '◆'}</div>
        <div class="nw-template-id">${escapeHtml(t.id)}</div>
        <div class="nw-template-category">${escapeHtml(t.category)}</div>
      </div>
    `).join('');
  }

  // ─── Project detail modal ─────────────────────────
  async function openProject(id) {
    const modal = $('#projectModal');
    modal.hidden = false;
    $('#modalName').textContent = 'جاري...';
    $('#modalCode').textContent = '#' + id;
    $('#costTable').innerHTML = '<div class="nw-loading-sm">جاري...</div>';
    $('#componentsList').innerHTML = '<div class="nw-loading-sm">جاري...</div>';

    const [detailR, costR, compR] = await Promise.all([
      api('/api/ra/projects/' + id),
      api('/api/ra/projects/' + id + '/cost-breakdown'),
      api('/api/ra/projects/' + id + '/components')
    ]);

    // Detail
    if (detailR.ok && detailR.item) {
      const p = detailR.item;
      $('#modalName').textContent = p.Designation || '—';
      $('#modalCode').textContent = p.Code || '#' + id;
      $('#modalDate').textContent = fmtDate(p.CreationDate);
      $('#modalCurrency').textContent = p.Currency || '—';
      $('#modalType').textContent = p.ProjectType || '—';
      $('#modalValue').textContent = fmt(p.ValueNoTaxes) + ' ' + (p.Currency || '');
    }

    // Cost breakdown
    if (costR.ok && Array.isArray(costR.items)) {
      $('#costCount').textContent = costR.count || costR.items.length;
      const rows = costR.items.slice(0, 80).map(c => `
        <div class="nw-cost-row">
          <span class="nw-cost-code">${escapeHtml(c.Code || '—')}</span>
          <span>${escapeHtml(c.Designation || '—')}</span>
          <span class="nw-cost-qty">×${fmt(c.Quantity)}</span>
          <span class="nw-cost-price">${fmt(c.UnitPriceSelling || c.UnitPriceProduction || 0)}</span>
        </div>
      `).join('');
      $('#costTable').innerHTML = rows || '<div class="nw-loading-sm">لا توجد بنود.</div>';
      if (costR.items.length > 80) {
        $('#costTable').insertAdjacentHTML('beforeend',
          `<div class="nw-loading-sm">+${costR.items.length - 80} بند إضافي...</div>`);
      }
    } else {
      $('#costTable').innerHTML = '<div class="nw-loading-sm">لم يتم جلب التكلفة.</div>';
    }

    // Components
    if (compR.ok && Array.isArray(compR.items)) {
      $('#compCount').textContent = compR.items.length;
      const list = compR.items.slice(0, 40).map(c => `
        <div class="nw-component-card">
          <div class="nw-component-name">${escapeHtml(c.Designation || c.Name || '—')}</div>
          <div class="nw-component-dim">${fmt(c.Width)}×${fmt(c.Height)}mm</div>
        </div>
      `).join('');
      $('#componentsList').innerHTML = list || '<div class="nw-loading-sm">لا مكونات.</div>';
    } else {
      $('#componentsList').innerHTML = '<div class="nw-loading-sm">لم يتم جلب المكونات.</div>';
    }
  }

  function closeModal() {
    $('#projectModal').hidden = true;
  }

  // ─── API console ───────────────────────────────────
  async function testApiEndpoint(url) {
    const out = $('#apiOutput');
    out.textContent = 'GET ' + url + '\n\nLoading...';
    try {
      const res = await fetch(API_BASE + url);
      const text = await res.text();
      let pretty;
      try { pretty = JSON.stringify(JSON.parse(text), null, 2); }
      catch { pretty = text; }
      out.textContent = 'GET ' + url + '\nHTTP ' + res.status + '\n\n' + pretty.slice(0, 8000);
    } catch (err) {
      out.textContent = 'ERROR: ' + err.message;
    }
  }

  // ─── Tab switching ────────────────────────────────
  function switchTab(name) {
    $$('.nw-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
    $$('.nw-panel').forEach(p => {
      p.hidden = p.id !== 'tab-' + name;
      if (p.id === 'tab-' + name) p.classList.add('active');
      else p.classList.remove('active');
    });
    // Lazy-load per tab
    if (name === 'materials' && !state.materials.length) {
      loadMaterials().then(renderMaterials);
    }
    if (name === 'materials') renderMaterials();
    if (name === 'templates') renderTemplates();
  }

  // ─── Wire events ──────────────────────────────────
  function wire() {
    // Tabs
    $$('.nw-tab').forEach(t =>
      t.addEventListener('click', () => switchTab(t.dataset.tab)));

    // Search
    $('#searchProjects').addEventListener('input', e => {
      state.searchProjects = e.target.value;
      renderProjects();
    });
    const mSearch = $('#searchMaterials');
    if (mSearch) {
      mSearch.addEventListener('input', e => {
        state.searchMaterials = e.target.value;
        renderMaterials();
      });
    }

    // Template filters
    $$('.nw-chip').forEach(c => {
      c.addEventListener('click', () => {
        $$('.nw-chip').forEach(x => x.classList.remove('active'));
        c.classList.add('active');
        state.templateFilter = c.dataset.filter;
        renderTemplates();
      });
    });

    // Modal close
    $$('#projectModal [data-close]').forEach(el =>
      el.addEventListener('click', closeModal));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeModal();
    });

    // API console
    $$('.nw-api-item').forEach(item => {
      item.addEventListener('click', () => testApiEndpoint(item.dataset.url));
    });
    $('#clearApiOut').addEventListener('click', () => {
      $('#apiOutput').textContent = '— اضغط على endpoint فوق لتجربته —';
    });
  }

  // ─── Init ──────────────────────────────────────────
  async function init() {
    wire();
    await Promise.all([
      loadHealth(),
      loadProjects(),
      loadMaterials(),
      loadTemplates()
    ]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
