# 📚 شرح جداول Ra Workshop 2023

**المصدر:** LocalDB (`RaWorkshopLocalDB`) على لابتوب محمود
**التاريخ:** 2026-04-07
**الكاتب:** Claude-Laptop
**الجمهور:** Claude-Nour (لبناء NourWork)

---

## 🗂 نظرة عامة

Ra Workshop يستخدم **3 قواعد بيانات منفصلة** على نفس instance:

| القاعدة | عدد الجداول | الغرض | الحجم النسبي |
|---|---|---|---|
| **RaConfig** | 24 | إعدادات المستخدم، الشركة، العملات، الوحدات | صغيرة (شبه ثابتة) |
| **RaMaterials** | 127 | كتالوج المواد: قطاعات، زجاج، إكسسوارات، ألوان | كبيرة (المرجع المركزي) |
| **RaProjects** | 19 | المشاريع الفعلية والمكونات والتكاليف | تنمو مع الاستخدام |

**القاعدة الذهبية:** `RaProjects` تحتوي على بيانات العملاء (المشاريع)، و `RaMaterials` كاتالوج للمواد المتاحة، و `RaConfig` إعدادات الشركة.

---

## 🏢 RaConfig — الإعدادات

### Company (1 row)
معلومات الشركة الواحدة. حقول:
- `Id` (PK), `CUI`, `RegistrationNumber`, `Bank`, `IBAN`
- **ملاحظة**: `RowSignature` هو `timestamp` (rowversion) — يتغيّر تلقائياً مع كل update. مفيد للـ optimistic concurrency.

### Contact (32 rows)
جهات الاتصال (موظفون + عملاء على مستوى الإعدادات).
- `Id`, `Guid`, `Name`, `Address`, `Phone`, `Email`
- `IsCompany` (bit) — هل هي شركة أم فرد
- `IdContactCategory` → `ContactCategory.Id`
- `IdPersonal` → `Personal.Id`
- `IdCompany` → `Company.Id`
- **مهم**: نفس جدول `Contact` موجود في `RaProjects` بتعريف مختلف (25 cols vs 14)! انتبه عند الـ joins بين القواعد.

### Currency (104 rows) + CurrencyRate (905 rows)
كل العملات العالمية + أسعار الصرف التاريخية. **EUR هو الافتراضي في المشاريع المُعاينة.**

### Unit (98 rows)
وحدات القياس (mm, m, kg, m², إلخ) مع تحويلات.

### Personal (31 rows)
معلومات شخصية للموظفين/الـ contacts.

### DbSettings (462 rows)
إعدادات البرنامج كـ key/value pairs. **مهم جداً** — يحتوي على configuration runtime.

---

## 🧱 RaMaterials — الكاتالوج

هذه القاعدة هي الأساس. كل ما يُستخدم في المشاريع يُعرَّف هنا أولاً.

### Series (6 rows) — أنظمة القطاعات
السلسلة = نظام كامل (مثلاً "Aluminum 50mm Casement"). كل سلسلة تحتوي على عدّة قطاعات.
- `Id`, `Code`, `Name`
- `WindowType` — نوع النافذة (casement / sliding / fixed)
- `MaterialSpeciesId` — نوع المادة (Al / PVC / Wood)
- 37 عمود إجمالي — معظمها خصائص هندسية

### Section (248 rows) — القطاعات
**هذا الجدول الأهم في الكاتالوج.** كل قطاع له:
- `Id`, `Code`, `Designation`, `Description`
- `Width`, `Height`, `Thickness` (الأبعاد بالـ mm)
- `Weight` (kg/m)
- `Length` (طول البار الافتراضي، عادة 6000)
- `IsActive` (bit)
- `RawProfile` — `varbinary(MAX)` ⭐ — **هذا الـ DXF binary للقطاع نفسه!** هنا تجد رسم القطاع كاملاً.
- 91 عمود إجمالي — خصائص ميكانيكية، حرارية، عزل، إلخ

⚡ **اكتشاف مهم**: `Section.RawProfile` فيه DXF binary. يعني نقدر نستخرج رسم القطاع الحقيقي من هنا بدل ما نرسمه بأنفسنا. هذا يحلّ مشكلة جودة الرسم اللي ذكرها محمود.

### SeriesSection (293 rows)
جدول الـ junction بين Series و Section. يحدّد أيّ قطاع ينتمي لأيّ سلسلة.
- `IdSeries` → `Series.Id`
- `IdSection` → `Section.Id`
- `Position` — دور القطاع في السلسلة (frame/sash/mullion/transom/...)

### Glass (51 rows) + GlassType (3 rows)
أنواع الزجاج المتاحة. حقول:
- `Id`, `Code`, `Designation`, `Thickness`, `Weight`
- `UValue` — معامل العزل الحراري
- `LightTransmittance`, `SolarFactor` — خصائص ضوئية
- `IdGlassType` → `GlassType.Id`
- 48 عمود إجمالي

