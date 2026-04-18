# حوبي → عماد: ⚠️ تحديث أولويات من محمود

**التاريخ:** 2026-04-18
**أولوية:** 🔴 عاجل — غيّر ترتيب الشغل

---

## 📢 محمود أمر حرفياً (قبل 5 دقائق)

> "نور ورك اشتغلو عليها — ادمجو الـ ورك شوب بالبرنامج"
> "اشتغلوا على بلندر"
> "لما يخلص شغل افتح انت واختبر وفحاص وخلي يعدل اذا في شي ما زابط"

---

## 🎯 الأولويات الجديدة (نوقف الباقي حالياً)

### #1 — Ra Workshop integration (نور ورك) داخل UNIFIED
**يعني:** صفحة `/ra-workshop` أو `/nourwork` داخل nourion_unified فيها:
- قائمة مشاريع Ra (من RaProjects DB)
- تفاصيل كل مشروع (window design + dimensions + colors + materials)
- Cost breakdown من ConsumeItem
- Preview 3D (placeholder أولاً → Blender لاحقاً)

### #2 — Blender 3D integration
**يعني:** بناءً على `Project.ProjectContext` (XML في Ra DB):
- Python script يقرأ XML
- يولّد 3D model للنافذة/الباب
- Render → PNG/GIF
- يُعرض في `/ra-workshop/project/:id/preview`

### #3 — Testing/Review Loop
- **أنا (حوبي):** أفتح كل ملف ترفعه، أختبره في nourion_unified على :3005
- لو في مشكلة، أرد بـ `shared/to_deploy/ISSUE-TASK-NN.md`
- أنت تعدل وتدفع ثانية
- **لا يدفع لـ production** إلا بعد ما أوافق

---

## 🛑 التجميد المؤقت (لا تشتغل عليهم الآن)

- ❌ Customer Portal (لاحقاً)
- ❌ Site Readiness (لاحقاً)
- ❌ Shortages Kanban (لاحقاً)
- ❌ Investor Deck (لاحقاً)
- ❌ Landing/Pricing (لاحقاً)
- ❌ i18n توسعة (الموجود كافي الآن)

---

## 🔵 Phase 1 الجديدة — Ra Workshop UI (عليك أنت)

### TASK-R01 — صفحة `ra-workshop.html`
```
shared/to_deploy/public/ra-workshop.html
```
المحتوى:
- Header: "نور ورك — Ra Workshop"
- جدول المشاريع (columns: Code, Name, Customer, Status, Date)
- بحث + فلترة + pagination
- Click على مشروع → يفتح `ra-project.html?id=XXX`

### TASK-R02 — صفحة `ra-project.html`
```
shared/to_deploy/public/ra-project.html
```
المحتوى (4 tabs):
1. **المعلومات الأساسية:** Code, Customer, Site, Date, Currency, Total
2. **القطع (Components):** جدول فيه Component + ComponentMaterial
3. **التكاليف (Cost Breakdown):** من ConsumeItem (UnitPriceProduction vs UnitPriceSelling + هامش)
4. **المعاينة (Preview):** صورة أولية (placeholder حتى Blender يصير جاهز)

**APIs اللي رح أعملها لك أنا:**
- `GET /api/ra/projects` → قائمة
- `GET /api/ra/projects/:id` → تفاصيل + ProjectContext XML
- `GET /api/ra/projects/:id/cost-breakdown` → ConsumeItem
- `GET /api/ra/projects/:id/components` → Component + ComponentMaterial

### TASK-R03 — تعديل `dashboard.html`
أضف tile "نور ورك" يفتح `/ra-workshop.html`
الـ tile يعرض:
- عدد المشاريع الكلي
- عدد المشاريع الجديدة هالأسبوع
- أكبر مشروع (أعلى total)

### TASK-R04 — Blender preview placeholder
```
shared/to_deploy/public/ra-project.html (tab 4)
```
- صورة placeholder `/assets/3d-placeholder.png`
- زر "توليد 3D" → يعرض spinner "جاري التوليد..."
- API call: `POST /api/ra/projects/:id/render` (أنا بعمله لاحقاً)
- لما يرجع، يعرض الـ PNG المولّد

---

## 🔴 Phase 2 — Blender Integration (مشترك)

### عليّ (حوبي):
- TASK-B01: Docker image with Blender headless
- TASK-B02: Python script يقرأ ProjectContext XML → bpy model
- TASK-B03: API `POST /api/ra/projects/:id/render` → يشغّل Blender → يرجع PNG path
- TASK-B04: Caching (لا تعيد render لو ما تغير ProjectContext)

### عليك (عماد):
- TASK-B05: UI للـ Preview tab (عرض PNG + download + rotation controls)
- TASK-B06: Progress indicator (WebSocket أو polling)

---

## 🟢 Phase 3 — Testing

### كل صفحة ترفعها:
1. أنا أفتحها على `http://localhost:3005/XX.html`
2. أجرب navigation + API calls
3. أشوف errors في console
4. أرد بـ `shared/to_deploy/TEST-TASK-NN.md` (PASS/FAIL + تفاصيل)

### لو فشلت:
تعدل حسب ملاحظاتي وترفع نسخة جديدة → نعيد الاختبار.

---

## 🎬 اللي أبدأ عليه أنا الآن (بالتوازي)

1. **Docker SQL Server** على Linux (استيراد الـ 3 MDF databases)
2. **`/api/ra/*` endpoints** في server.js (4 endpoints أولاً)
3. **Docker Blender headless** (جاهز لاستقبال XML)

---

## ⏱️ الـ ETA

- **Phase 1** (Ra UI + APIs) = 4-6 ساعات مشترك
- **Phase 2** (Blender) = 8-12 ساعة مشترك
- **Phase 3** (Testing) = مستمر

**الهدف: نهاية الأسبوع محمود يفتح nourion_unified ويشوف مشروع Ra كامل مع 3D.**

---

## ✅ ابدأ الآن

1. اسحب (git pull) لتشوف هاي الرسالة
2. ابدأ TASK-R01 (صفحة ra-workshop.html)
3. ارفع لـ `shared/to_deploy/` كل ساعة

**لا توقف — حتى لو عندي APIs ناقصة، ارفع UI مع mock data وبعد ما تخلص بستبدل الـ fetches بالـ real APIs.**

— حوبي

*نور ورك + Blender = الأولوية الآن 🚀*
