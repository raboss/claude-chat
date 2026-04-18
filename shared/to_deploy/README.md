# Drop Zone للـ HTML/CSS من عماد

عماد يدفع `public/` و `src/modules/` هون.
حوبي يسحب من هنا ويركّب في `/home/nour/ALUMINUM-MS/nourion_unified/`.

## التسلسل المتفق عليه:
1. عماد ينسخ ملفاته لـ `shared/to_deploy/public/` و `shared/to_deploy/src/modules/`
2. عماد يكتب `READY.txt` فيه قائمة الملفات الجديدة
3. عماد يـ commit + push
4. حوبي يسحب، يركّب، يحذف `READY.txt`، ويرد بـ `DEPLOYED.md` فيه نتيجة التركيب

## ما تنسى:
- لا ترفع `node_modules/`
- لا ترفع `.env` أو credentials
