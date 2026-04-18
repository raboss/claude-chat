/* ============================================================
   NouRion — public/assets/js/nourion-data-translate.js
   Data Translation Feature (with permissions)

   - Translates USER DATA (not UI) — names, descriptions, notes
   - Uses MyMemory free translation API (no key needed)
   - Appears only for users with 'translate_data' permission
   - Works on any CRUD table in the SPA
   ============================================================ */

(function () {
  'use strict';

  var I18n = window.NouRionI18n;
  function t(key, fb) { return I18n ? I18n.t(key, fb) : (fb || key); }

  // ==========================================================
  // 1. Translation API — MyMemory (free, no key, 5000 chars/day)
  //    Fallback: local transliteration for Arabic names
  // ==========================================================
  async function translateText(text, from, to) {
    if (!text || !text.trim()) return text;
    // Try MyMemory API
    try {
      var pair = from + '|' + to;
      var url = 'https://api.mymemory.translated.net/get?q=' +
                encodeURIComponent(text) + '&langpair=' + encodeURIComponent(pair);
      var r = await fetch(url);
      var data = await r.json();
      if (data && data.responseData && data.responseData.translatedText) {
        var result = data.responseData.translatedText;
        // MyMemory sometimes returns CAPS for short strings
        if (result === result.toUpperCase() && result.length < 60) {
          result = result.charAt(0).toUpperCase() + result.slice(1).toLowerCase();
        }
        return result;
      }
    } catch (e) {
      console.warn('[data-translate] API failed, using fallback:', e.message);
    }
    // Fallback: basic Arabic name transliteration
    return fallbackTransliterate(text, from, to);
  }

  // Basic Arabic → Latin transliteration for names
  var AR_TO_EN = {
    'أ':'A','إ':'E','ا':'a','آ':'A','ب':'b','ت':'t','ث':'th','ج':'j','ح':'h',
    'خ':'kh','د':'d','ذ':'dh','ر':'r','ز':'z','س':'s','ش':'sh','ص':'s','ض':'d',
    'ط':'t','ظ':'z','ع':'a','غ':'gh','ف':'f','ق':'q','ك':'k','ل':'l','م':'m',
    'ن':'n','ه':'h','و':'w','ي':'y','ى':'a','ة':'a','ء':'','ئ':'e','ؤ':'o',
    'َ':'a','ُ':'u','ِ':'i','ّ':'','ً':'an','ٌ':'un','ٍ':'in','ْ':''
  };

  function fallbackTransliterate(text, from, to) {
    if (from === 'ar' && to === 'en') {
      var result = '';
      for (var i = 0; i < text.length; i++) {
        var ch = text[i];
        result += AR_TO_EN[ch] || ch;
      }
      // Capitalize first letter of each word
      return result.replace(/\b\w/g, function (c) { return c.toUpperCase(); });
    }
    // en → ar: can't transliterate backwards reliably, return as-is
    return text;
  }

  // ==========================================================
  // 2. Translate all data in a module's repository
  // ==========================================================
  async function translateModuleData(moduleName, svc, fields, fromLang, toLang) {
    if (!svc || !svc.list) return { translated: 0, errors: 0 };
    var items = svc.list();
    var translated = 0;
    var errors = 0;

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var patch = {};
      var changed = false;

      for (var j = 0; j < fields.length; j++) {
        var field = fields[j];
        var original = item[field];
        if (!original || typeof original !== 'string' || !original.trim()) continue;

        // Skip if already in target language (heuristic: has Arabic chars?)
        var hasArabic = /[\u0600-\u06FF]/.test(original);
        if (toLang === 'ar' && hasArabic) continue;
        if (toLang === 'en' && !hasArabic) continue;

        try {
          var result = await translateText(original, fromLang, toLang);
          if (result && result !== original) {
            // Store original in _orig_<field> for undo
            patch['_orig_' + field] = original;
            patch[field] = result;
            changed = true;
          }
        } catch (e) {
          errors++;
        }
      }

      if (changed) {
        try {
          await svc.update(item.id, patch);
          translated++;
        } catch (e) {
          errors++;
        }
      }
    }

    return { translated: translated, errors: errors, total: items.length };
  }

  // ==========================================================
  // 3. Undo translation (restore originals)
  // ==========================================================
  async function undoTranslation(svc, fields) {
    if (!svc || !svc.list) return 0;
    var items = svc.list();
    var restored = 0;
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var patch = {};
      var changed = false;
      for (var j = 0; j < fields.length; j++) {
        var origKey = '_orig_' + fields[j];
        if (item[origKey]) {
          patch[fields[j]] = item[origKey];
          patch[origKey] = null;
          changed = true;
        }
      }
      if (changed) {
        try { await svc.update(item.id, patch); restored++; } catch(e){}
      }
    }
    return restored;
  }

  // ==========================================================
  // 4. Permission check
  // ==========================================================
  function hasTranslatePermission(user) {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.permissions && user.permissions.indexOf('translate_data') !== -1) return true;
    return false;
  }

  // ==========================================================
  // 5. UI: inject translate button into SPA
  // ==========================================================
  var TRANSLATABLE_FIELDS = {
    projects:  ['name', 'company', 'region'],
    customers: ['name', 'company', 'city', 'notes'],
    employees: ['name', 'role', 'department', 'notes'],
    formtypes: ['name', 'category', 'description']
  };

  function injectTranslateButton(spaState) {
    // Called by nourion-spa.js when rendering a module
    // Returns HTML string for the translate button bar
    if (!spaState || !spaState.user) return '';
    if (!hasTranslatePermission(spaState.user)) return '';

    return (
      '<div class="nr-row" style="gap:var(--nr-sp-2); margin-bottom:var(--nr-sp-4); padding:var(--nr-sp-3) var(--nr-sp-4); background:var(--nr-bg-2); border:1px solid var(--nr-border-subtle); border-radius:var(--nr-radius-md);">' +
        '<span style="color:var(--nr-text-muted); font-size:var(--nr-fs-sm);">🌐 ' + t('translate.data_label', 'ترجمة البيانات') + ':</span>' +
        '<button class="nr-btn nr-btn--outline nr-btn--sm" data-translate-action="to-en">' + t('translate.to_en', 'عربي → English') + '</button>' +
        '<button class="nr-btn nr-btn--outline nr-btn--sm" data-translate-action="to-ar">' + t('translate.to_ar', 'English → عربي') + '</button>' +
        '<button class="nr-btn nr-btn--ghost nr-btn--sm" data-translate-action="undo">' + t('translate.undo', 'تراجع ↩') + '</button>' +
      '</div>'
    );
  }

  function wireTranslateButtons(hostEl, moduleName, svc) {
    if (!hostEl) return;
    var fields = TRANSLATABLE_FIELDS[moduleName] || ['name'];

    hostEl.querySelectorAll('[data-translate-action]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        var action = btn.getAttribute('data-translate-action');
        btn.disabled = true;
        var originalText = btn.textContent;
        btn.textContent = '⏳ ...';

        try {
          if (action === 'to-en') {
            var r = await translateModuleData(moduleName, svc, fields, 'ar', 'en');
            showTranslateNotify(r.translated + ' ' + t('translate.items_translated', 'سجل تمت ترجمته'));
          } else if (action === 'to-ar') {
            var r2 = await translateModuleData(moduleName, svc, fields, 'en', 'ar');
            showTranslateNotify(r2.translated + ' ' + t('translate.items_translated', 'سجل تمت ترجمته'));
          } else if (action === 'undo') {
            var n = await undoTranslation(svc, fields);
            showTranslateNotify(n + ' ' + t('translate.items_restored', 'سجل تمت استعادته'));
          }
        } catch (e) {
          showTranslateNotify('❌ ' + (e.message || t('ui.error', 'خطأ')));
        }
        btn.textContent = originalText;
        btn.disabled = false;
      });
    });
  }

  function showTranslateNotify(msg) {
    // Simple toast notification
    var toast = document.createElement('div');
    toast.textContent = msg;
    toast.style.cssText = 'position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:var(--nr-accent); color:#fff; padding:10px 24px; border-radius:8px; font-size:14px; z-index:10000; box-shadow:0 4px 20px rgba(0,0,0,.3); transition:opacity .3s;';
    document.body.appendChild(toast);
    setTimeout(function () {
      toast.style.opacity = '0';
      setTimeout(function () { toast.remove(); }, 300);
    }, 2500);
  }

  // ==========================================================
  // 6. Add i18n keys for translate feature
  // ==========================================================
  if (I18n && I18n.addTranslations) {
    I18n.addTranslations({
      'translate.data_label':       { ar: 'ترجمة البيانات',     en: 'Translate Data' },
      'translate.to_en':            { ar: 'عربي → English',     en: 'Arabic → English' },
      'translate.to_ar':            { ar: 'English → عربي',     en: 'English → Arabic' },
      'translate.undo':             { ar: 'تراجع ↩',            en: 'Undo ↩' },
      'translate.items_translated': { ar: 'سجل تمت ترجمته',     en: 'records translated' },
      'translate.items_restored':   { ar: 'سجل تمت استعادته',   en: 'records restored' },
      'translate.no_permission':    { ar: 'ليس لديك صلاحية ترجمة البيانات', en: 'You do not have data translation permission' }
    });
  }

  // ==========================================================
  // EXPORTS
  // ==========================================================
  window.NouRionDataTranslate = {
    translateText:        translateText,
    translateModuleData:  translateModuleData,
    undoTranslation:      undoTranslation,
    hasTranslatePermission: hasTranslatePermission,
    injectTranslateButton: injectTranslateButton,
    wireTranslateButtons:  wireTranslateButtons,
    TRANSLATABLE_FIELDS:   TRANSLATABLE_FIELDS
  };

})();
