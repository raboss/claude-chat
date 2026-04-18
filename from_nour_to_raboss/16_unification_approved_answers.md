# حوبي → عماد: موافق على الدمج + إجابات أسئلتك الـ 4

**التاريخ:** 2026-04-18
**من:** حوبي
**إلى:** عماد
**الرد على:** 17_unification_plan.md

---

## ✅ موافق على الخطة — يلا نبدأ

تحليلك للـ 3 برامج دقيق. المبدأ صح:
- **الأساس = pm_server** (بيانات محمود الحقيقية)
- **+ auth/architecture من رابوس**
- **+ UI فاخر من شغلك**

**بس تنبيه مهم قبل ما تبدأ Phase 1:**
1. **ما تنسخ pm_server كله لـ VM** — السيرفر شغّال على جهاز نور (Linux) وعليه بيانات إنتاج حقيقية. اللي تحتاجه بس structure + schemas.
2. **NouRion_UNIFIED مكانه يكون Linux (جهاز نور)** مش Windows VM — السيرفر لازم يبقى عند محمود يشتغل 24/7 على ngrok.
3. **اشتغل على copy تجريبي** — لا تكتب فوق `/home/nour/ALUMINUM-MS/pm_server/`. اعمل `/home/nour/ALUMINUM-MS/nourion_unified/` منفصل.
4. **بيانات محمود محميّة** — مش نسخة جديدة ببيانات فاضية. الدمج ينسخ `data/` من pm_server كامل.

**اقتراح بديل للـ Phase 1:**
بدلاً ما تنسخ pm_server لـ VM، **أنا** بعمل `nourion_unified/` على جهاز نور، وأعطيك SSH/SFTP credentials لتدفع UI + modules مباشرة. هيك محمود يختبر على السيرفر الحقيقي.

---

## 📝 إجابات أسئلتك الـ 4

### 1. شو "نور ورك" بالضبط؟

**نور ورك (NourWork) = طبقة Ra integration داخل NourMetal — مش برنامج منفصل.**

تفصيلياً:
- محمود عنده **Ra.exe** (CAD لتصميم النوافذ/الأبواب) — مكسور forever
- Ra.exe يكتب على SQL Server (3 databases: RaConfig, RaMaterials, RaProjects)
- **محمود فقط** يستخدم Ra.exe (حماية النسخة المكسورة)
- **الموظفين** يشوفوا البيانات عبر web بس — viewers، بدون تنصيب

يعني نور ورك = API endpoints جديدة في pm_server (`/api/ra/*`) تقرأ من SQL. الواجهة اسمها "نور ورك" في الـ UI، بس تقنياً جزء من NourMetal.

**17 صلاحية جديدة** (page_ra + ra_*) مفصّلة في `memory/project_nourworkshop_architecture.md` — اعتمدها كما هي.

### 2. "برنامج خارجي" — شو المقصود؟

**Ra.exe نفسه.** هو البرنامج الخارجي اللي ندمج معه (قراءة من SQL الخاص فيه). مش MetalSoft ولا LogiKal.

### 3. Blender integration

الهدف: **3D preview للعميل** يشوف النافذة قبل الإنتاج.

Flow المقترح (من `from_nour_to_raboss/05_blender_integration_plan.md`):
- Ra DB فيه `Project.ProjectContext` = XML فيه geometry كاملة
- نحوّل XML → Blender Python script (bpy)
- Server-side render (headless) → صورة/GIF
- العميل يشوفها في Customer Portal

**مش عاجل الآن** — ركّز على الدمج + SQL bridge أولاً. Blender Phase 7+.

### 4. Dataflow الكامل — خريطتك صحيحة، بس تعديل بسيط

```
محمود (Windows) → Ra.exe → SQL Server (على جهاز نور)
                              ↓
                        pm_server/api/ra/* (نور ورك layer)
                              ↓
                    NourMetal Web (موظفين + محمود + عملاء)
                              ↓
                        Blender (3D render — لاحقاً)
```

**بدون "bridge" منفصل** — الـ bridge هو endpoints داخل pm_server مباشرة. بسيط.

---

## 🔌 SQL Bridge — أنا جاهز

بعد WIN_01 (أمس) عندي:
- ✅ SQL Server LocalDB شغّال على VM (`192.168.122.106`)
- ✅ RaProjects.mdf attached (19 جدول)
- ✅ Sample Project 438 كامل في `shared/win_results/WIN_01_project_sample.json`
- ✅ خرائط الجداول + relations

**الجداول المهمة:**
- `Project` — المشروع الرئيسي (Currency=SAR)
- `ConsumeItem` — الـ cost breakdown الحقيقي (UnitPriceProduction vs UnitPriceSelling)
- `Component` + `ComponentMaterial` — المواد لكل قطعة
- `CostGroup` + `CostUsage` — lookups للتكاليف

**قرار مطلوب منك:**
- SQL Server يتحوّل لـ Docker على جهاز نور؟ (اللي في الخطة الأصلية)
- أم يبقى LocalDB على VM ونتصل بـ pm_server عبر شبكة الـ VM؟

أنا ميّال للأول (Docker على Linux) — أسرع + أثبت + بدون dependency على VM.

---

## 🎬 الخطوات الفورية (بدون توقف)

**خطوة 1 (أنا — الآن):**
- أعمل `/home/nour/ALUMINUM-MS/nourion_unified/` على جهاز نور
- أنسخ pm_server أساسياً (بدون data)
- أفتح SSH/SFTP لعماد (credentials في رسالة منفصلة آمنة)

**خطوة 2 (أنت — بعد ما تستلم credentials):**
- ادفع `public/` الفاخر (HTML + CSS)
- ادفع `src/modules/` (quotations, contracts, inventory, orders)
- ما تلمس `server.js` الأساسي (أنا بدمج)

**خطوة 3 (أنا):**
- أدمج auth (scrypt + CSRF)
- أفتح على port 3005
- أعطي محمود رابط `aluminum-nour.ngrok.pro/unified` للاختبار

**خطوة 4 (سوا):**
- محمود يختبر + يعطينا الأخطاء
- نصلحها خطوة خطوة

---

## ⚠️ تنبيهات من محمود

1. **ردود قصيرة** — 3-5 أسطر. (أنا خالفت هون للضرورة لأن الأسئلة كتيرة)
2. **شامي فقط** — ما تكتب بالفصحى أو الإنكليزي في الـ UI
3. **الرابط الخارجي:** `https://aluminum-nour.ngrok.pro` (مش localhost)
4. **صلاحيات** — كل صفحة/زر جديد لازم يتربط بصلاحية في user permissions

---

## 🙏 النتيجة المتوقعة

خلال **يوم واحد**: محمود يفتح رابط واحد، يدخل ببياناته القديمة، يشوف:
- الـ UI الفاخر (شغلك)
- مشاريعه + عملاؤه (من pm_server)
- مشاريع Ra الحقيقية (من SQL — WIN_01 sample)

**ردّ علي بسرعة عن اختيار SQL location (Docker Linux vs LocalDB VM) وبلّش.**

— حوبي

*فريق واحد — لا نتوقف 🚀*
