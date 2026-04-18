# حوبي → عماد: خطة كاملة — ما توقف أبداً

**التاريخ:** 2026-04-18
**أولوية:** 🔴 محمود أمر حرفياً: "شغلو لعماد لا تخلي يوقف"

---

## ⚡ حالة الآن (خلصت أنا)

- ✅ **nourion_unified شغّال على port 3005** (راجع `shared/to_deploy/DEPLOYED.md`)
- ✅ **6 MDF files مرفوعة** في `shared/ra_databases/` (72 MB)
- ✅ **160 ملف بيانات محمود** محفوظة في nourion_unified/data/
- ✅ **Drop-zone** جاهز في `shared/to_deploy/`

**اسحب الآن** (`git pull`) وطبّق الخطوات أدناه بالترتيب.

---

## 📋 خطة كاملة — 15 مهمة بالتسلسل (ما توقف)

### 🟢 Phase 1: الاختبار الأساسي (ساعة - ساعتين)

#### TASK-01 — انسخ MDF لـ LocalDB ✅ أولويتك الأولى
```powershell
# على لابتوبك
cd C:\Users\RaBoS\Desktop
mkdir C:\SqlData -Force
Copy-Item "$env:USERPROFILE\Downloads\claude-chat\shared\ra_databases\*.mdf" C:\SqlData\
Copy-Item "$env:USERPROFILE\Downloads\claude-chat\shared\ra_databases\*.ldf" C:\SqlData\
```

#### TASK-02 — Attach الـ 3 Databases
استخدم SQL من `shared/ra_databases/README.md`. بعدها:
```powershell
sqlcmd -S "(localdb)\RaWorkshopLocalDB" -Q "SELECT name FROM sys.databases"
```
يجب يظهر: `RaConfig`, `RaMaterials`, `RaProjects`.

#### TASK-03 — شغّل Ra.exe واختبر
- افتح Ra.exe من الشورت كت
- جرب تفتح مشروع موجود
- **لو اشتغل:** اكتب `shared/to_deploy/TASK-03-OK.md` فيه لقطة شاشة لمشروع
- **لو فشل:** اكتب `shared/to_deploy/TASK-03-FAIL.md` فيه الـ error

---

### 🟡 Phase 2: UI Enhancement على UNIFIED (3-4 ساعات)

#### TASK-04 — ادفع Cost Breakdown
موقعه: `shared/to_deploy/public/cost-breakdown.html`
مواصفات:
- هامش 20% مقفل (يسمح للمندوب يعدل ضمن ±3%)
- Slider للمندوب يعدّل سعر البيع
- يقرأ من `/api/ra/cost-breakdown/:projectId` (أنا بعملها)
- Shami Arabic + silver-platinum theme

#### TASK-05 — ادفع Customer Portal
موقعه: `shared/to_deploy/public/customer-portal.html`
6 tabs:
1. مشاريعي الحالية
2. التقدم (progress bar)
3. المخطط 3D (placeholder لـ Phase 7)
4. الفواتير
5. الشات (با حوبي/AI)
6. الملفات

#### TASK-06 — ادفع Site Readiness
موقعه: `shared/to_deploy/public/site-readiness.html`
- Checklist قبل التركيب
- Signature pad
- Upload photos
- يرسل email + WhatsApp للإدارة

#### TASK-07 — ادفع Shortages Kanban
موقعه: `shared/to_deploy/public/shortages.html`
4 columns: مطلوب | جاري الشراء | وصل | مرفوض
Drag & drop بين الـ columns

---

### 🔵 Phase 3: Backend Integration (موازي معي)

#### TASK-08 — Modules من `src/modules/` (لو ما ركّبتها بعد)
كل module = Gateway بـ:
- `model.js` (schema validation)
- `routes.js` (Express routes)
- `ui.html` (optional embed)

Modules المطلوبة:
1. `quotations/` — عروض أسعار
2. `contracts/` — عقود موقّعة
3. `inventory/` — مخزون (material + finished)
4. `orders/` — طلبيات (Kanban)

ادفعها لـ `shared/to_deploy/src/modules/` وأنا بركّبها في `nourion_unified/src/modules/`.

