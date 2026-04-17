# WIN_01 — استخراج sample من مشروع فعلي في RaProjects

**التاريخ:** 2026-04-18
**من:** عماد → حوبي
**نوع الطلب:** WIN execution on 192.168.122.106 (Windows VM)
**الأولوية:** 🟠 عالية — محتاجها للـ Customer Portal UI

---

## الطلب

احتاج sample data فعلي من مشروع موجود في `RaProjects` DB — عشان أبني Customer Portal mockup مبني على بيانات حقيقية.

### المطلوب بالتحديد:

```sql
USE [RaProjects];

-- 1. مشروع واحد بكل تفاصيله
SELECT TOP 1 *
FROM [dbo].[Project]
WHERE IsActive = 1
ORDER BY CreatedDate DESC;

-- 2. كل Components للمشروع ده
SELECT c.*
FROM [dbo].[Component] c
JOIN [dbo].[Project] p ON c.IdProject = p.Id
WHERE p.Id = @ProjectIdFromStep1;

-- 3. ComponentMaterial (القطاعات + الزجاج + الإكسسوارات)
SELECT cm.*, s.Code AS SectionCode, s.Designation AS SectionName
FROM [dbo].[ComponentMaterial] cm
LEFT JOIN [RaMaterials].[dbo].[Section] s ON cm.IdMaterial = s.Id
WHERE cm.IdProject = @ProjectIdFromStep1;

-- 4. FinancialValues
SELECT *
FROM [dbo].[FinancialValues]
WHERE IdProject = @ProjectIdFromStep1;

-- 5. ProjectPhase
SELECT *
FROM [dbo].[ProjectPhase]
WHERE IdProject = @ProjectIdFromStep1
ORDER BY SequenceNumber;

-- 6. Contact للعميل
SELECT *
FROM [dbo].[Contact]
WHERE Id = @ContactIdFromProject;

-- 7. CostGroup + CostUsage (للـ Cost Breakdown)
SELECT cu.*, cg.Name AS GroupName
FROM [dbo].[CostUsage] cu
JOIN [dbo].[CostGroup] cg ON cu.IdCostGroup = cg.Id
WHERE cu.IdProject = @ProjectIdFromStep1;
```

---

## الإخراج المطلوب

**ملف JSON واحد** في `shared/win_results/WIN_01_project_sample.json`:

```json
{
  "project": { ... },
  "components": [ ... ],
  "materials": [ ... ],
  "financials": { ... },
  "phases": [ ... ],
  "contact": { ... },
  "costBreakdown": [ ... ],
  "metadata": {
    "extractedAt": "2026-04-18 HH:MM:SS",
    "databaseUsed": "RaProjects",
    "rowCountsPerTable": { ... }
  }
}
```

---

## السبب

أستخدم الـ JSON:
1. بـ Customer Portal — لعرض مشروع حقيقي (المراحل، الألوان، الصور)
2. بـ Cost Breakdown — للتحقق من حسابي (هل 18% labor صحيح؟)
3. بـ Drawings Approval — لعرض شكل النوافذ الحقيقي
4. كـ seed data للـ tests

---

## سؤال إضافي (لو عندك وقت):

هل `Component.WindowStyle` عمود حقيقي؟ إذا موجود، أحتاج القيم المحتملة (casement / sliding / fixed / tilt-turn...).

وللـ `Section.RawProfile` — هل ممكن تحوّل واحد DXF وترسله كـ `.dxf` file؟ حتى أشوف كيف يبدو الرسم الفعلي.

---

## التنسيق

- إذا اخذت أكتر من 5 دقايق، قلّي — أحضّر شي ثاني بالأثناء
- إذا في مشكلة بالـ query (schema مختلف)، عدّلها وبعتلي النتيجة
- Privacy: خفي أي بيانات عميل حقيقية بـ "ANON" لو الـ sample بيتنشر

بانتظار الـ result في: `from_nour_to_raboss/WIN_01_result.md` + `shared/win_results/WIN_01_project_sample.json`

— عماد
