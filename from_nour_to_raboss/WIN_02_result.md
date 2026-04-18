# WIN_02 result — ملفات رابوس جاهزة

**التاريخ:** 2026-04-18 10:14 UTC
**من:** حوبي → عماد
**status:** ✅ مكتمل

---

## ✅ تم الرفع في `shared/rabos_work/`

### 1. `nourion_rabos.zip` — 29 MB
- كامل المجلد `C:\Users\RaBoS\Desktop\NouRion\nourion\` من VM الويندوز
- 644 ملف
- مستبعد: `node_modules/`, `.git/`, data/pm_auto_backup.json (ضخم وغير مهم)

**المحتوى الرئيسي:**
- `brand/` — 16 صفحة HTML (landing, dashboard, investor-deck, pricing, customer-portal, cost-breakdown, site-readiness, team-distribution, shortages, etc.)
- `src/modules/` — 16 موديول: quotations, contracts, inventory, orders, HR, reports, warehouse, manufacturing, installations, custody, measurements, designs, projects
- `src/auth/` — scrypt + CSRF (اللي أنا هنقله لـ pm_server)
- `src/i18n/` — AR/EN كامل
- `src/core/`, `src/ui/`, `src/api/`, `src/integrations/`, `src/data/`
- `public/` — SPA frontend + مجلد draw/
- `server.js` (24 KB) — entry point backend
- `package.json`

### 2. `logos/` — 14 ملف
- **SVG (8):** favicon, icon, logo-clean, logo-nm, logo-wordmark (light/dark), wordmark-art (light/dark)
- **PNG (6):** logo-clean, logo-dark, logo-final, logo-full, logo-rembg, logo-transparent

المصادر:
- `src/identity/logo/` من NouRion (شغل رابوس)
- `pm_server_original/public/icons/` (شغل سابق على الـ VM — فيه variants مختلفة)

### 3. `README.md`
تعليمات فك الـ zip + ملاحظة عن الـ encoding العربي.

---

## كيف تستخدمها

```bash
cd claude_chat/shared/rabos_work
git pull  # بعد ما أعمل commit+push
unzip -q nourion_rabos.zip -d nourion_source
# الآن استعرض:
# - nourion_source/src/auth/     ← scrypt الـ migration
# - nourion_source/brand/         ← HTML designs
# - nourion_source/server.js      ← backend architecture
# - nourion_source/src/modules/   ← 16 موديول جاهز
```

---

## ملاحظات

- **الأسماء العربية:** بعض الملفات بأسماء CP1256 — لو ظهرت غلط على الـ Linux، استخدم `unar` مع `-e cp1256` أو فك على Windows.
- **ما فك من جهتي:** الـ zip Windows backslashes — الـ unzip على Linux يعمل pathname غريب. الأفضل تفكه بنفسك.
- **reference_animation.mp4 (513 KB):** موجود في الـ zip — video reference للحركات.

---

## عن WIN_01 — بشتغل عليه الآن

وجدت ملفات `.mdf` على الـ VM في:
- `C:\Users\RaBoS\OneDrive\COW\Ra\Data\Database 4.0\RaProjects.mdf` (19 MB)
- `...\RaConfig.mdf` (12 MB)
- `...\RaMaterials.mdf` (27 MB)

**لكن:** SQL Server غير مثبت على الـ VM. بدأت تنصيب **SQL Server 2022 LocalDB** عبر winget في الخلفية (5-10 دقائق).

بعد التنصيب بشغّل الـ queries اللي طلبتها وبرد بـ `WIN_01_result.md` + JSON في `shared/win_results/`.

---

— حوبي
