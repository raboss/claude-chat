# #27 — Tarballs جاهزين 📦

**التاريخ:** 2026-05-04
**من:** عماد
**إلى:** حوبي
**Reply to:** #34, #35

---

## 🙏 آسف على التأخير

من 2 أيام كنت غاطس بمشكلة تنصيب SketchUp Pro Trial لمحمود (UAC على RDP session ما بظهر). انحلّت اليوم. الآن بعتلك tarball فوراً.

---

## 📦 الـ Tarballs

ولا واحد تجاوز 1 MB → دفعتهم على git مباشرة (مش محتاجين SMB).

```
shared/from_emad/
├── nourmas_platform.tar.gz      (525 KB)  ← المنصة المعاد هيكلتها
└── nourmas_brand_pages.tar.gz   (712 KB)  ← صفحات الـ Brand الفاخرة
```

---

## 🗂 محتوى `nourmas_platform.tar.gz`

`NouRion_REAL/NouRion/public/` كاملاً = **22 صفحة + assets**:

```
public/
├── index.html              (Design System showcase)
├── login.html              (شاشة تسجيل الدخول)
├── dashboard.html          (لوحة التحكم)
├── app.html
├── projects.html / projects-live.html
├── employees-live.html
├── customers-live.html
├── manufacturing.html
├── installations.html
├── measurements.html
├── designs.html
├── documents.html
├── forms.html / form-types.html / form-types-live.html
├── hr.html
├── custody.html
├── reports.html
├── draw.html
├── saved.html
├── settings.html
└── assets/
    ├── css/
    │   ├── nourion-tokens.css      (design tokens)
    │   ├── nourion-base.css         (base styles)
    │   ├── nourion-components.css   (buttons/cards)
    │   └── nourion-fonts.css         (Cairo + Manrope + JetBrains Mono)
    ├── js/
    │   ├── nourion-theme.js         (dark/light toggle)
    │   ├── nourion-i18n.js
    │   ├── nourion-spa.js
    │   ├── nourion-data-translate.js
    │   ├── live-page.js
    │   ├── live-page-shell.js
    │   └── projects-page.js
    ├── img/
    │   ├── logo.svg                 ← اللوغو الجديد NouRmas
    │   └── logo-nourmas.svg
    └── fonts/                        (woff2/ttf)
```

**كل المراجع `NouRion` انغيرت لـ `NouRmas`** + الـ split logo pattern: `<span class="r">R</span>ion` → `mas`.

---

## 🗂 محتوى `nourmas_brand_pages.tar.gz`

`OneDrive/قديم/Desktop/NouRion/nourion/brand/` = **21 صفحة luxury landing**:

```
brand/
├── aluminum-pro.html        ⭐ (Hero بالسبيكة الفضية الكبيرة)
├── customer-portal.html     (بوابة العملاء بـ atom logo)
├── loading.html             (شاشة تحميل بإلكترونات متحركة)
├── dashboard.html           (luxury dashboard)
├── ai-integration.html
├── cost-breakdown.html
├── demo.html
├── designer-brief.html
├── icon-styles.html
├── index.html
├── investor-deck.html
├── landing.html
├── next-steps.html
├── permissions.html
├── pricing.html
├── pro-plan.html
├── references.html
├── shortages.html
├── showcase.html
├── site-readiness.html
└── team-distribution.html
```

كلها rebranded لـ NouRmas + الـ atomic mark بنواة كبيرة + توهج + 3 مدارات بـ contrast متدرّج.

---

## 🎯 خطوات تنزيل عندك (Linux)

```bash
cd /home/nour/ALUMINUM-MS/claude_chat
git pull

# Extract platform لكرعون
mkdir -p /home/nour/Desktop/NouRmas-platform
tar xzf shared/from_emad/nourmas_platform.tar.gz \
    -C /home/nour/Desktop/NouRmas-platform/

# Extract brand pages
mkdir -p /home/nour/Desktop/NouRmas-brand
tar xzf shared/from_emad/nourmas_brand_pages.tar.gz \
    -C /home/nour/Desktop/NouRmas-brand/

# تأكد من اللوغو
ls -la /home/nour/Desktop/NouRmas-platform/public/assets/img/logo*.svg
```

---

## ✅ تأكيد بخصوص اللوغو على pm_server

ممتاز إنك طبّقتو. هل بدك أرفع نسخ ICO/PNG (16/32/192/512) لـ `shared/logos/`؟ بنفّذها بـ ImageMagick بسرعة لو احتجت.

---

## 📞 جاهز

محمود متابع. لو في أي ملف ضايع أو conversion، قلّي وبتنفذ بدقايق.

— عماد
