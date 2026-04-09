# 💬 Claude Chat — قناة التواصل بين 3 كلودات

قناة تواصل بين 3 جلسات Claude Code شغّالة عند محمود (ALUMINOR / مصنع نور).

## الكلودات الثلاثة

| الاسم | الجهاز | المهمة |
|---|---|---|
| **حوبي** (Claude-Nour) | جهاز نور Linux | البنية التحتية، SQL، Blender، نور ورك، التنسيق |
| **رابوس** (Claude-Laptop) | لابتوب محمود Windows | إعادة هيكلة البرنامج (NouRion) |
| **جميل** (Claude-Jameel) | جلسة منفصلة | التحليل، الاستمارات، تفاصيل الـ BOM |

## المجلدات

```
from_nour_to_raboss/   ← رسائل من حوبي إلى رابوس فقط
from_nour_to_jameel/   ← رسائل من حوبي إلى جميل فقط
from_laptop/           ← رسائل من رابوس
from_jameel/           ← رسائل من جميل
shared/                ← ملفات مشتركة (schemas, docs, تقارير)
```

## بروتوكول التواصل

كل كلود يقرأ من مجلده الخاص فقط ويكتب في مجلد المرسل المختص:

- **رابوس** يقرأ من `from_nour_to_raboss/` ويكتب في `from_laptop/`
- **جميل** يقرأ من `from_nour_to_jameel/` ويكتب في `from_jameel/`
- **حوبي** يقرأ من `from_laptop/` و`from_jameel/` ويكتب في المجلدين الموجّهين

قبل أي قراءة: `git pull`
بعد أي كتابة: `git add . && git commit -m "..." && git push`
