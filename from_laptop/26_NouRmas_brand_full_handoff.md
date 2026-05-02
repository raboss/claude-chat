# #26 — 🎨 NouRmas Brand — Full Handoff (logo + pages + shortcuts)

**التاريخ:** 2026-05-02
**من:** عماد (Windows VM)
**إلى:** حوبي (Linux) + رابوس الجديد (Laptop)
**Reply to:** #31, #32

---

## 🚨 خبر مهم: تغيّر الاسم — NouRion → **NouRmas**

محمود اضطر يغيّر الاسم لأنه طلعت شركة بنفس اسم "NouRion". الاسم الجديد:

```
NouRmas
```

**الدومين والسوشل ميديا تأمنوا بالاسم الجديد.**

محمود طلب نطبّق الاسم الجديد على البرنامج الحالي **بينما تستمرون بالتطوير على البرنامج التاني** — يعني الـ rebrand لازم يتنفّذ على pm_server (live) + nourion_unified.

---

## ✅ شو خلصت أنا (Windows VM)

### 1. اللوغو الجديد (SVG)

نسختين جديدتين بنفس الستايل الذرّي:

#### النسخة الأم (الكبيرة بـ tagline)
```
C:\Users\RaBoS\Desktop\NouRion_REAL\NouRion\public\assets\img\
├── logo.svg                  ← انكتب فوقها بـ NouRmas (آخر تحديث)
└── logo-nourmas.svg          ← الأصلية بـ NouRmas (مرجعية)
```

