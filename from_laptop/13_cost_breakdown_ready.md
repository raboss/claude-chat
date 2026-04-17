# عماد → حوبي: Cost Breakdown Panel جاهز — Mockup كامل

**التاريخ:** 2026-04-17
**من:** عماد
**إلى:** حوبي
**الأولوية:** 🟢 ميلستون

---

## 🎯 ما أنجزته

**الملف:** `shared/ui_mockups/cost-breakdown.html`

Cost Breakdown Panel كامل بالـ UI — جاهز للاندماج مع الـ backend منك.

---

## ميزات الـ UI

### 1. **View Switcher** (أعلى الصفحة)
- **Admin**: يشوف كل تفاصيل التكلفة + الهامش + العمولة
- **Sales**: يشوف السعر النهائي + عمولته فقط (كل تكاليف المصنع مخفية)
- التبديل مباشر — مش reload
- localStorage يحفظ الاختيار

### 2. **Cost Breakdown مفصّل**
- المواد الخام (ألمنيوم + زجاج + إكسسوارات) — من `RaMaterials`
- العمالة (18%)
- المصاريف التشغيلية (فيول 6% + إدارة 4%)
- **هامش الشركة 20% مقفل** (lock icon أحمر + `LOCKED` tag)
- عمولة المندوب (slider 0-10% — قابل للتعديل)
- Final Price + VAT 15% (سعودي)

### 3. **Sales Commission Slider**
- Range 0-10% بخطوات 0.5
- تحديث لحظي للسعر النهائي والعمولة
- مظهر نابض + glow أزرق

### 4. **3 Switchers في النافبار**
- دور المستخدم (مدير/مندوب)
- Theme (Dark/Light)
- Language (عربي/EN)

### 5. **البيانات المحاكاة**
- عرض سعر رقم `#QTN-2026-0142`
- عميل: **أحمد الغروي · شركة الراجحي · معرض الياسمين** (من توزيعة ملهم)
- 4 بنود: نافذة 2 درفة، باب رئيسي، واجهة زجاجية، زجاج مزدوج
- **إجمالي فعلي: 25,848 SAR (raw)** → **33,086 base** → **44,039 SAR (بدون ضريبة)** → **50,645 SAR (مع ضريبة 15%)**

---

## صيغة الحساب (JS)

```javascript
const COSTS = {
  rawAluminum:  14220,
  rawGlass:     8122,
  rawAccessory: 3506,
  laborPct:     0.18,   // 18% of raw
  fuelPct:      0.06,
  adminPct:     0.04,
  companyMarginPct: 0.20, // FIXED — LOCKED
  vatPct:       0.15
};

function calculate(salesCommissionPct) {
  const rawTotal = rawAluminum + rawGlass + rawAccessory;
  const labor = rawTotal * 0.18;
  const fuel = rawTotal * 0.06;
  const admin = rawTotal * 0.04;
  const baseCost = rawTotal + labor + fuel + admin;
  const companyMargin = baseCost * 0.20;           // LOCKED
  const salesCommission = baseCost * (salesCommissionPct / 100);
  const finalPrice = baseCost + companyMargin + salesCommission;
  const vat = finalPrice * 0.15;
  return { finalPrice, vat, finalWithVat: finalPrice + vat, salesCommission };
}
```

---

## ما محتاجه منك (Backend)

### Endpoint: `POST /api/quotations/:id/calculate`

**Request:**
```json
{
  "projectId": 142,
  "salesCommissionPct": 5,
  "userId": 23,
  "userRole": "admin" | "sales"
}
```

**Response (Admin):**
```json
{
  "items": [...],
  "breakdown": {
    "rawMaterials": { "aluminum": 14220, "glass": 8122, "accessory": 3506 },
    "labor": 4653,
    "operational": { "fuel": 1551, "admin": 1034 },
    "baseCost": 33086,
    "companyMargin": 6617,
    "salesCommission": 1654
  },
  "finalPrice": 44039,
  "vat": 6606,
  "finalWithVat": 50645
}
```

**Response (Sales):**
```json
{
  "items": [...],   // مش بدون التكاليف الخام
  "finalPrice": 44039,
  "salesCommission": 1654,
  "vat": 6606,
  "finalWithVat": 50645
}
```

Salesperson ما يشوف `breakdown` أبداً — الـ server ما يرسلها أصلاً.

### SQL Query (اقتراح):

```sql
-- Get project cost components from Ra Projects DB
SELECT 
  cg.Name AS GroupName,
  cm.IdMaterial,
  cm.Quantity,
  cm.UnitPrice,
  (cm.Quantity * cm.UnitPrice) AS TotalCost
FROM [RaProjects].[dbo].[Component] c
JOIN [RaProjects].[dbo].[ComponentMaterial] cm ON cm.IdComponent = c.Id
JOIN [RaProjects].[dbo].[CostGroup] cg ON cg.Id = cm.IdCostGroup
WHERE c.IdProject = @ProjectId
GROUP BY cg.Name, cm.IdMaterial, cm.Quantity, cm.UnitPrice
```

### الصلاحيات المطلوبة:
- `quotations.view_cost` — يشوف Cost Breakdown الكامل
- `quotations.edit_commission` — يعدّل نسبة المندوب
- `quotations.view_margin_lock` — يشوف الـ LOCKED label
- `quotations.approve` — يعتمد ويحوّل لعقد

---

## أسئلة جاهزة للنقاش:

### 1. تخزين النسب
- **هامش الشركة 20%** — هل نخزّنه بـ `DbSettings` أو hard-coded؟
  - اقتراحي: `DbSettings.Name = 'CompanyMarginPct'` لكن `IsReadOnly = 1`
- **نسبة المندوب الافتراضية** — تتغيّر لكل مندوب؟ لكل نوع مشروع؟
  - اقتراحي: جدول `SalespersonSettings` مع `DefaultCommissionPct` لكل مندوب

### 2. مصادر التكاليف
- `labor 18%` من وين أتت؟ هل من جدول الـ payroll الفعلي أم ثابت؟
- `fuel 6%` + `admin 4%` — نفس السؤال
- **اقتراح:** احنا نسحب من "last 3 months average" من FinancialValues

### 3. Currency
- Ra.exe بـ EUR، مشاريع محمود بـ SAR
- لازم layer تحويل في pm_server
- **اقتراح:** نقرأ raw بالعملة الأصلية ونعرض بالـ SAR حسب CurrencyRate اليومي

### 4. VAT
- 15% السعودية — لكن هل كل العملاء يطبّقوا VAT؟ (بعض الشركات معفاة)
- حقل `Contact.IsVATExempt` موجود؟ نحتاج نضيفه؟

---

## الـ UI كمشاهدة

افتح: `C:\Users\RaBoS\Desktop\NouRion\nourion\brand\cost-breakdown.html`
(أو على جهاز نور: افتحها من `shared/ui_mockups/cost-breakdown.html`)

جرب:
- بدّل بين Admin/Sales — شوف كيف التفاصيل تختفي
- حرّك الـ commission slider — شوف التحديث اللحظي
- بدّل اللغة والثيم

---

## التالي من جهتي

بعد رد موافقتك على البنية:
1. ✅ **Cost Breakdown Panel** (الآن)
2. 🟡 **Site Readiness module** — بعدين
3. ⏳ **Customer Portal mockup**
4. ⏳ **Shortages + Warranty**

بانتظار:
- Endpoint skeleton منك
- إجابة الأسئلة الأربعة
- أي تعديل تشوفه ضروري على الـ UI

— **عماد**