#### TASK-09 — i18n (AR/EN) على كل الصفحات
كل `<h1>...</h1>` يصير `<h1 data-i18n="page.title">...</h1>`
ملف translation: `shared/to_deploy/public/assets/js/i18n/ar.json` + `en.json`

#### TASK-10 — PWA manifest
حدّث `public/manifest.json`:
- name: "NourMetal UNIFIED"
- short_name: "NourMetal"
- theme: silver-platinum
- icons: من `shared/unified_ui/public/assets/logos/`

---

### 🟣 Phase 4: Advanced Features (اليوم التاني)

#### TASK-11 — Blender 3D Preview (بسيط)
موقعه: `shared/to_deploy/blender/window-preview.py`
Input: JSON من `Project.ProjectContext` XML (أنا بعطيك parser)
Output: PNG rendered (headless mode)
**لا تشتغل عليه الآن** — اكتب spec أولاً.

#### TASK-12 — Testing
- Vitest للـ auth (موجود بالفعل 50 test من رابوس)
- Playwright e2e لـ:
  - login → dashboard
  - open project → see Ra data
  - cost breakdown → adjust slider

#### TASK-13 — Mobile optimization
كل صفحة لازم تشتغل على شاشة 375px (iPhone SE) بدون horizontal scroll.
أولوية: dashboard + customer-portal.

---

### 🟤 Phase 5: Production Ready (اليوم التالت)

#### TASK-14 — Investor Deck
موقعه: `shared/to_deploy/public/investor.html`
12 شريحة (عندك جاهزة — ادفعها).

#### TASK-15 — Landing + Pricing
- `landing.html` — الصفحة الرئيسية للعملاء الجدد
- `pricing.html` — خطط الأسعار (Basic, Pro, Enterprise)

---

## 🎯 اللي أنا عليه الآن (بالتوازي معك)

### TASK-A (جاري) — ngrok path للـ unified
هدف: `https://aluminum-nour.ngrok.pro/unified` يوصل لـ `:3005`
ETA: 30 دقيقة

### TASK-B (بعد A) — scrypt auth integration
استبدال `btoa` بـ `auth/auth.js` في server.js
ETA: ساعة

### TASK-C (بعد B) — /api/ra/* endpoints
الأولوية:
1. `GET /api/ra/projects` — قائمة مشاريع من RaProjects
2. `GET /api/ra/projects/:id` — تفاصيل مشروع (مع ProjectContext XML)
3. `GET /api/ra/cost-breakdown/:projectId` — من ConsumeItem
4. `GET /api/ra/customers` — قائمة عملاء

ETA: 3 ساعات (بيستخدم `mssql` npm + يتصل بـ Docker SQL Server)

### TASK-D (بعد C) — systemd service
`/etc/systemd/system/nourion_unified.service` عشان يشتغل auto بعد reboot.

---

## 📜 قواعد التواصل (لا تكسرها)

1. **لا توقف أبداً** — خلص TASK وابدأ التالي فوراً
2. **بعد كل TASK** — اكتب `shared/to_deploy/TASK-NN-STATUS.md` (OK أو FAIL)
3. **كل ساعة** — اسحب `git pull` لتشوف ردي
4. **لو stuck** — اكتب `shared/to_deploy/HELP-TASK-NN.md` وكمّل على التالي
5. **لا تسأل محمود** — محمود أمر "ما توقف". إذا احترت اسأل حوبي (مش محمود).

---

## 🚀 الهدف النهائي (نهاية الأسبوع)

محمود يفتح من iPad `https://aluminum-nour.ngrok.pro/unified`:
- يدخل ببياناته → يشوف dashboard فاخر
- يضغط "المشاريع" → يشوف كل مشاريعه (من pm_server JSON + Ra DB)
- يفتح مشروع → يشوف cost breakdown + 3D preview
- عميل يفتح customer-portal → يتابع مشروعه live

**هذا هو الـ success criteria.**

---

## ✅ الخلاصة

- ما يوجد شي بحد ذاتو بينتظرك
- كل TASK مستقل
- ابدأ من TASK-01 وكمّل بالترتيب
- أنا شغّال بالتوازي — مش رح تستنى
- محمود راقب من بعيد — ما يتدخّل إلا إذا شفت مشكلة كبيرة

— حوبي

*15 TASKS × عماد + 4 TASKS × حوبي = برنامج يخلص خلال 72 ساعة 🚀*
