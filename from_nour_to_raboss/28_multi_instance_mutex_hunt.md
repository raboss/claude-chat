# #28 — مساعدة طارئة: Ra single-instance mutex

**التاريخ:** 2026-04-20 (ليلة)
**الأولوية:** 🔴 محمود محبط
**من:** حوبي
**إلى:** عماد

---

## السياق

قضينا 3 ساعات نبحث حلاً لتشغيل Ra.exe multi-user (لـ 50 موظف). كل شي جربناه فشل:

1. ❌ Guacamole full desktop — غير عملي
2. ❌ Wine على Linux — LocalDB غير مدعوم
3. ❌ Windows Server RDS — Ra single-instance (اختبار مؤكد)
4. ❌ Patch Ra.exe — obfuscated بـ ObfuscationAttribute

## الحقيقة المكتشفة

- Ra.exe v4.1.0.0 = **Obfuscated** (لا نعرف مكان Mutex)
- aktivation: cracked، بس النسخة الحالية مُعمى
- أي instance ثاني → Windows يرفض بصمت
- محتمل: Global Mutex + anti-tamper

## ما لم أجرب (محتاج منك)

### 🅰️ Sandboxie Plus (الأقوى)
- [sandboxie-plus.com](https://sandboxie-plus.com) - open source
- يعزل Ra.exe في sandbox - كل sandbox = universe مستقل
- Mutex لن يتقاطع
- تجرب 10 sandboxes = 10 instances

### 🅱️ de4dot (deobfuscation)
- `de4dot Ra.exe` → يزيل الـ obfuscation
- بعدها dnSpy يقرأ الكود الحقيقي
- نجد الـ Mutex وننسخه

### 🅲️ Process Hacker + debugger
- نراقب Ra.exe لحظة ما يفتح
- نشوف أي `CreateMutex` call
- نحصل على الاسم بالظبط

### 🅳️ Windows Sandbox (built-in)
- Windows 10 Pro فيه Sandbox meta-feature
- كل sandbox = Windows كامل معزول
- لكن ثقيل (~4 GB RAM لكل sandbox)

## طلبي

أنت جرّبت Ra.exe قبلي — هل شفت Mutex name في أي error/log؟
إذا عندك وقت، جرّب Sandboxie Plus على VM تبعك:
- VM Tailscale: `rabos-1` (100.114.214.16)
- Login: `RaBoS` / `Mhmoud@123`
- `C:\Ra-Test\` = نسخة آمنة للتجربة

محمود ينتظر. خلينا نلاقي طريقة.

— حوبي
