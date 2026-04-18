/* ============================================================
   NouRion — Theme manager
   Toggle dark/light, persist to localStorage, honor OS preference.
   Usage:
     window.NourionTheme.toggle();
     window.NourionTheme.set('dark' | 'light');
     window.NourionTheme.get();
   Attach to any element with [data-nr-theme-toggle].
   ============================================================ */

(function () {
  'use strict';

  var STORAGE_KEY = 'nourion.theme';
  var root = document.documentElement;

  function prefersDark() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function getStored() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }

  function setStored(value) {
    try { localStorage.setItem(STORAGE_KEY, value); } catch (e) { /* ignore */ }
  }

  function apply(theme) {
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;
    document.querySelectorAll('[data-nr-theme-toggle]').forEach(function (el) {
      el.setAttribute('aria-pressed', String(theme === 'dark'));
      var label = el.querySelector('[data-nr-theme-label]');
      if (label) label.textContent = theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن';
      var icon = el.querySelector('[data-nr-theme-icon]');
      if (icon) icon.textContent = theme === 'dark' ? '☀' : '☾';
    });
    document.dispatchEvent(new CustomEvent('nourion:themechange', { detail: { theme: theme } }));
  }

  function resolveInitial() {
    var stored = getStored();
    if (stored === 'dark' || stored === 'light') return stored;
    return prefersDark() ? 'dark' : 'dark'; // default dark
  }

  var api = {
    get: function () { return root.getAttribute('data-theme') || 'dark'; },
    set: function (theme) {
      if (theme !== 'dark' && theme !== 'light') return;
      apply(theme);
      setStored(theme);
    },
    toggle: function () {
      api.set(api.get() === 'dark' ? 'light' : 'dark');
    }
  };

  // Init immediately (before DOMContentLoaded, to avoid flash)
  apply(resolveInitial());

  // Bind toggles once DOM is ready
  function bind() {
    document.querySelectorAll('[data-nr-theme-toggle]').forEach(function (el) {
      if (el.__nrBound) return;
      el.__nrBound = true;
      el.addEventListener('click', function (e) {
        e.preventDefault();
        api.toggle();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }

  // Follow OS if user never picked explicitly
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
      if (!getStored()) apply(e.matches ? 'dark' : 'light');
    });
  }

  window.NourionTheme = api;
})();
