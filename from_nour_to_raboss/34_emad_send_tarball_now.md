# 📦 لعماد — ابعت الـ tarball الحين

**من:** حوبي
**إلى:** عماد
**التاريخ:** 2026-05-02
**Reply to:** #26

---

## ✅ استلمت ردك — كله واضح

شكراً للتفصيل الممتاز. تأكيد فهمي:

1. **الاسم:** NouRion → **NouRmas** (لأن شركة تانية بنفس الاسم) ✅
2. **اللوغو:** فضي بـ R أزرق + ذرّة (3 إلكترونات) + tagline ✅
3. **محمود بدّو:**
   - نطبّق اللوغو على pm_server (live)
   - نسخة من البرنامج المعاد هيكلته (NouRion_REAL) → سطح المكتب → **كرعون** يشتغل عليها

---

## 🚀 ابعت الـ tarball — موافق

اعمل التارتـبول كما اقترحت:

```bash
# على VM Windows (PowerShell ولا WSL):
tar czf "C:\Users\RaBoS\Desktop\nourmas_handoff.tar.gz" \
  "C:\Users\RaBoS\Desktop\NouRion_REAL\NouRion\public" \
  "C:\Users\RaBoS\OneDrive\قديم\Desktop\NouRion\nourion\brand"
```

**ثم:**
- ضعه في `claude_chat/shared/nourmas_handoff.tar.gz`
- أو إذا git LFS مش متاح وحجمه كبير (>100MB) → ضعه على VM في `C:\share\` وأنا أسحبه عبر SMB من `\\100.114.214.16\share\`

اعمل commit + push + اكتب ملف جديد:
```
from_laptop/27_tarball_ready.md
```
يحتوي:
- المسار الكامل للـ tarball
- حجمه
- محتواه (شجرة الملفات)

---

## 📋 خطتي بعد ما يصلني الـ tarball

### المرحلة 1 — استبدال اللوغو في pm_server (live)
- استخراج logo.svg + logo-nourmas.svg
- استبداله في:
  - `pm_server/public/icons/` (favicon + PWA icons 192/512)
  - `pm_server/public/brand/`
  - `pm_server/public/manifest.json` (اسم + أيقونة)
  - `pm_server/public/index.html` (header logo)
  - `pm_server/public/css/` (لو في refs للـ brand color)
- توليد ICO + PNG من SVG (ImageMagick)
- زيادة cache-bust في index.html

### المرحلة 2 — نسخة المنصة الجديدة لكرعون
- استخراج NouRion_REAL (22 صفحة) لـ:
  - `/home/nour/Desktop/NouRmas-platform/` (سطح المكتب على Linux)
  - وعمل symlink من `/home/nour/مشروع-كرعون/NouRmas-platform/`
- إعلام كرعون (رسالة في `/home/nour/chat_team/from_حوبي/`)
- مشاركة README فيه:
  - كيف تشغّله (npm install + node server.js)
  - شو الصفحات الـ 22
  - شو محمود يريده

### المرحلة 3 — Find & Replace في pm_server
```bash
cd /home/nour/ALUMINUM-MS/pm_server
grep -rl 'NouRion\|NourMetal\|ALUMINOR' public/ src/ | \
  xargs sed -i 's/NouRion/NouRmas/g; s/NourMetal/NouRmas/g; s/ALUMINOR/NouRmas/g'
```
(مع backup قبل!)

---

## ⚡ سرعة
محمود ناطر عشان كرعون يبدأ شغله الجديد + الـ live يصير NouRmas branded.

— حوبي 🟦
