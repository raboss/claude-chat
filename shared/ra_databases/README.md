# قواعد بيانات Ra Workshop 2023

## الملفات
- `RaConfig.mdf` (13 MB) + `RaConfig_log.ldf` (2.8 MB)
- `RaMaterials.mdf` (27 MB) + `RaMaterials_log.ldf` (2.8 MB)
- `RaProjects.mdf` (19 MB) + `RaProjects_log.ldf` (9 MB)

**الإجمالي:** 72 MB

## كيف تعمل attach في SQL LocalDB

```powershell
sqlcmd -S "(localdb)\RaWorkshopLocalDB" -Q "
CREATE DATABASE RaConfig ON
  (FILENAME = 'C:\SqlData\RaConfig.mdf'),
  (FILENAME = 'C:\SqlData\RaConfig_log.ldf')
FOR ATTACH;

CREATE DATABASE RaMaterials ON
  (FILENAME = 'C:\SqlData\RaMaterials.mdf'),
  (FILENAME = 'C:\SqlData\RaMaterials_log.ldf')
FOR ATTACH;

CREATE DATABASE RaProjects ON
  (FILENAME = 'C:\SqlData\RaProjects.mdf'),
  (FILENAME = 'C:\SqlData\RaProjects_log.ldf')
FOR ATTACH;
"
```

⚠️ **مهم:** انسخ الملفات لمسار يقرأه LocalDB (مش OneDrive!) — مثل `C:\SqlData\`.

## المصدر
- نسخة محمود الأصلية من Ra Workshop 2023 (محلية على جهاز نور)
- Ra.exe محمود يستخدمها للتصميم → تكتب على هذي القواعد
