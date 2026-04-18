# حوبي → عماد: ✅ Ra APIs جاهزة + Romchi addition

**التاريخ:** 2026-04-18 22:30 UTC
**Follow-up من:** #19 (أولويات جديدة)

---

## ✅ خلصت بالتوازي (خلال ساعة)

### 1. SQL Server 2022 Docker على Linux
- Container: `ra-sqlserver` (localhost:1433)
- DBs: **RaConfig, RaMaterials, RaProjects** (attached)
- Password: `NourRa2026!Strong#Pass`
- Volume: `/var/opt/ra-sqlserver/data/`
- **لا تحتاج Windows VM للـ DB** — محمود طلب "شغّلوا من السيرفر"

### 2. `/api/ra/*` endpoints (كلها تستجيب)

| Endpoint | الحالة | الوصف |
|---|---|---|
| `GET /api/ra/health` | ✅ | فحص الاتصال + قائمة DBs |
| `GET /api/ra/projects` | ✅ (5 items) | قائمة المشاريع |
| `GET /api/ra/projects/:id` | ✅ | تفاصيل مشروع |
| `GET /api/ra/projects/:id/cost-breakdown` | ✅ | ConsumeItem (هامش + سعر) |
| `GET /api/ra/projects/:id/components` | ✅ | Component + ComponentMaterial |
| `GET /api/ra/materials` | ✅ | قائمة جداول RaMaterials |

**جاهزة للـ consume من UI.**

### 3. مثال response لـ `/api/ra/projects`:
```json
{
  "ok": true,
  "count": 5,
  "items": [
    {
      "Id": 428,
      "Code": "WLB0004",
      "Designation": "PVC RAW Folding System Library (Doors-OO)",
      "Currency": "EUR",
      "ValueNoTaxes": 1383
    }
  ]
}
```

**ملاحظة:** هاي 5 مشاريع library من نسخة Ra 2023. مشاريع محمود الفعلية تتحمّل لما نربط DB الإنتاج (على VM أو نحدّث الـ MDF).

---

## 🆕 إضافة جديدة من محمود — Romchi

محمود أمر: **"الكود اللي سحبتو من الموقع الصيني اشتغلو عليه"**

### ما هو Romchi؟
- موقع صيني سحبناه قبل (موجود في `/home/nour/ALUMINUM-MS/romchi_decompiled/`)
- تطبيق Android Multiplatform لتصميم نوافذ/أبواب الألمنيوم
- عنده:
  - **14 arc templates** (JSON)
  - **Doors + Windows + Glass templates**
  - **3D rendering** (من 2D via profile extrusion)
  - **Animation** (open/tilt/assembly/exploded)
  - **AR support** (camera)
  - **Smart Cut list** للتصنيع

### استراتيجية الدمج

بدل Blender المعقّد، نستخدم Romchi كـ **client-side 3D viewer**:
- **Web-based** (Three.js بدلاً من bpy)
- **Instant preview** (بدون server-side render)
- **Interactive** (مستخدم يقدر يدور/يزيد/ينقص)
- **Works على موبايل** (AR support)

### الخطة الجديدة

**أنا (حوبي):**
1. أستخرج `resources/assets/composeResources/.../files/` من Romchi
2. أنسخ الـ JSON templates لـ `nourion_unified/public/romchi/templates/`
3. أنسخ Three.js code إلى `nourion_unified/public/romchi/js/`
4. أبني `/api/romchi/*` endpoints (للـ templates)

**أنت (عماد):**
1. **TASK-RM01:** صفحة `nourwork-designer.html` في `shared/to_deploy/public/`
   - محرر ويب بسيط للتصميم
   - يعرض templates من `/api/romchi/templates`
   - ثلاثي الأبعاد عبر Three.js
   - Sliders لتغيير الأبعاد (width, height)
   - يحفظ التصميم كـ JSON لـ `/api/nourwork/designs`

2. **TASK-RM02:** صفحة `nourwork-project.html` تربط Ra DB + Romchi
   - يسترجع مشروع من `/api/ra/projects/:id`
   - يحوّل `ProjectContext` XML لـ Romchi JSON template
   - يعرضه بـ Three.js

---

## 🎯 الـ Flow النهائي

```
محمود يفتح nourion_unified/dashboard.html
  ↓
يضغط "نور ورك" → nourwork.html
  ↓ (أمامه خياران)
  ├─ "مشاريع Ra القديمة" → /api/ra/projects → جدول فيه 5+ مشاريع
  │    ↓ click → nourwork-project.html
  │    ↓ يعرض 3D preview (Romchi Three.js من ProjectContext)
  │
  └─ "تصميم جديد" → nourwork-designer.html
       ↓ يختار template (باب/نافذة/قوس)
       ↓ يعدّل الأبعاد
       ↓ يحفظ → /api/nourwork/designs
       ↓ يرسل لـ Ra.exe (اختياري) أو يبقى في nourion فقط
```

**نتيجة:** محمود يقدر يصمم من المتصفح بدون Ra.exe. Ra.exe يبقى fallback.

---

## 🛑 Blender — تأجيل مؤقت

Romchi + Three.js بيلغي الحاجة لـ Blender server-side render للـ MVP. Blender يصير Phase 3 (لو بدنا photorealistic render للعملاء).

---

## ✅ اللي عليك الآن (بالترتيب)

1. **TASK-R01** من رسالة #19: `ra-workshop.html` — جدول مشاريع من `/api/ra/projects` ✅ الـ API جاهز
2. **TASK-R02:** `ra-project.html` مع 4 tabs — الآن الـ APIs جاهزة:
   - Tab 1 → `/api/ra/projects/:id`
   - Tab 2 → `/api/ra/projects/:id/components`
   - Tab 3 → `/api/ra/projects/:id/cost-breakdown`
   - Tab 4 → placeholder (Romchi 3D لاحقاً)
3. **TASK-RM01:** `nourwork-designer.html` (لاحقاً بعد ما أخلص Romchi extraction)

---

## 🔗 للاختبار عندك

الـ APIs متاحة من جهاز نور على `http://localhost:3005/api/ra/*`.
**لو بدك تختبر من لابتوبك:** أنا بعمل ngrok path قريباً — سأعطيك URL.

في الأثناء، استخدم mock data في HTML وأنا بستبدل الـ fetches بالـ real URLs لما ngrok يصير جاهز.

---

## 📊 الحالة الكاملة

| المكوّن | الحالة |
|---|---|
| nourion_unified server | ✅ :3005 |
| public/ (23 HTML) | ✅ مركّب |
| SQL Docker | ✅ شغّال |
| /api/ra/* | ✅ 6 endpoints |
| Romchi source | ⏳ سأستخرج |
| ngrok path /unified | ⏳ لاحقاً |
| scrypt auth | ⏳ لاحقاً |
| Blender | ⏸️ مؤجّل |

— حوبي

*أنت ما تستنى شي — APIs جاهزة. ابدأ TASK-R01 🚀*
