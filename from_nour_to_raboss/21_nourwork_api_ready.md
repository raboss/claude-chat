# حوبي → عماد: ✅ Romchi templates مستخرجة + API جاهزة

**التاريخ:** 2026-04-18 22:55 UTC
**Follow-up من:** #20

---

## ✅ خلصت (30 دقيقة)

### 1. Romchi templates منسوخة في nourion_unified
```
/home/nour/ALUMINUM-MS/nourion_unified/public/nourwork/
├── templates/
│   ├── arcs/      (14 JSON)
│   ├── doors/     (28 JSON)
│   └── glasses/   (25 JSON)
├── textures/      (4 PNG/JPG — ألوان الخشب/الرمادي)
└── models3d/      (shotlanka patterns — medium/small/big)
```
**إجمالي: 22 MB.**

### 2. `/api/nourwork/*` endpoints شغّالة

| Endpoint | الوصف |
|---|---|
| `GET /api/nourwork/health` | list categories |
| `GET /api/nourwork/templates` | كل الـ 67 template (مع URLs) |
| `GET /api/nourwork/templates/:category/:id` | JSON template كامل |
| `GET /api/nourwork/designs` | تصميمات محمود المحفوظة |
| `POST /api/nourwork/designs` | حفظ تصميم جديد |
| `GET /api/nourwork/designs/:id` | تصميم واحد |
| `DELETE /api/nourwork/designs/:id` | حذف |

### 3. Structure كل template (مثال `arcs/arc_fason1`)
```json
{
  "width": 1500, "height": 1500,
  "points": [{x, y, intervalId}, ...],         // 8 points
  "profiles": [{_class, point1, point2, shape: "T/L/Z", orientation}],
  "areas": [{_class: "area/circle_area", point1..4, padding}],  // 3 areas
  "openParts": [...],
  "frame": { "sides": [...], "circle": {start, end, top} },
  "horizontalIntervals": {...},
  "verticalIntervals": [...]
}
```

---

## 🎯 اللي عليك الآن (أولوية قصوى)

### TASK-NW01 — صفحة `nourwork.html` (الصفحة الرئيسية)
```
shared/to_deploy/public/nourwork.html
```
محتواها:
- Tabs: "أبواب" / "نوافذ" / "أقواس" / "زجاج"
- Grid يعرض thumbnails لكل template (14+28+25)
- Click → يفتح `nourwork-designer.html?template=arcs/arc_fason1`

**API calls:**
```js
// قائمة
fetch('/api/nourwork/templates').then(r => r.json())
// template كامل
fetch('/api/nourwork/templates/arcs/arc_fason1').then(r => r.json())
```

### TASK-NW02 — صفحة `nourwork-designer.html` (المحرر)
المتطلبات:
1. **Three.js** viewer في الوسط (canvas ~70% من الشاشة)
2. **Sidebar يسار:** قائمة القطع (points, profiles, areas) — جدول
3. **Sidebar يمين:** controls (width/height sliders + color picker)
4. **Bottom:** زر "احفظ" (POST `/api/nourwork/designs`)

### Three.js 3D Conversion Logic

من الـ 2D data في template → 3D model:

```javascript
// Pseudo-code
function templateTo3D(template) {
  const scene = new THREE.Scene();

  // 1. Points → Vector3 (z = 0 initial)
  const pts = template.points.map(p => new THREE.Vector3(p.x, p.y, 0));

  // 2. Profiles → extruded shapes
  //    - shape "T" → T-shaped cross-section
  //    - shape "L" → L-shaped
  //    - shape "Z" → Z-shaped
  //    - extrude between point1 → point2
  template.profiles.forEach(prof => {
    const shape = createProfileShape(prof.shape);  // T/L/Z
    const extrudePath = new THREE.LineCurve3(
      vec3(prof.point1), vec3(prof.point2)
    );
    const geom = new THREE.ExtrudeGeometry(shape, {
      extrudePath, steps: 20, bevelEnabled: false
    });
    scene.add(new THREE.Mesh(geom, aluminumMaterial));
  });

  // 3. Areas → transparent glass panels
  template.areas.forEach(area => {
    const glassGeom = new THREE.PlaneGeometry(
      distance(area.point1, area.point2),
      distance(area.point1, area.point3)
    );
    const glassMat = new THREE.MeshPhysicalMaterial({
      transparent: true, opacity: 0.3, ior: 1.5
    });
    scene.add(new THREE.Mesh(glassGeom, glassMat));
  });

  // 4. Frame → outer border
  // 5. circle (if arc) → curved top

  return scene;
}
```

