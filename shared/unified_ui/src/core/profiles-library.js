'use strict';
/**
 * PROFILE LIBRARY — مكتبة القطاعات
 * قطاعات ألمنيوم حقيقية مع بيانات تصنيعية كاملة
 * ProfileLibrary.register() / .get() / .all() / .listBySystem()
 */

var ProfileLibrary = (function() {
  var _profiles = {};

  function register(profile) {
    if (!(profile instanceof ProfileSection)) {
      profile = new ProfileSection(profile);
    }
    _profiles[profile.id] = profile;
    return profile;
  }

  function get(id) { return _profiles[id] || null; }

  function getByCode(code) {
    for (var k in _profiles) { if (_profiles[k].code === code) return _profiles[k]; }
    return null;
  }

  function all() { return Object.values(_profiles); }

  function listBySystem(sys) {
    return all().filter(function(p) { return p.system === sys; });
  }

  function remove(id) { delete _profiles[id]; }

  function toDropdown(selectedId) {
    var systems = {};
    all().forEach(function(p) {
      var sys = p.system || 'عام';
      if (!systems[sys]) systems[sys] = [];
      systems[sys].push(p);
    });
    var html = '<option value="">— اختر قطاع —</option>';
    Object.keys(systems).forEach(function(sys) {
      html += '<optgroup label="' + sys + '">';
      systems[sys].forEach(function(p) {
        html += '<option value="' + p.id + '"' + (p.id === selectedId ? ' selected' : '') + '>' +
          p.code + ' — ' + p.name + ' (' + p.width + '×' + p.depth + ' | ' + p.weight + ' كغ/م)</option>';
      });
      html += '</optgroup>';
    });
    return html;
  }

  // ════════════════════════════════════════════
  // DEFAULT CATALOG — قطاعات افتراضية
  // ════════════════════════════════════════════

  // سحب (Casement)
  register({id:'cas-frame-50',  name:'إطار سحب 50',    code:'CF-50',  system:'سحب',       width:50, depth:40, thickness:1.5, weight:0.58, meta:{rebateDepth:15}});
  register({id:'cas-frame-60',  name:'إطار سحب 60',    code:'CF-60',  system:'سحب',       width:60, depth:45, thickness:1.5, weight:0.72, meta:{rebateDepth:18}});
  register({id:'cas-sash-45',   name:'ضلفة سحب 45',    code:'CS-45',  system:'سحب',       width:45, depth:35, thickness:1.3, weight:0.48, meta:{rebateDepth:12}});
  register({id:'cas-mullion-50',name:'قائم سحب 50',    code:'CM-50',  system:'سحب',       width:50, depth:40, thickness:1.5, weight:0.60, meta:{rebateDepth:15}});

  // شباك (Window - Sliding)
  register({id:'sld-frame-70',  name:'إطار شباك 70',   code:'SF-70',  system:'شباك سلايد', width:70, depth:50, thickness:1.8, weight:0.95, meta:{rebateDepth:20}});
  register({id:'sld-sash-55',   name:'ضلفة شباك 55',   code:'SS-55',  system:'شباك سلايد', width:55, depth:40, thickness:1.5, weight:0.65, meta:{rebateDepth:15}});
  register({id:'sld-rail-40',   name:'سكة شباك 40',    code:'SR-40',  system:'شباك سلايد', width:40, depth:20, thickness:1.2, weight:0.35, meta:{rebateDepth:10}});

  // باب (Door)
  register({id:'dr-frame-65',   name:'إطار باب 65',    code:'DF-65',  system:'أبواب',      width:65, depth:50, thickness:2.0, weight:1.10, meta:{rebateDepth:20}});
  register({id:'dr-sash-55',    name:'ضلفة باب 55',    code:'DS-55',  system:'أبواب',      width:55, depth:45, thickness:1.8, weight:0.85, meta:{rebateDepth:18}});
  register({id:'dr-transom-50', name:'عارضة باب 50',   code:'DT-50',  system:'أبواب',      width:50, depth:45, thickness:1.8, weight:0.78, meta:{rebateDepth:15}});

  // واجهات (Curtain Wall)
  register({id:'cw-mullion-100',name:'قائم واجهة 100', code:'CW-100', system:'واجهات',     width:100, depth:60, thickness:2.5, weight:1.80, meta:{rebateDepth:25}});
  register({id:'cw-transom-80', name:'عارضة واجهة 80', code:'CW-80',  system:'واجهات',     width:80,  depth:50, thickness:2.0, weight:1.30, meta:{rebateDepth:20}});
  register({id:'cw-cap-30',     name:'كاب واجهة 30',   code:'CC-30',  system:'واجهات',     width:30,  depth:15, thickness:1.0, weight:0.25, meta:{rebateDepth:0}});

  // درابزين (Railing)
  register({id:'rl-post-50',    name:'عمود درابزين 50',code:'RP-50',  system:'درابزين',    width:50, depth:50, thickness:2.0, weight:0.90, meta:{}});
  register({id:'rl-rail-40',    name:'يد درابزين 40',  code:'RR-40',  system:'درابزين',    width:40, depth:40, thickness:1.5, weight:0.55, meta:{}});

  // عام (General)
  register({id:'gen-angle-30',  name:'زاوية 30×30',    code:'GA-30',  system:'عام',        width:30, depth:30, thickness:1.5, weight:0.32, meta:{}});
  register({id:'gen-tube-40',   name:'مربع 40×40',     code:'GT-40',  system:'عام',        width:40, depth:40, thickness:1.5, weight:0.52, meta:{}});
  register({id:'gen-tube-50',   name:'مربع 50×50',     code:'GT-50',  system:'عام',        width:50, depth:50, thickness:1.5, weight:0.68, meta:{}});

  return {
    register: register,
    get: get,
    getByCode: getByCode,
    all: all,
    listBySystem: listBySystem,
    remove: remove,
    toDropdown: toDropdown,
  };
})();

// Bridge with user sections from loadSections()
function _syncUserSectionsToLibrary() {
  if (typeof loadSections !== 'function') return;
  var sections = loadSections();
  sections.forEach(function(s, i) {
    var id = 'user-' + (s.name || i);
    if (!ProfileLibrary.get(id)) {
      ProfileLibrary.register({
        id: id,
        name: s.name || 'قطاع ' + (i + 1),
        code: 'U-' + String(i + 1).padStart(2, '0'),
        system: 'مخصص',
        width: parseFloat(s.addWidth) || 50,
        depth: parseFloat(s.addHeight) || 40,
        thickness: 1.5,
        weight: 0.6,
        meta: { userSection: true }
      });
    }
  });
}

// Export
if (typeof module !== 'undefined' && module.exports) module.exports = { ProfileLibrary };
else Object.assign(typeof window !== 'undefined' ? window : this, { ProfileLibrary });
