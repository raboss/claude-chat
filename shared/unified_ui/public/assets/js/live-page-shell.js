/* ============================================================
   NouRion — public/assets/js/live-page-shell.js
   Injects the DOM skeleton needed by live-page.js so that every
   live HTML file stays small. The page declares its config via
   window.__livePageConfig and calls NouRionLivePageShell.init().

   Now fully wired to NouRionI18n for AR/EN support.
   ============================================================ */

(function () {
  'use strict';

  // Shortcut for translation — t() uses NouRionI18n if loaded
  function t(key, fallback) {
    if (window.NouRionI18n && window.NouRionI18n.t) return window.NouRionI18n.t(key, fallback);
    return fallback || key;
  }

  function buildShell() {
    return (
    '<div class="nr-app">' +
      '<aside class="nr-sidebar">' +
        '<div class="nr-sidebar__brand"><a href="dashboard.html"><img src="assets/img/logo.svg" alt="NouRion" style="height:32px;"></a></div>' +
        '<nav class="nr-sidebar__nav">' +
          '<div class="nr-nav-section">' +
            '<div class="nr-nav-section__title" data-i18n="nav.main">' + t('nav.main', 'الرئيسية') + '</div>' +
            '<a class="nr-nav-item" href="dashboard.html"><span class="nr-nav-item__icon">◇</span> <span data-i18n="nav.dashboard">' + t('nav.dashboard', 'لوحة التحكّم') + '</span></a>' +
            '<a class="nr-nav-item" data-nav="projects" href="projects-live.html"><span class="nr-nav-item__icon">◈</span> <span data-i18n="nav.projects">' + t('nav.projects', 'المشاريع') + '</span></a>' +
            '<a class="nr-nav-item" data-nav="customers" href="customers-live.html"><span class="nr-nav-item__icon">◇</span> <span data-i18n="nav.customers">' + t('nav.customers', 'العملاء') + '</span></a>' +
            '<a class="nr-nav-item" data-nav="employees" href="employees-live.html"><span class="nr-nav-item__icon">◆</span> <span data-i18n="nav.employees">' + t('nav.employees', 'الموظفون') + '</span></a>' +
            '<a class="nr-nav-item" data-nav="form-types" href="form-types-live.html"><span class="nr-nav-item__icon">◉</span> <span data-i18n="nav.form_types">' + t('nav.form_types', 'أنواع النماذج') + '</span></a>' +
          '</div>' +
          '<div class="nr-nav-section">' +
            '<div class="nr-nav-section__title" data-i18n="nav.system">' + t('nav.system', 'النظام') + '</div>' +
            '<a class="nr-nav-item" href="index.html"><span class="nr-nav-item__icon">◇</span> <span data-i18n="nav.design_system">' + t('nav.design_system', 'نظام التصميم') + '</span></a>' +
            '<a class="nr-nav-item" href="login.html"><span class="nr-nav-item__icon">⎆</span> <span data-i18n="nav.login">' + t('nav.login', 'تسجيل الدخول') + '</span></a>' +
          '</div>' +
        '</nav>' +
      '</aside>' +
      '<main class="nr-app__main">' +
        '<header class="nr-topbar">' +
          '<div class="nr-topbar__title" id="livepageTitle"></div>' +
          '<div class="nr-topbar__actions">' +
            '<button class="nr-btn nr-btn--ghost nr-btn--sm" data-i18n-toggle onclick="if(window.NouRionI18n)NouRionI18n.toggleLang();" title="Switch Language">' +
              (t === 'ar' ? 'EN' : 'ع') +
            '</button>' +
            '<button class="nr-btn nr-btn--ghost nr-btn--sm" data-nr-theme-toggle>' +
              '<span data-nr-theme-icon>☀</span>' +
              '<span data-nr-theme-label>' + t('ui.light_mode', 'الوضع الفاتح') + '</span>' +
            '</button>' +
            '<button class="nr-btn nr-btn--primary nr-btn--sm" id="livepageNewBtn" data-i18n="ui.new">' + t('ui.new', '+ جديد') + '</button>' +
          '</div>' +
        '</header>' +
        '<div class="nr-app__content">' +
          '<section style="margin-bottom: var(--nr-sp-6);">' +
            '<h6 class="nr-section-title"><span data-i18n="ui.overview">' + t('ui.overview', 'نظرة عامة') + '</span></h6>' +
            '<div class="nr-grid-4" id="livepageStats"></div>' +
          '</section>' +
          '<section style="margin-bottom: var(--nr-sp-6);" id="livepageFilters"></section>' +
          '<section style="margin-bottom: var(--nr-sp-10);">' +
            '<h6 class="nr-section-title" id="livepageListTitle" data-i18n="ui.records">' + t('ui.records', 'السجلات') + '</h6>' +
            '<div class="nr-table-wrap">' +
              '<table class="nr-table">' +
                '<thead id="livepageThead"></thead>' +
                '<tbody id="livepageTbody"><tr><td style="text-align:center; padding: var(--nr-sp-8); color: var(--nr-text-muted);" data-i18n="ui.loading">' + t('ui.loading', 'جارٍ التحميل…') + '</td></tr></tbody>' +
              '</table>' +
            '</div>' +
          '</section>' +
          '<footer style="padding-top: var(--nr-sp-8); border-top: 1px solid var(--nr-border-subtle);">' +
            '<div class="nr-row-between">' +
              '<small>NouRion · Smart Industrial Platform</small>' +
              '<small style="font-family: var(--nr-font-mono);" id="livepageKey"></small>' +
            '</div>' +
          '</footer>' +
        '</div>' +
      '</main>' +
    '</div>' +
    '<div class="nr-modal-overlay" id="livepageFormHost">' +
      '<div class="nr-modal" id="livepageModal" role="dialog" aria-labelledby="livepageModalTitle">' +
        '<div class="nr-modal__header">' +
          '<div class="nr-modal__title" id="livepageModalTitle"></div>' +
          '<button class="nr-modal__close" data-close-modal aria-label="' + t('ui.close', 'إغلاق') + '">×</button>' +
        '</div>' +
        '<form id="livepageForm" autocomplete="off" novalidate>' +
          '<div class="nr-modal__body">' +
            '<div class="nr-alert nr-alert--danger" id="livepageErr" style="display:none; margin-bottom: var(--nr-sp-4);"></div>' +
            '<div class="nr-grid-2" id="livepageFormBody"></div>' +
          '</div>' +
          '<div class="nr-modal__footer">' +
            '<button type="button" class="nr-btn nr-btn--ghost" data-close-modal data-i18n="ui.cancel">' + t('ui.cancel', 'إلغاء') + '</button>' +
            '<button type="submit" class="nr-btn nr-btn--primary" data-i18n="ui.save">' + t('ui.save', 'حفظ') + '</button>' +
          '</div>' +
        '</form>' +
      '</div>' +
    '</div>'
    );
  }

  function highlightNav(navKey) {
    if (!navKey) return;
    var items = document.querySelectorAll('.nr-nav-item[data-nav]');
    for (var i = 0; i < items.length; i++) {
      if (items[i].getAttribute('data-nav') === navKey) items[i].classList.add('is-active');
    }
  }

  function init() {
    var cfg = window.__livePageConfig;
    if (!cfg) throw new Error('live-page-shell: window.__livePageConfig not set');

    // Inject shell
    var holder = document.getElementById('livepage-root');
    if (!holder) {
      holder = document.createElement('div');
      holder.id = 'livepage-root';
      document.body.appendChild(holder);
    }
    holder.innerHTML = buildShell();

    // Wire title — support i18n key
    var titleKey = cfg.titleI18n;
    var titleText = titleKey ? t(titleKey, cfg.titleText || cfg.title) : (cfg.titleText || cfg.title);
    document.title = titleText;
    var titleEl = document.getElementById('livepageTitle');
    if (titleEl) {
      titleEl.innerHTML = titleText +
        ' <span style="color:var(--nr-accent); font-family:var(--nr-font-mono); font-size:var(--nr-fs-xs);">· NouRion</span>';
    }

    var listTitle = document.getElementById('livepageListTitle');
    if (listTitle && cfg.listTitleI18n) {
      listTitle.setAttribute('data-i18n', cfg.listTitleI18n);
      listTitle.textContent = t(cfg.listTitleI18n, cfg.listTitle);
    } else if (listTitle && cfg.listTitle) {
      listTitle.textContent = cfg.listTitle;
    }

    var keyEl = document.getElementById('livepageKey');
    if (keyEl) keyEl.textContent = cfg.key;
    highlightNav(cfg.nav);

    // Listen for language changes — re-render page
    if (window.NouRionI18n) {
      window.NouRionI18n.onChange(function (lang) {
        // Re-render the title
        var newTitle = titleKey ? t(titleKey) : (cfg.titleText || cfg.title);
        document.title = newTitle;
        if (titleEl) titleEl.innerHTML = newTitle + ' <span style="color:var(--nr-accent); font-family:var(--nr-font-mono); font-size:var(--nr-fs-xs);">· NouRion</span>';
        if (listTitle && cfg.listTitleI18n) listTitle.textContent = t(cfg.listTitleI18n);
        // Re-render the live page data
        if (window._currentLivePage) {
          window._currentLivePage._render();
        }
      });
    }

    // Boot the page
    var page = window.NouRionLivePage.create(cfg);
    page.bootstrap().catch(function (err) {
      console.error('[live-page] bootstrap failed:', err);
    });
    window._currentLivePage = page;
  }

  window.NouRionLivePageShell = { init: init };
})();
