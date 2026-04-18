# modules/ — وحدات الأعمال

كل module يمثّل ميزة مستقلّة من النظام. الهدف أن يصبح كل module قابلاً للتشغيل/الاختبار بمعزل عن الباقي.

## الوحدات الحالية (منقولة حرفياً من pm_server)

| المجلّد | الملف | السطور | المصدر الأصلي |
|---|---|---|---|
| `projects/` | `projects.js` | 2,816 | `03-projects.js` |
| `measurements/` | `measurements.js` | 1,121 | `07-measurements.js` |
| `documents/` | `documents.js` | 1,011 | `04-documents.js` |
| `reports/` | `reports.js` | 1,142 | `05-reports.js` |
| `saved/` | `saved.js` | 855 | `06-saved.js` |
| `forms/` | `forms.js` | 2,386 | `11-forms.js` |
| `form-types/` | `form-types.js` | 276 | `12-form-types.js` |
| `installations/` | `installations.js` | 3,600 | `13-installations.js` |
| `draw/` | `draw.js` | 4,356 | `14-draw.js` |
| `hr/` | `hr.js` | 1,117 | `15-hr.js` |
| `designs/` | `designs.js` | 801 | `16-designs.js` |
| `assembly/` | `assembly-module.js` | 274 | `17-assembly.js` |
| `manufacturing/` | `manufacturing-module.js` | 336 | `18-manufacturing.js` |
| `custody/` | `custody.js` | 1,866 | `19-custody.js` |
| `settings/` | `settings.js` | 772 | `08-settings.js` |

**الإجمالي:** 15 module × ~22,729 سطر.

## القاعدة الحمراء للتنظيف

أي عمل على module يتبع هذا الترتيب، **بدون استثناء**:

1. **استخراج المنطق الحسابي** إلى ملف `*.logic.js` (pure functions، بدون DOM).
2. **كتابة اختبارات** تتأكّد من أن `logic.js` يُنتج نفس مخرجات الدالة الأصلية.
3. **فصل الـ UI** إلى `*.view.js`.
4. **استبدال inline event handlers** بـ `addEventListener`.
5. **نقل النصوص العربية الصلبة** إلى `services/i18n.js`.

❌ **ممنوع:** تعديل الحسابات أو تغيير أسماء الحقول أو تغيير شكل البيانات المحفوظة.

## خريطة مجلد module (الهيكل المستهدف)

```
modules/projects/
├── projects.js          ← النسخة الأصلية (محجوزة كمرجع)
├── projects.logic.js    ← الحسابات الصرفة (pure)
├── projects.view.js     ← رسم DOM
├── projects.controller.js ← ربط الأحداث
└── projects.test.js     ← اختبارات logic.js
```
