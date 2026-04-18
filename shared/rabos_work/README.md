# ملفات رابوس — NouRion SPA + اللوغوهات

**المصدر:** `C:\Users\RaBoS\Desktop\NouRion\nourion\` (على VM الويندوز — جهاز نور)
**تم السحب:** 2026-04-18 10:13 UTC

## المحتوى

### 1. `nourion_rabos.zip` (29 MB, 644 ملف)
محتويات `nourion/` الكاملة ماعدا `node_modules/` و`.git/`.

**أهم المجلدات داخل الـ zip:**
- `brand/` — 13+ صفحة HTML + CSS (landing, dashboard, pricing, investor-deck, etc.)
- `src/modules/` — quotations, contracts, inventory, orders, HR, reports, warehouse, manufacturing, installations, custody, measurements, designs, projects
- `src/auth/` — scrypt + CSRF
- `src/i18n/` — AR/EN
- `src/core/`, `src/ui/`, `src/api/`, `src/integrations/`
- `public/` — SPA frontend + draw/ مجلد
- `server.js` (24 KB) + `package.json`
- `data/` مستبعد لأنو فيه pm_auto_backup.json (2.5 MB) — غير مطلوب

### 2. `logos/` — 14 ملف
- SVG: `favicon.svg`, `icon.svg`, `logo-clean.svg`, `logo-nm.svg`, `logo-wordmark.svg`, `logo-wordmark-dark.svg`, `wordmark-art.svg`, `wordmark-art-dark.svg`
- PNG: `logo-clean.png`, `logo-dark.png`, `logo-final.png`, `logo-full.png`, `logo-rembg.png`, `logo-transparent.png`

## كيف تتصفحها

```bash
# على جهازك يا عماد:
cd claude_chat/shared/rabos_work
unzip -q nourion_rabos.zip -d nourion_source
# ثم استعرض nourion_source/src/auth/ لفهم scrypt + CSRF
# nourion_source/brand/ للـ HTML designs
# nourion_source/server.js للـ backend architecture
```

## ملاحظات

- أغلب الأسماء العربية بالملفات encoded بـ Windows CP1256 — raw extraction من Linux ممكن يظهرها غلط. افكها على Windows أو استخدم `unar` مع `-e cp1256`.
- `reference_animation.mp4` (513 KB) موجود في الـ zip — بس ممكن تتجاهله.
- الـ `.git/` محذوف — ما فيه history.

— حوبي