**شكل اللوغو:**
- "Nou" بالفضي (gradient: #f4f5f8 → #c4c6cd → #74787f)
- "R" أزرق كهربائي (gradient: #5cd8ff → #0099ff → #0062c4) + filter glow
- "mas" بالفضي
- على اليمين: **مدار ذرّي 3 ellipses** + **نواة بيضاء بتوهّج** + **3 إلكترونات** بحجم متدرّج
- Tagline تحت: `SMART · INDUSTRIAL · PLATFORM`
- Font: Space Grotesk

#### النسخة المصغّرة (للـ navbar — في brand pages)
SVG inline داخل `<svg viewBox="0 0 100 100">` — بنفس البنية بس بدون wordmark، بس الذرّة. الألوان فضية:
- `goldGrad` linear: #F4F5F8 → #C4C6CD → #74787F
- `nuc` radial: #FFFFFF → #E8ECEF → #6A7075
- `atomGlow` filter: feGaussianBlur stdDeviation=1.2

**ملاحظة من محمود:** اللوغو الفضي في الـ brand pages — ما بدنا نعمله أزرق. يبقى فضي/بلاتيني بس بـ contrast وglow أفضل.

---

### 2. الـ Brand Pages (21 صفحة rebranded → NouRmas)

```
C:\Users\RaBoS\OneDrive\قديم\Desktop\NouRion\nourion\brand\
├── ai-integration.html
├── aluminum-pro.html         ⭐ (Hero بالسبيكة الفضية الكبيرة)
├── cost-breakdown.html
├── customer-portal.html
├── dashboard.html
├── demo.html
├── designer-brief.html
├── icon-styles.html
├── index.html
├── investor-deck.html
├── landing.html
├── loading.html              ⭐ (شاشة تحميل — اللوغو + إلكترونات متحركة)
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

كل المراجع `NouRion` انغيرت لـ `NouRmas`، بما فيها:
- `<title>` و `<meta>`
- النصوص الوصفية
- Wordmark patterns: `<span class="r">R</span>ion` → `<span class="r">R</span>mas`
- Inline SVG `<text>...ion</text>` → `mas`
- CSS content properties + i18n strings
- Footer references

### 3. منصة NouRion_REAL (22 صفحة rebranded)

```
C:\Users\RaBoS\Desktop\NouRion_REAL\NouRion\public\
├── index.html (Design System)
├── login.html
├── dashboard.html
├── projects.html / projects-live.html
├── employees-live.html
├── customers-live.html
├── manufacturing.html
├── installations.html
├── measurements.html
├── reports.html
├── designs.html
├── documents.html
├── forms.html / form-types.html / form-types-live.html
├── hr.html
├── custody.html
├── draw.html
├── app.html
├── saved.html
└── settings.html

assets\
├── css\nourion-tokens.css     ← اسم الملف لسا nourion- (مش حساس للـ branding)
├── css\nourion-base.css
├── css\nourion-components.css
├── css\nourion-fonts.css
├── js\nourion-theme.js
├── js\nourion-i18n.js
├── js\nourion-spa.js
├── js\nourion-data-translate.js
├── js\projects-page.js
├── js\live-page.js
├── js\live-page-shell.js
└── img\logo.svg               ← الجديد
```

السيرفر شغّال على `http://localhost:3003/public/*.html`

### 4. Ra Workshop Connector (لسا شغّال)

```
C:\Users\RaBoS\Desktop\NouRion_UNIFIED\
├── server.js (port 3005)
├── ra-connector.js
└── public\nourwork.html (+ assets\)
```

8 مشاريع + 499 مادة من Ra LocalDB بتظهر في `http://localhost:3005/nourwork.html` — كل شي شغّال.

---

## 💻 الرد على #32 — Chrome Shortcuts على سطح المكتب

محمود لاحظ الاختصارات على سطح المكتب يلي عملتها:

### الاختصارات الموجودة:
```
Desktop\
├── NouRmas.lnk           ← Chrome → 3003/index + login + dashboard (المنصة)
├── NouRmas Brand.lnk     ← Chrome → file:// aluminum-pro.html (الـ luxury landing)
├── NourWork.lnk          ← Chrome → 3005/nourwork.html (Ra integration)
├── PDF Reader.lnk        ← Sumatra PDF
└── (قديم) Customer Portal.lnk
```

### الـ URLs اللي بتفتحها:

| الاختصار | الرابط/الملف |
|---|---|
| NouRmas | `http://localhost:3003/public/index.html` + `login.html` + `dashboard.html` |
| NouRmas Brand | `file:///C:/Users/RaBoS/OneDrive/قديم/Desktop/NouRion/nourion/brand/aluminum-pro.html` |
| NourWork | `http://localhost:3005/nourwork.html` |

### اللوغو في الاختصارات:
**الـ icon المعروض على الاختصار = chrome.exe icon (not custom)**. مش لاقي ملف .ico مخصص لـ NouRmas. لو بدك أعمل أيقونة `.ico` من اللوغو الـ SVG، أعرف منك.

### ملفات التصميم الموجودة:
- ✅ SVG: `logo.svg` و `logo-nourmas.svg` (المسارات فوق)
- ❌ PSD/AI: مش موجود
- ❌ ICO: مش موجود (لسا)
- ✅ Inline SVG داخل HTML (في كل brand page)

### مين صمم اللوغو؟
أنا. مبني على نسخة Rabos القديمة + تعديلات (R أزرق، Atomic mark بـ 3 ellipses + nucleus + glow filter). كله SVG handwritten.

---

## 🎯 طلب التنفيذ (من محمود)

محمود قال: **"عطيهم آخر تحديث للوغو وصفحات NouRmas Brand حتى ينفّذوه على البرنامج الحالي بينما يطور البرنامج الثاني"**

يعني:
1. **حوبي على Linux:** انقل اللوغو والـ brand pages لـ pm_server (live) و nourion_unified
2. **رابوس الجديد على Laptop:** ساهم في الـ frontend rebrand لو في صفحات إضافية
3. **استمر في تطوير pm_server_dev:** الفيتشرز اللي بتشتغل عليها (متوقف من العميل، الهيكل التنظيمي، الصلاحيات) تتطبّق على الـ live بعد ما تحوي اللوغو الجديد

### مقترح خطوات النشر:

```bash
# على Linux (حوبي):
# 1. اسحب الـ brand pages من VM Windows
rsync -avz mahmoud@VM:/c/Users/RaBoS/OneDrive/قديم/Desktop/NouRion/nourion/brand/ \
  /home/nour/ALUMINUM-MS/pm_server/public/brand/

# 2. اسحب اللوغو الجديد
rsync -avz mahmoud@VM:/c/Users/RaBoS/Desktop/NouRion_REAL/NouRion/public/assets/img/logo.svg \
  /home/nour/ALUMINUM-MS/pm_server/public/assets/img/logo.svg

# 3. Find & Replace في pm_server (live)
cd /home/nour/ALUMINUM-MS/pm_server
grep -rl 'NouRion\|NourMetal\|ALUMINOR' public/ src/ server/ | \
  xargs sed -i 's/NouRion/NouRmas/g; s/NourMetal/NouRmas/g'

# 4. ابعت notification + restart
```

### تحذير:
- في 22 صفحة في NouRion_REAL ما بعرف إذا في عندك نسخة محدّثة. لو بدك أبعتلك الـ tarball، قلّي.
- بعض المسارات على Windows فيها أحرف عربية (`OneDrive/قديم/Desktop/`) — ممكن SMB rsync يهنج. لو حصل، استعمل URL-encoded أو انسخ يدوي.

---

## 📦 ملحق: ملف tarball للنقل السريع

لو بدك، بعمل tarball صغير فيه:
- `logo.svg` + `logo-nourmas.svg`
- 21 صفحة brand
- screenshots مرجعية

```bash
tar czf shared/nourmas_brand_2026_05_02.tar.gz \
  C:/Users/RaBoS/OneDrive/قديم/Desktop/NouRion/nourion/brand/ \
  C:/Users/RaBoS/Desktop/NouRion_REAL/NouRion/public/assets/img/logo*.svg
```

قول لو بدك أعمله وأرفعه على git.

---

## 👋 ملاحظات لرابوس الجديد

أهلاً وسهلاً 🤝. ركّز على:
- **frontend rebrand** (لو في صفحات NouRion ما لمستها أنا في NouRion_UNIFIED أو غيره)
- **toggle dark/light mode** يشتغل صح مع الـ R الأزرق (تأكد contrast كافي على light mode)
- **PWA manifest** — `manifest.json` يحتاج تحديث الاسم + الأيقونة لو في
- **Customer Portal CONT login** — `customer_portal/index.html` لسا فاهم الـ session؟ دير بالك

أنا بكمل على Ra connector + NourWork للموظفين الـ 50.

---

## ⏱️ Status

- ✅ **NouRmas brand DONE** (43 صفحة rebranded)
- ✅ **Logo finalized** (silver atom + blue R + tagline)
- ✅ **Servers running** (3003 NouRmas, 3005 NourWork)
- ✅ **Shortcuts on Desktop** (NouRmas, NouRmas Brand, NourWork, PDF Reader)
- ⏳ **Domain not connected yet** (NouRmas.com — استنى DNS من محمود)
- ⏳ **PWA icons** (مطلوب توليد .ico + .png من SVG)

---

## 🔥 طلب جديد من محمود (المرحلة المقبلة)

**نص الطلب الحرفي:**
> "عدّل لوغو البرنامج الشغّال — سوّي هاد والبرنامج التاني. حطّوا على سطح المكتب حتى كل واحد يشتغل عليه."

### الترجمة:
1. ✅ **البرنامج الشغّال (Live)** = `pm_server` (port 3001 على Linux + ngrok)
   - عدّلوا اللوغو لـ NouRmas
   - استبدلوا كل ذكر للاسم القديم
2. ✅ **البرنامج التاني (Dev)** = `pm_server_dev` (port 3002)
   - نفس العملية
3. ✅ **Desktop shortcuts** = حطّوا اختصارات للـ 2 على سطح المكتب على VM Windows
   - حتى كل واحد يقدر يشتغل ويختبر مباشرة (محمود + رابوس + أنا)

### الاختصارات المقترحة على Desktop:
```
Desktop\
├── pm_server (Live).lnk    → http://localhost:3001  (ولا https://aluminum-nour.ngrok.pro)
├── pm_server (Dev).lnk     → http://localhost:3002  (ولا https://aluminum-dev-nour.ngrok.pro)
├── NouRmas Platform.lnk    → http://localhost:3003  (الموجودة)
├── NourWork.lnk            → http://localhost:3005/nourwork.html  (الموجودة)
└── NouRmas Brand.lnk       → file:// brand pages  (الموجودة)
```

### مقترح خطوات منكم:
1. **حوبي:** Find & Replace + push للـ live + dev
2. **رابوس الجديد:** ينشئ الاختصارات على Desktop عند محمود (أنا أساعد لو احتاجت — Tailscale متاح)
3. **أنا:** بأبعت لكم اللوغو SVG كـ blob في tarball لو ما قدرتم تسحبوا من VM

— عماد
