# WIN_01 result — sample من RaProjects (Project 438)

**التاريخ:** 2026-04-18 10:28 UTC
**من:** حوبي → عماد
**status:** ✅ مكتمل — `shared/win_results/WIN_01_project_sample.json` (200 KB)

---

## ما عملته

1. ✅ حمّلت SqlLocalDB.msi (64 MB) على الـ VM — winget ما فيه package — direct from Microsoft
2. ✅ تنصيب LocalDB 16.0.1000.6 (MSSQLLocalDB)
3. ✅ نسخ RaProjects.mdf من `COW\Ra\Data\Database 4.0\` إلى `C:\SqlData\` (LocalDB permissions)
4. ✅ CREATE DATABASE ... FOR ATTACH → نجح مع 19 جدول
5. ✅ استخراج كل تفاصيل Project 438

---

## اكتشافات مهمة — **اقرأهم قبل ما تصمّم**

### 1. 🔥 **Currency = SAR (مش EUR!)**
بيانات محمود الفعلية كلها **بالريال السعودي**. افتراض الخطة إنو EUR غلط.
```
"Currency": "SAR"
"PriceCatalogDesignation": "Main Price Catalog"
```

### 2. 🔥 **`ProjectContext` هو XML كامل ومضغوط لكل البيانات**
في الـ Project row في عمود `ProjectContext` — XML بيحتوي على:
- Colors (RAL 3020 Red, RGB values)
- ColorCombinations
- Glass (G24 - Glass 24mm, Price=24, Thickness=24, UnitWeight=60)
- Sections (RA074-201 Frame 54.1×66.5, RA074-302 Sash For Doors, RA052-930 Glazing bead)
- Series (AL RAW CAS - Aluminium Casement System, PVC Ra Casement System)
- WASchema (RA Hardware)
- WindowHandwork

**كل قطاع معاه:** H, W, H1-H3, W1, BarLength (6000), UnitBasePrice (EUR!), UnitWeight, Currency, MaterialType, CuttingTolerance, SectionType, إلخ.

هاد **snapshot كامل** للمشروع في رقمنة واحدة — ممكن تحلله بـ XMLParser وتبني visualization.

⚠️ **ملاحظة:** أسعار القطاعات الأصلية مخزّنة بـ EUR في `ProjectContext` (UnitBasePrice=5.35 EUR). بس الـ project.Currency = SAR. Ra.exe بيحوّل داخلياً.

### 3. **ComponentMaterial مش فيه IdProject**
الربط: `Project.IdComponentMaterial → ComponentMaterial.Id` (1:1 per project)
يعني كل مشروع عنده ComponentMaterial واحد يصف المواد الأساسية (Series, ColorCombination, Glass, WASchema, Hardware).

### 4. **CostUsage مش فيه IdProject**
الربط: `Project.IdCostGroup → CostGroup.Id → CostUsage.IdCostGroup`
المشروع 438 عنده:
- IdCostGroup = 370 → الـ 9 costs للتكلفة
- IdTaxesCostGroup = 371 → الـ tax cost

### 5. **ConsumeItem** — **هاد اللي بده عماد للـ Cost Breakdown الحقيقي!**
الجدول في RaProjects. فيه `IdProject` مباشر.
39 صف للمشروع 438 فيه:
- Code, Designation
- UnitPrice, Quantity, Length/Width/Height, Surface
- ConsumeGroupDesignation (grouping: "Frame", "Hardware", "Glass", etc.)
- ColorCombination, CategoryDesignation, CategoryType
- UnitWeight, BarLength, CuttingType1/2
- **UnitPriceSelling vs UnitPriceProduction** (هاد الذهب لـ cost breakdown!)

**في الـ JSON عندك 39 row من ConsumeItem — استعملها لحساب cost breakdown فعلي.**

---

## 📊 محتوى الـ JSON

| قسم | محتوى |
|---|---|
| `project` | Project 438 row كامل (44 عمود) + ProjectContext XML ضخم |
| `contact` | Contact 360 (فارغ - Contact بدون اسم) |
| `components` | 2 صف Component للمشروع |
| `componentMaterials` | 3 صف (series + colors + glass + hardware) |
| `consumeItems` | 39 صف — **القطاعات الفعلية مع الأسعار** |
| `financials` | 7 صف FinancialValues للمشروع |
| `phases` | 3 ProjectPhase في الـ DB |
| `costUsage` | 9 صف (تكلفة + ضرائب) |
| `costGroup` | 2 CostGroup |
| `rowCounts` | counts كل الجداول |

---

## إجابات على أسئلتك

### 1. Ra.exe بينشئ CostGroup تلقائياً؟
**نعم** — كل مشروع جديد بيخلق CostGroup (IdCostGroup=370) + IdTaxesCostGroup (371). الـ DB عنده 57 CostGroup total → أحياناً shared بين projects.

### 2. ColorList بأسماء RAL؟
موجود في `ProjectContext` XML. شفت RAL 3020 (Red) — مع RGB. الـ DB `RaConfig` فيه القائمة الكاملة (لسه ما فتحته، لو بدك أعمل attach له كمان).

### 3. ProjectPhase القيم؟
الـ DB عندها 3 phases. المشروع 438 في phase=5 (مش من الثلاثة!) — يعني في phases أكثر مش مرتبطة بالـ row. الـ JSON فيه phases.Count=3.

### 4. GlassType — 7 أنواع؟
المشروع 438 يستعمل "Glass 24 mm" (G24) — IdGlassType=11 في الـ XML. لأعرف كل القيم، محتاج attach لـ RaConfig أو RaMaterials.

### 5. Section.RawProfile DXF → varbinary?
**في `ProjectContext` XML مش في `Section.RawProfile` مباشرة للمشاريع** — بس أقدر أعمل attach لـ RaMaterials وأستخرج varbinary→DXF لو بدك.

### 6. `Section.Designation`
موجود في الـ XML (مثال: "Frame 54.1 x 66.5", "Sash For Doors", "Glazing bead 34 mm").

---

## Action items لعماد

1. افتح `shared/win_results/WIN_01_project_sample.json`
2. ركّز على `consumeItems` — **هنا القصة الحقيقية لـ cost breakdown**
3. اعمل XMLParser لـ `project.ProjectContext` — كنز بيانات كبير
4. **استبدل EUR → SAR** في الـ assumptions
5. قولي إذا بدك:
   - attach لـ RaConfig (للـ GlassType, ColorList, Company settings)
   - attach لـ RaMaterials (248 قطاع مع الـ RawProfile DXF)
   - Project تاني بعينة (في 10 projects، نوعها Production/Offer/WindowLibrary)

---

## تحذير أمني

الـ JSON حالياً **بيانات حقيقية لمحمود** — مش مجهّلة. الريبو public.
لو بتحتاج تنشرها أوسع، راح أعمل anon version.
لكن حالياً:
- Contact 360 فارغ (اسم "") — لا توجد معلومات شخصية
- Codes: PRO0001 — داخلية
- Dealer fields فارغة

آمن نسبياً.

— حوبي
