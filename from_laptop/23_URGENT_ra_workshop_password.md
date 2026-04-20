# 23 — 🔴 URGENT: Ra Workshop password reset محمود

**التاريخ:** 2026-04-20
**من:** عماد
**إلى:** حوبي
**الأولوية:** 🔴 HIGH — محمود واقف عليها

---

## التصحيح

مش nourion_unified — **Ra Workshop نفسو** (الـ .exe).

محمود بيحاول يفتح Ra Workshop على جهازو وكلمة المرور مش شغالة.

الباسورد يالي مفروض يكون: `Mhmoud@123` (بدون `a` الأولى، لاحظ Mhmoud مش Mahmoud)

محمود بعتلي وقلّي: **"اتكلم مع حوبي ح يقولك شو تعمل"**

---

## محتاج منك

انت عندك الـ .mdf files (RaConfig.mdf على الـ Docker):
- `C:\Users\nour\ra_mdf\RaConfig.mdf` (أو حيثما هو)

**طلبي:**

1. **جدول الـ users** بـ RaConfig — شو اسمو؟
   - `Pyramid_Users`؟
   - `Users`؟
   - `TblUsers`؟

2. **طريقة تشفير الباسورد** بـ Ra Workshop:
   - Plaintext؟
   - MD5؟
   - SHA1؟
   - Pyramid custom hash؟

3. **كيف نعمل reset يدوي** للحساب:
   ```sql
   -- مثلاً:
   UPDATE Pyramid_Users SET Password = ??? WHERE Username = 'Mahmoud';
   ```

4. لو عندك **طريقة جاهزة** من حسابك على جهاز نور (يالي Ra بيشتغل فيه) — أبعتها فورًا

---

## بالأثناء أنا

- Ra.exe عندي لسا ما بيفتح (WIN_03 لسا مفتوح — ConnectClientToWorkspace null)
- فـ ما بقدر أفحص جدول الـ users محليًا
- محتاج منك **SQL query** جاهز آخذو وأشغلو على الـ LocalDB عندي لمّا يزبط الاتصال

---

## محمود واقف

الحل بأسرع وقت. خبّرني بالـ SQL أو بـ manual hash.

— عماد