### Accessory (344 rows) + AccessoryType (4 rows)
كل الإكسسوارات (مفصلات، مقابض، أقفال، إلخ).
- `Id`, `Code`, `Designation`, `Weight`
- `IdAccessoryType` → `AccessoryType.Id`
- 32 عمود

### Color (19 rows) + ColorList (17 rows) + ColorListItem (38 rows)
نظام الألوان:
- `Color` — اللون نفسه (RAL code, name, hex)
- `ColorList` — قائمة ألوان محدّدة (مثلاً "ALUPCO Standard")
- `ColorListItem` — العناصر في كل قائمة

### Range (12 rows) + RangeCell (1368 rows)
**Range table** = شيء معقّد. أعتقد أنها جدول لأبعاد مسموحة (max width × max height) لكل series. مفيد لـ validation.

### Rule (409 rows) + RuleTemplate (531 rows)
**نظام قواعد التصنيع.** هذا أكبر جدول في الـ schema (59 column!). يحتوي على:
- شروط (conditions): متى تطبَّق القاعدة
- إجراءات (actions): ماذا تفعل
- مستوى الأهمية (priority)
- نطاق التطبيق (scope: section/window/project)

⚠️ **مهم جداً للـ NourWork**: هذا الجدول يحتوي على منطق تصنيع المصنع. لا تتجاهله — كل قاعدة هنا تمثّل خبرة سنوات.

### WindowAccessory (3 rows)
ربط النافذة بإكسسواراتها (المفصلات على البطن، المقبض على اليمين، إلخ).

---

## 📦 RaProjects — المشاريع الفعلية

### Project (8 rows) — المشروع
**الجدول الرئيسي.** كل مشروع له سجل واحد هنا.
- `Id`, `Guid`, `Code`, `Designation`, `Description`
- `CreationDate`, `ModifiedDate`, `DueDate`, `Date`
- `MainText`, `SecondaryText` — RTF text للملاحظات والشروط
- `CheckOutToUserGuid` — لو المشروع مفتوح (locked) من مستخدم آخر
- `CreateByUser`, `ModifiedByUser` — usernames
- `IdProjectPhase` → `ProjectPhase.Id` (مرحلة المشروع)
- `IsClosed` (bit) — هل المشروع منتهي
- `IdContact` → `Contact.Id` (العميل)
- `ProjectType` — نوع: WindowLibrary / Order / Quote / إلخ
- `ApplicationVersion`, `ApplicationLanguage`
- `IdCostGroup`, `IdTaxesCostGroup`
- `Currency` — العملة (نص: 'EUR', 'USD', إلخ)
- `WindLoading`, `UseAreaWithCovers`
- 43 عمود إجمالي

**عيّنة من البيانات الحقيقية:**
```
Id: 428
Code: WLB0004
Designation: PVC RAW Folding System Library (Doors-OO)
ProjectType: WindowLibrary
CreatedBy: admin
Currency: EUR
```

### Component (34 rows) — مكوّنات المشروع
كل **نافذة/باب** في المشروع له سجل في `Component`.
- `Id`, `Guid`, `IdProject` → `Project.Id`
- `Code`, `Designation`, `Quantity`
- `Width`, `Height` (mm)
- `IdSeries` → `Series.Id` (السلسلة المستخدمة)
- `IdColorList` → `ColorList.Id`
- `IdGlass` → `Glass.Id` (الزجاج الافتراضي)
- 22 عمود إجمالي

### ComponentMaterial (42 rows)
هذه الجدول **يربط القطعة بكل المواد المستخدمة فيها** — قطاعات، زجاج، إكسسوارات.
- `IdComponent` → `Component.Id`
- `IdSection` (nullable)
- `IdGlass` (nullable)
- `IdAccessory` (nullable)
- `Quantity`, `Length`, `Width`, `Height`
- `Position` — أين تستخدم في القطعة
- 29 عمود — هذا الـ "BOM" لكل نافذة

### ConsumeItem (2,496 rows!) — قائمة الاستهلاك
**أكبر جدول في RaProjects.** يحتوي على كل عناصر الاستهلاك (cut list) لكل مشروع.
- `IdProject`, `IdComponent`, `IdComponentMaterial`
- `Code`, `Designation`, `Length`, `Width`, `Quantity`
- `Weight`, `Surface`, `Volume`
- `WastePercentage`, `WasteValue`
- `UnitCost`, `TotalCost`
- 63 عمود — يحتوي على كل التفاصيل الحسابية للتصنيع

⚠️ **هذا الجدول هو الذهب**. كل ما يحتاجه قسم التصنيع موجود هنا.

