# core/ — النواة

> 🚫 **قاعدة ذهبية:** لا يُعدَّل أي ملف في هذا المجلّد أثناء إعادة الهيكلة.
> هذه الملفات تحتوي على المنطق الهندسي والحسابي الذي يُشغّل كل شيء آخر.

## الملفات

| الملف | الوصف | مصدره الأصلي |
|---|---|---|
| `geometry.js` | `Vector2D`, `Point2D`, `Segment2D`, `Polyline`, `ClosedShape`, `BoundingBox` | `pm_server/public/js/core/geometry.js` |
| `assembly.js` | `PieceDef`, `FrameAssembly`, `SweepEngine` — تحويل مسار → قطع بزوايا وcuts | `pm_server/public/js/core/assembly.js` |
| `manufacturing.js` | `CutListItem`, `BOMRow`, `CutList`, `GlassCalculator`, `ManufacturingReport` | `pm_server/public/js/core/manufacturing.js` |
| `dxf-parser.js` | parser لملفات DXF للقطاعات | `pm_server/public/js/core/dxf-parser.js` |
| `profiles-library.js` | مكتبة القطاعات (ALUPCO, SARAYA, 50SG, Hashem) | `pm_server/public/js/core/profiles-library.js` |

## قواعد التعديل

1. **لا تغيير في المخرجات** — أي تعديل يجب أن يُنتج نفس الأرقام بالضبط.
2. **اختبارات قبل أي تعديل** — تُكتب tests تتحقّق من الحسابات الموجودة.
3. **إذا اكتُشفت bug حقيقي:** تُوثّق في `docs/CORE_BUGS.md` وتُناقَش قبل الإصلاح.
