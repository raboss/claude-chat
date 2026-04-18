/* ============================================================
   NouRion — public/assets/js/projects-page.js  (Phase 7)
   Real projects page wired to:
     - Repository (Phase 5)
     - ProjectService (Phase 6)
     - Design system (Phase 3)
   ============================================================ */

(function () {
  'use strict';

  // UMD-style module resolution: browser globals OR ES module
  // We expose the library via script tag in projects.html; for CJS we
  // fall back to require() in tests.
  var Repo    = (typeof window !== 'undefined' && window.NouRionRepo)         ? window.NouRionRepo         : require('../../../src/services/repository.js');
  var ProjSvc = (typeof window !== 'undefined' && window.NouRionProjectService) ? window.NouRionProjectService : require('../../../src/services/project-service.js');

  // ---------- helpers ----------
  var $  = function (sel, el) { return (el || document).querySelector(sel); };
  var $$ = function (sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); };

  function fmtMoney(n) {
    if (!isFinite(n) || n == null) return '—';
    return Math.round(n).toLocaleString('ar-SA');
  }
  function fmtDate(iso) {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleDateString('ar-SA'); }
    catch (e) { return iso; }
  }
  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  var STAGE_LABELS = {
    'draft':         { label: 'مسودة',   badge: 'nr-badge' },
    'measured':      { label: 'مقاسات',  badge: 'nr-badge nr-badge--info nr-badge--dot' },
    'quoted':        { label: 'عرض سعر', badge: 'nr-badge nr-badge--info nr-badge--dot' },
    'approved':      { label: 'موافقة',  badge: 'nr-badge nr-badge--primary nr-badge--dot' },
    'manufacturing': { label: 'تصنيع',   badge: 'nr-badge nr-badge--primary nr-badge--dot' },
    'installed':     { label: 'تركيب',   badge: 'nr-badge nr-badge--warning nr-badge--dot' },
    'delivered':     { label: 'تسليم',   badge: 'nr-badge nr-badge--success nr-badge--dot' },
    'archived':      { label: 'أرشيف',   badge: 'nr-badge nr-badge--dot' }
  };

  // ---------- application state ----------
  var svc = null;
  var state = {
    filters: { company: '', stage: '', search: '' }
  };

  function currentList() {
    var list = svc.list();
    var f = state.filters;
    if (f.company) list = list.filter(function (p) { return p.company === f.company; });
    if (f.stage)   list = list.filter(function (p) { return p.stage   === f.stage; });
    if (f.search) {
      var q = f.search.toLowerCase();
      list = list.filter(function (p) {
        return (p.name    && String(p.name).toLowerCase().indexOf(q)    !== -1) ||
               (p.company && String(p.company).toLowerCase().indexOf(q) !== -1) ||
               (p.id      && String(p.id).toLowerCase().indexOf(q)      !== -1);
      });
    }
    return list;
  }

  // ---------- renderers ----------
  function renderStats(list) {
    var s = ProjSvc.computeStats ? ProjSvc.computeStats(list) : svc.stats();
    $('#statTotal').textContent    = s.total;
    $('#statActive').textContent   = s.activeCount;
    $('#statFinished').textContent = s.finishedCount;
    $('#statValue').textContent    = fmtMoney(s.totalValue);
  }

  function renderTable(list) {
    var tbody = $('#projectsTbody');
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:var(--nr-sp-8); color:var(--nr-text-muted);">— لا توجد مشاريع —</td></tr>';
      return;
    }
    tbody.innerHTML = list.map(function (p) {
      var st = STAGE_LABELS[p.stage] || STAGE_LABELS.draft;
      return (
        '<tr data-id="' + escapeHtml(p.id) + '">' +
          '<td style="font-family:var(--nr-font-mono); color:var(--nr-text-muted);">' + escapeHtml(String(p.id).slice(0, 10)) + '</td>' +
          '<td>' + escapeHtml(p.name || '—') + '</td>' +
          '<td>' + escapeHtml(p.company || '—') + '</td>' +
          '<td style="font-family:var(--nr-font-mono);">' + (p.area != null ? p.area : '—') + '</td>' +
          '<td style="font-family:var(--nr-font-mono);">' + fmtMoney(p.value) + '</td>' +
          '<td><span class="' + st.badge + '">' + st.label + '</span></td>' +
          '<td>' +
            '<div class="nr-progress" style="width:80px;">' +
              '<div class="nr-progress__fill" style="width:' + p.progress + '%;"></div>' +
            '</div>' +
          '</td>' +
          '<td>' +
            '<div class="nr-row" style="gap:var(--nr-sp-1);">' +
              '<button class="nr-btn nr-btn--ghost nr-btn--sm" data-act="advance">تقدّم</button>' +
              '<button class="nr-btn nr-btn--ghost nr-btn--sm" data-act="edit">تعديل</button>' +
              '<button class="nr-btn nr-btn--ghost nr-btn--sm" data-act="delete">حذف</button>' +
            '</div>' +
          '</td>' +
        '</tr>'
      );
    }).join('');
  }

  function renderFilters() {
    var list = svc.list();
    var companies = [];
    var seen = {};
    list.forEach(function (p) { if (p.company && !seen[p.company]) { seen[p.company] = 1; companies.push(p.company); } });
    var sel = $('#filterCompany');
    var cur = sel.value;
    sel.innerHTML = '<option value="">كل الشركات</option>' +
      companies.map(function (c) { return '<option value="' + escapeHtml(c) + '">' + escapeHtml(c) + '</option>'; }).join('');
    if (cur) sel.value = cur;
  }

  function renderAll() {
    var list = currentList();
    renderStats(list);
    renderTable(list);
    renderFilters();
  }

  // ---------- modal ----------
  function openProjectModal(existing) {
    var modal = $('#projectModal');
    modal.classList.add('is-open');
    $('#modalTitle').textContent = existing ? 'تعديل المشروع' : 'مشروع جديد';
    $('#pf-id').value      = existing ? existing.id      : '';
    $('#pf-name').value    = existing ? existing.name    : '';
    $('#pf-company').value = existing ? existing.company : '';
    $('#pf-region').value  = existing ? existing.region  : '';
    $('#pf-area').value    = existing && existing.area   != null ? existing.area  : '';
    $('#pf-value').value   = existing && existing.value  != null ? existing.value : '';
    $('#pf-err').style.display = 'none';
    $('#pf-err').textContent = '';
    setTimeout(function () { $('#pf-name').focus(); }, 50);
  }

  function closeProjectModal() { $('#projectModal').classList.remove('is-open'); }

  async function submitProjectForm(e) {
    e.preventDefault();
    var err = $('#pf-err');
    err.style.display = 'none';
    var data = {
      name:    $('#pf-name').value.trim(),
      company: $('#pf-company').value.trim(),
      region:  $('#pf-region').value.trim(),
      area:    $('#pf-area').value    ? Number($('#pf-area').value)  : null,
      value:   $('#pf-value').value   ? Number($('#pf-value').value) : null
    };
    var id = $('#pf-id').value;
    try {
      if (id) await svc.update(id, data);
      else    await svc.create(data);
      closeProjectModal();
    } catch (ex) {
      err.textContent = ex.message || 'خطأ غير معروف';
      err.style.display = 'block';
    }
  }

  // ---------- event wiring ----------
  function wireEvents() {
    $('#newProjectBtn').addEventListener('click', function () { openProjectModal(null); });
    $('#projectForm').addEventListener('submit', submitProjectForm);
    $$('#projectModal [data-close-modal]').forEach(function (el) {
      el.addEventListener('click', closeProjectModal);
    });
    $('#projectModal').addEventListener('click', function (e) {
      if (e.target === e.currentTarget) closeProjectModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeProjectModal();
    });

    // Filter inputs
    $('#filterSearch').addEventListener('input', function (e) {
      state.filters.search = e.target.value;
      renderAll();
    });
    $('#filterCompany').addEventListener('change', function (e) {
      state.filters.company = e.target.value;
      renderAll();
    });
    $('#filterStage').addEventListener('change', function (e) {
      state.filters.stage = e.target.value;
      renderAll();
    });

    // Table action delegation
    $('#projectsTbody').addEventListener('click', async function (e) {
      var btn = e.target.closest('button[data-act]');
      if (!btn) return;
      var tr = btn.closest('tr[data-id]');
      if (!tr) return;
      var id = tr.getAttribute('data-id');
      var act = btn.getAttribute('data-act');
      try {
        if (act === 'advance') {
          await svc.advanceStage(id);
        } else if (act === 'edit') {
          openProjectModal(svc.get(id));
        } else if (act === 'delete') {
          if (confirm('هل أنت متأكد من حذف هذا المشروع؟')) {
            await svc.remove(id);
          }
        }
      } catch (ex) {
        alert(ex.message || 'خطأ');
      }
    });

    // Re-render on any repository change
    svc.on('changed', renderAll);
  }

  // ---------- bootstrap ----------
  async function bootstrap() {
    var transport = new Repo.HttpTransport({ credentials: 'same-origin' });
    // Note: pm_projects is merge-only in the legacy backend.
    // For Phase 7 we use a new key owned by the NouRion stack.
    var repo = new Repo.Repository({
      key:       'pm_nourion_projects',
      transport: transport,
      store:     (typeof localStorage !== 'undefined' ? localStorage : null)
    });
    svc = new ProjSvc.ProjectService(repo);
    await svc.load();

    // Seed a few sample projects if empty (dev convenience)
    if (svc.list().length === 0) {
      try {
        await svc.create({ name: 'فيلا الخالدية A12', company: 'شركة النور',  region: 'الرياض', area: 482,  value: 285000, stage: 'manufacturing' });
        await svc.create({ name: 'برج الأعمال T04',   company: 'مجموعة الرونق', region: 'جدة',    area: 1240, value: 940000, stage: 'quoted' });
        await svc.create({ name: 'معرض السيارات M08', company: 'المركز الصناعي', region: 'الرياض', area: 720,  value: 510000, stage: 'delivered' });
        await svc.create({ name: 'فيلا الرياض R02',   company: 'مقاولات الخليج', region: 'الرياض', area: 340,  value: 198500, stage: 'draft' });
      } catch (e) { /* might fail silently if server rejects */ }
    }
    wireEvents();
    renderAll();
  }

  // Expose for inline <script> initialization
  if (typeof window !== 'undefined') {
    window.NouRionProjectsPage = { bootstrap: bootstrap };
  } else if (typeof module !== 'undefined' && module.exports) {
    module.exports = { bootstrap: bootstrap };
  }
})();