### CostGroup (50 rows) + CostUsage (276 rows)
نظام التكاليف:
- `CostGroup` — مجموعات تكلفة (مواد خام، عمالة، أرباح، ضرائب)
- `CostUsage` — استخدامات محدّدة (تكلفة قطع، تكلفة تركيب، إلخ)

### FinancialValues (32 rows)
الملخّص المالي لكل مشروع:
- `IdProject`, `Type` (subtotal/tax/total/discount)
- `Value`, `Currency`

### Options (8 rows)
خيارات على مستوى المشروع (key/value).

### ProjectPhase (3 rows)
مراحل المشروع: Quote / Confirmed / In Production / Delivered / إلخ.
**مهم جداً للـ NourWork**: هذا أهم جدول للموظفين — حالة المشروع.

### Segment (0 rows)
فاضي حالياً. أعتقد أنه للمشاريع الكبيرة مقسّمة لأقسام. تجاهله للآن.

### Contact (8 rows في RaProjects)
**ملاحظة حرجة**: هذا جدول `Contact` مختلف عن `RaConfig.Contact` و `RaMaterials.Contact`. عنده 25 عمود — أكثر تفصيلاً. هذا للعملاء الفعليين للمشاريع.

---

## 🔗 العلاقات الأساسية (Foreign Keys)

### كيف يُخزَّن المشروع؟ (الـ JOIN paths الكاملة)

```
Project (1)
  ├── IdContact → Contact (العميل)
  ├── IdProjectPhase → ProjectPhase (الحالة)
  ├── IdCostGroup → CostGroup (التكاليف)
  └── IdComponentMaterial → ComponentMaterial (المادة الافتراضية)

Component (N) — كل نافذة
  ├── IdProject → Project
  ├── IdSeries → Series (RaMaterials!)  ⚠ cross-database
  ├── IdColorList → ColorList (RaMaterials!)
  └── IdGlass → Glass (RaMaterials!)

ComponentMaterial (M) — كل مادة في النافذة
  ├── IdComponent → Component
  ├── IdSection → Section (RaMaterials!)
  ├── IdGlass → Glass (RaMaterials!)
  └── IdAccessory → Accessory (RaMaterials!)

ConsumeItem (K) — قطع التصنيع
  ├── IdProject → Project
  ├── IdComponent → Component
  └── IdComponentMaterial → ComponentMaterial
```

⚠️ **التحدي الأكبر**: العلاقات تعبر القواعد. مثلاً `Component.IdSeries` يشير إلى `RaMaterials.Series.Id`. هذا يعني:
- لا يمكن استخدام foreign keys حقيقية بين القواعد (SQL Server لا يدعم cross-database FKs)
- تحتاج تعمل JOINs يدوية باستخدام full table names (e.g. `RaMaterials.dbo.Section`)
- الـ application logic مسؤول عن الـ referential integrity

### مثال JOIN كامل لقراءة مشروع:

```sql
SELECT
  p.Code, p.Designation, p.Currency,
  pp.Name AS Phase,
  c.Name AS ClientName,
  comp.Code AS ComponentCode, comp.Width, comp.Height, comp.Quantity,
  s.Designation AS SeriesName,
  g.Designation AS GlassName,
  cm.Position, cm.Quantity AS MaterialQty
FROM RaProjects.dbo.Project p
LEFT JOIN RaProjects.dbo.ProjectPhase pp ON p.IdProjectPhase = pp.Id
LEFT JOIN RaProjects.dbo.Contact c ON p.IdContact = c.Id
INNER JOIN RaProjects.dbo.Component comp ON comp.IdProject = p.Id
LEFT JOIN RaMaterials.dbo.Series s ON comp.IdSeries = s.Id
LEFT JOIN RaMaterials.dbo.Glass g ON comp.IdGlass = g.Id
INNER JOIN RaProjects.dbo.ComponentMaterial cm ON cm.IdComponent = comp.Id
WHERE p.Id = 428
```

---

## 📊 إحصائيات سريعة

| الجدول | عدد الصفوف | الأهمية |
|---|---|---|
| `Section` | 248 قطاع | ⭐⭐⭐⭐⭐ المفتاح |
| `Glass` | 51 نوع زجاج | ⭐⭐⭐⭐⭐ |
| `Accessory` | 344 إكسسوار | ⭐⭐⭐⭐ |
| `Series` | 6 أنظمة | ⭐⭐⭐⭐⭐ |
| `Project` | 8 مشاريع | ⭐⭐⭐⭐⭐ |
| `Component` | 34 نافذة | ⭐⭐⭐⭐ |
| `ConsumeItem` | 2,496 قطعة | ⭐⭐⭐⭐⭐ (BOM كامل) |
| `Rule` | 409 قاعدة | ⭐⭐⭐⭐ (منطق التصنيع) |
| `RangeCell` | 1,368 خلية | ⭐⭐⭐ (validation ranges) |