### TASK-NW03 — dashboard integration
أضف tile "نور ورك" في `dashboard.html`:
- عدّاد التصميمات المحفوظة (من `/api/nourwork/designs`)
- Click → يفتح `/nourwork.html`

---

## ⚠️ تنبيهات مهمة

### 1. الـ textures
موجودين في `public/nourwork/textures/`:
- `alux_antrasit_texture.png` — أنثراسيت (رمادي غامق)
- `dub_mokko_texture.png` — جوز غامق
- `zolotoy_dub_texture.png` — بلوط ذهبي
- `shotlanka_gold.jpg` — ذهبي (للزخرفة)

استعملها كـ `THREE.TextureLoader().load('/nourwork/textures/XXX.png')`.

### 2. الـ 3D models (shotlanka = زخرفة)
موجودين في `public/nourwork/models3d/shotlankas/{small,medium,big}/*.obj`.
حمّلهم بـ `THREE.OBJLoader`.

### 3. الـ scale
Template coordinates بالـ mm (1500 mm = 1.5 m). قسّم على 1000 للـ Three.js scale.

### 4. المحاور
- x = horizontal
- y = vertical (up)
- z = depth (profile thickness ~70mm)

---

## 🎬 الخطوة التالية بعد ما تخلص الـ UI

### أنا (بعد ما ترفع)
1. أختبر صفحاتك على nourion_unified :3005
2. أرد بـ `shared/to_deploy/TEST-TASK-NW0X.md` (PASS/FAIL)
3. أبدأ على **ngrok path `/unified`** عشان محمود يختبر من الموبايل
4. أبدأ على **dashboard tile** لو بدك مساعدة

### اللي بعدها مشترك
- **استيراد مشاريع Ra الحقيقية** — نحوّل `Project.ProjectContext` XML → Romchi template
- **Export** — نحوّل تصميم Romchi → Ra XML format (يقدر يفتح في Ra.exe)

---

## 📊 ملخص الحالة

| Component | Status |
|---|---|
| SQL Docker (3 Ra DBs) | ✅ |
| `/api/ra/*` (6 endpoints) | ✅ |
| `/api/nourwork/*` (7 endpoints) | ✅ |
| Romchi templates (67) | ✅ |
| Romchi textures + 3D | ✅ |
| UI `nourwork.html` | ⏳ أنت |
| UI `nourwork-designer.html` | ⏳ أنت |
| UI `ra-workshop.html` | ⏳ أنت (من #19) |
| ngrok `/unified` | ⏳ أنا |
| scrypt auth | ⏳ أنا |

---

## 🚀 الهدف

محمود يفتح `https://aluminum-nour.ngrok.pro/unified/nourwork`:
- يشوف gallery للـ 67 template
- يختار واحد (مثلاً `doors/door_fason1`)
- يفتح المحرر → يعدّل الأبعاد → يشوف 3D live
- يحفظ → يصير `design-123` في قاعدة البيانات
- يقدر يبعته لـ Ra.exe (لاحقاً) للـ cut list

**ابدأ TASK-NW01 — الـ API جاهزة بالكامل.**

— حوبي

*نور ورك designer = المشروع الأساسي 🚀*
