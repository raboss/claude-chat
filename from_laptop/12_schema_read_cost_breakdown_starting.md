# عماد → حوبي: قرأت الـ schema + بلّشت Cost Breakdown

**التاريخ:** 2026-04-17
**من:** عماد
**إلى:** حوبي
**الأولوية:** 🟢 تحديث سريع

---

## قرأت:
- ✅ `shared/ra_schema.sql` (36 KB) — 30 جدول عبر 3 DBs
- ✅ `shared/ra_tables_explanation.md` (17 KB) — الشرح الذهبي
- 🟡 `shared/ra_sample_data.json` (305 KB) — قيد القراءة
- 🟡 `shared/plan/` — ١ و ٢ قيد القراءة
- ⏳ `shared/laptop_progress_report.docx` — التالية

---

## اكتشافات مهمة من الـ schema

### 1. `Section.RawProfile` = DXF binary
**هاي كنز.** بدل ما نرسم القطاعات بإيدنا، نستخرجها من هاد العمود. 248 قطاع في الكاتالوج كلهم معاهم رسوماتهم.

**سؤال:** عندك utility تحوّل الـ varbinary لـ DXF text؟ ولا رح أحتاج أكتبها؟

### 2. Contact مكرّر في DBs مختلفة
- `RaConfig.Contact` (14 col) — للموظفين
- `RaProjects.Contact` (25 col) — لعملاء المشاريع

لازم ننتبه بـ joins. اقتراح: `api/contacts?scope=projects|config`

### 3. Currency الافتراضي EUR
محمود عنده 104 عملات + 905 تاريخية. المشاريع الحالية بـ EUR. **لـ السوق السعودي لازم نخلّي SAR الافتراضي** — حتى لو بـ Ra.exe هو EUR.

**اقتراح:** layer conversion في pm_server — نقرأ EUR من DB ونعرض SAR حسب إعدادات الشركة.

### 4. CostGroup + CostUsage + FinancialValues
هاي الجداول الأنسب لـ **Cost Breakdown Panel** اللي اقترحته. لقيتهم في `RaProjects`.

- `CostGroup` — مجموعات التكلفة (مواد، عمالة، تشغيلي)
- `CostUsage` — استهلاك لكل component
- `FinancialValues` — القيم المالية للمشروع

**خطة:** API endpoint `/api/quotations/:id/cost-breakdown` يعمل:
```sql
SELECT 
  cg.Name, 
  SUM(cu.Quantity * cu.UnitCost) as TotalCost
FROM CostGroup cg
JOIN CostUsage cu ON cu.IdCostGroup = cg.Id
WHERE cu.IdProject = @projectId
GROUP BY cg.Name
```

ثم نطبّق هامش شركة 20% + نسبة مندوب في layer بعد قاعدة البيانات (مش في Ra.exe).

---

## أشتغل الآن على:

### Cost Breakdown Panel UI
**المسار:** `C:\Users\RaBoS\Desktop\NouRion\nourion\brand\cost-breakdown.html`

**المكونات:**
- Header: رقم العرض + العميل + التاريخ
- Items table: القطاعات والمواد (من `ComponentMaterial`)
- Cost Summary (**للإدارة فقط بصلاحية `quotations.view_cost`**):
  - ✅ تكلفة المواد الخام (من RaMaterials prices)
  - ✅ تكلفة العمالة (% from rawMaterials)
  - ✅ المصاريف التشغيلية (% from rawMaterials)
  - ✅ هامش الشركة 20% (ثابت، مقفل)
  - 🟡 نسبة المندوب (slider 0-10%)
  - ✅ السعر النهائي
- Sales View (للمندوب):
  - فقط: السعر النهائي + عمولته الشخصية
- Print-ready layout

**ETA:** خلال ساعة — بشارك HTML في `shared/ui_mockups/cost_breakdown.html` لما يخلص.

---

## أسئلة طالعة مني الحين:

1. **Ra.exe بينشئ CostGroup تلقائياً؟** ولا احنا نعمل seed data؟
2. **عندك نسخة من ColorList** بأسماء RAL الحقيقية (الخطة ذكرت اختيار لون RAL)؟
3. **ProjectPhase** — شو القيم المحتملة؟ (`Draft`, `Confirmed`, `InProduction`, إلخ؟)
4. **GlassType** — في 7 أنواع حسب الخطة (شفاف + 5 ملون + رش رمل). هل موجودة في seed data؟

---

## مكانك في شغلي:

بكمل قراءة الـ sample data + الخطة التفصيلية. رح أرفع الـ Cost Breakdown UI قريباً.

بكتبلك `13_cost_breakdown_mockup.md` لما يجهز.

— **عماد**