---

## 🎯 توصياتي لـ NourWork

### 1. ابدأ بـ Read-Only من Project + Component
أبسط use case للـ NourWork الأولى:
- اعرض قائمة المشاريع للموظفين
- اعرض تفاصيل كل مشروع (المكوّنات + المواد)
- اعرض حالة كل مشروع (`ProjectPhase`)

```sql
-- جلب كل المشاريع النشطة
SELECT p.Id, p.Code, p.Designation, p.Currency, p.CreationDate,
       pp.Name AS Phase, c.Name AS ClientName
FROM RaProjects.dbo.Project p
LEFT JOIN RaProjects.dbo.ProjectPhase pp ON p.IdProjectPhase = pp.Id
LEFT JOIN RaProjects.dbo.Contact c ON p.IdContact = c.Id
WHERE p.IsClosed = 0
ORDER BY p.ModifiedDate DESC
```

### 2. لا تكتب في Ra Workshop أبداً
استخدم `RaUser` بصلاحية `db_datareader` فقط (وليس `db_owner`!). كل التعديلات تذهب إلى ملفات NouRion JSON.

### 3. استخرج DXF القطاعات
`Section.RawProfile` (varbinary) = ذهب. اقرأها وحوّلها لـ SVG لـ NouRion. هذا يحلّ مشكلة جودة الرسم.

### 4. احفظ الـ Rule logic للمستقبل
جدول `Rule` (409 قاعدة) فيه منطق تصنيع المصنع. لا تُلمس الآن، لكن وثّقها كـ "future migration target" — هذه أكبر قطعة intellectual property في النظام.

### 5. تحذير من cross-database joins
على Linux عند نقل القواعد لـ Docker SQL Server، تأكد إنّ كل القواعد الثلاث على نفس instance حتى تشتغل الـ joins.

---

## 🔧 ملاحظات تقنية للـ Docker على Linux

### Encoding
- النصوص العربية موجودة في الـ database — استخدم `nvarchar` (Unicode) دائماً، لا `varchar`
- Connection string لا يحتاج `Encoding` خاص، لكن تأكد من `CodePage` صحيح إذا واجهت مشاكل

### Identity columns
كل الجداول تستخدم `IDENTITY(1,1)` — Auto-increment integer. غير قابلة للنقل المباشر (لا تُصدّر القيم الموجودة، تُعاد توليدها على الـ destination).

### RowSignature (timestamp)
كل جدول له `RowSignature` (rowversion). هذا للـ optimistic concurrency. إذا نقلت البيانات، هذه القيم ستتغيّر تلقائياً.

### Guid columns
كل الجداول الرئيسية لها `Guid` (uniqueidentifier). **استخدمها كـ stable identifier** بين Ra و NouRion — أكثر أماناً من Id integers.

---

## 📁 ملفات .mdf الأصلية على لابتوب محمود

```
C:\USERS\M2011\ONEDRIVE\COW\RA\DATA\DATABASE 4.0\
  ├── RACONFIG.MDF
  ├── RAMATERIALS.MDF
  └── RAPROJECTS.MDF
```

⚠️ **مهم**: هذه الملفات في **OneDrive** = مشاركة سحابية. هذا يفسّر إنّ في نسختين على نفس instance (الثانية في `C:\PROGRAMDATA\PYRAMID SOFTWARE\RA WORKSHOP\DATABASE 4.0\`). إذا حصل conflict، احذر من تضارب البيانات.

---

## ✅ خلاصة

عندي الآن صورة كاملة عن schema الأصلي. **الأهم في عيناتك:**
1. **Project 428** = "PVC RAW Folding System Library (Doors-OO)" — مشروع تعليمي من Ra Workshop نفسهم
2. عدد المشاريع الفعلية: 8 — معظمها templates من Ra Workshop
3. الـ Components: 34 نافذة بأبعاد حقيقية
4. الـ ConsumeItem: 2,496 قطعة — قائمة قطع كاملة جاهزة للتصنيع

**الـ NourWork يمكن أن يبدأ فوراً بـ:**
- Read-only viewer للمشاريع
- Read-only viewer للقطاعات (مع DXF preview من `Section.RawProfile`)
- ربط حالة المشروع (`ProjectPhase`) بالموظفين (الـ 17 صلاحية)

**ما أحتاجه منك بعد:**
- أكّد لي أنّ Docker SQL Server عندك يدعم `varbinary(MAX)` بحجم كبير (للـ DXF)
- أرسل لي مثال connection string فعلي شغّال من Node.js على Linux
- أكّد إنّ القواعد الثلاث ستكون على نفس instance لتدعم cross-database joins

— **Claude-Laptop**
2026-04-07
