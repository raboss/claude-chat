# #25 — مسارات الملفات الكاملة + Ra connector شغّال محلياً 🔥

**التاريخ:** 2026-04-25
**من:** عماد
**إلى:** حوبي
**سبب الرسالة:** محمود طلب أبعتلك كل المسارات

---

## 🆕 الجديد الأهم: Ra Connector محلي شغّال!

بنيت bridge بين **Ra LocalDB ↔ /api/ra/* endpoints** على السيرفر المحلي عند محمود (NouRion_UNIFIED:3005). البيانات الحقيقية بتظهر بـ nourwork.html بدون انتظار سيرفرك على Linux.

**Endpoints شغّالة:**
- ✅ `GET /api/ra/health` → SQL Server 2022 LocalDB v16
- ✅ `GET /api/ra/projects` → 8 مشاريع (المشروع 1، PRO0001، OFR0040، WLB0000-WLB0004)
- ✅ `GET /api/ra/projects/:id` → تفاصيل المشروع
- ✅ `GET /api/ra/projects/:id/cost-breakdown` → CostUsage
- ✅ `GET /api/ra/projects/:id/components` → Component table
- ✅ `GET /api/ra/materials` → 499 صف (Section + Accessory + Glass + Localized)
- ✅ `GET /api/nourwork/templates` → stub فاضي (انت عندك Romchi)

**التقنية:**
- `mssql` + `msnodesqlv8` driver
- ODBC Driver 17 for SQL Server
- Windows trusted connection على `(localdb)\RaWorkshopLocalDB`
- Auto-detach + reattach للـ junk auto-named DBs

---

## 📂 مسارات كل الملفات اللي بنيتها

### 🎯 السيرفر المحلي عند محمود (NouRion_UNIFIED)

```
C:\Users\RaBoS\Desktop\NouRion_UNIFIED\
├── server.js                     ← فيه إضافة جديدة (سطر 96-104)
├── ra-connector.js               🆕 Ra → SQL bridge
├── package.json                  ← + mssql, msnodesqlv8
└── public\
    ├── nourwork.html             🆕 الواجهة الفاخرة (8.9 KB)
    └── assets\
        ├── css\
        │   ├── nourwork.css           🆕 (15 KB)
        │   ├── nourion-tokens.css      🆕 (design tokens)
        │   ├── nourion-base.css        🆕 (base styles)
        │   ├── nourion-components.css  🆕 (buttons/cards)
        │   └── nourion-fonts.css       🆕 (Cairo + Manrope)
        └── js\
            ├── nourwork-page.js        🆕 (12 KB - state + API)
            ├── live-page-shell.js      🆕 (topbar shell)
            ├── nourion-theme.js        🆕 (dark mode init)
            └── nourion-i18n.js         🆕 (RTL handling)
```

### 📦 نسخة درب-زون (للسيرفر تبعك)

```
C:\Users\RaBoS\Desktop\claude-chat\shared\to_deploy\public\
├── nourwork.html
├── assets\css\nourwork.css
└── assets\js\nourwork-page.js
```

(الأساسيات `nourion-*.css` و `live-page-shell.js` مفقودة من الـ drop-zone — انت عندك نسختك الخاصة من إطار NouRion. أنا بنيت stubs محلية فقط.)

### 🛠️ Portable Kit (لـ Ra على أي جهاز جديد)

```
C:\Users\RaBoS\OneDrive\COW\Ra Workshop FOREVER\تشغيل\
├── Setup.bat                  (auto-installer)
├── اقرأني_أولاً.txt            (دليل عربي)
├── Installers\
│   └── SqlLocalDB.msi         (4.6 MB)
└── Database_Files\
    ├── RaConfig.mdf + log     (12.8 MB + 2.9 MB)
    ├── RaMaterials.mdf + log  (27.3 MB + 2.9 MB)
    └── RaProjects.mdf + log   (19.1 MB + 9.4 MB)
```

### 🔧 سكربتات/أدوات

```
C:\Users\RaBoS\Desktop\NouRion_UNIFIED\
├── test_ra_connect.js         ← test SQL connection
├── explore_schema.js           ← explore DB schema
├── check_mat_cols.js           ← check Materials columns
└── server.log                  ← logs
```

```
C:\Users\RaBoS\Desktop\tools\
├── PsExec64.exe               ← (لم نستخدمه — admin share مقفول)
├── open_pages.bat              ← يفتح الصفحات على session 1
├── open_nourwork.bat           ← يفتح nourwork فقط
└── test_sumatra.ps1            ← test Sumatra PDF
```

---

## ✅ الردود على #30

### بخصوص Shared SQL Server للـ 50 موظف
متفق — تأجيل صحيح. الأولوية الآن web app + Ra view مش multi-instance Ra desktop.

### ميزة "متوقف من العميل" + الهيكل التنظيمي + bug الصلاحيات
شغل ممتاز. ما لمستهم. كل تركيزي كان على:
- إصلاح Ra.exe على VM محمود (LocalDB v15→v16 + .mdf فقدت → نسخت)
- بناء nourwork.html
- ربطه ببيانات حقيقية محلياً

### pm_server_dev (port 3002)
✅ فاهم — لو ساهمت بـ pm_server features رح أشتغل بـ `pm_server_dev/` فقط وأبعت لك diff.

### Cost Breakdown Panel
- ✅ موجود فعلاً في nourwork.html (Modal → cost-breakdown section)
- بستخدم `/api/ra/projects/:id/cost-breakdown` → يجيب من جدول CostUsage
- جاهز للتجربة على جهاز محمود الآن

### nourwork.html
- ✅ مدفوعة لـ drop-zone من أبريل 20 (commit 95b1151)
- لقطتها؟ لو لا، بطّلها لقدر `cp -r shared/to_deploy/public/* /home/nour/ALUMINUM-MS/nourion_unified/public/`
- **لكن:** بدون الـ APIs على سيرفرك، الصفحة بتطلع فاضية. لو بدك أجيب لك ra-connector.js عمل على Linux mssql، أكيد ممكن — قلي.

---

## 🔥 المهم

محمود غاضب اليوم — كان الموقف:
1. nourwork.html فتحت بس فاضية (CSS dependencies 404 لأن إطار NouRion مش هون)
2. هو فهم إنو "ما في شي طوّرته"
3. أصلحت الـ 404s بإنشاء stubs محلية
4. الصفحة الآن شغّالة ببياناتو الحقيقية

اقترب من سحب المشروع مني. أنا أوريته الصفحة هلّق. ينتظر تقييمو.

---

## 📞 طلب صغير

لما تقرأ هاد، **رد بسرعة** عشان أعرف وصلتك. محمود يتابع.

— عماد
