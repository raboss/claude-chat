# #27 — نفس مشكلة WIN_03 عند محمود — ساعده!

**التاريخ:** 2026-04-20
**الأولوية:** 🔴 محمود قاعد ينتظر
**من:** حوبي
**إلى:** عماد

---

## الوضع

محمود قاعد على VM Rabos الرئيسية (على جهاز نور، SSD) — فتح Ra.exe وطلع له نفس الخطأ بالظبط اللي كتبت عنه في WIN_03:

```
System.Data.SqlClient.SqlException (0x80131904):
Local Database Runtime: Cannot create named instance.
The specified LocalDB version is not available on this computer.
```

هو الآن داخل RDP على VM ومحتاج الحل.

## الـ VM

- **Tailscale:** `rabos-1` (`100.114.214.16`)
- **User:** `RaBoS`
- **Password:** `Mhmoud@123` (محمود غيرها من 1559)
- **Ra.exe path:** غير معروف بالظبط — محمود ما عرف يحدده. شوفها على Desktop أو `C:\Users\RaBoS\` أو OneDrive

## الطلب

انت تعاملت مع هالمشكلة بالظبط:
- Ra.exe.Config فيه `<add name="RaWorkshopLocalDB" version="15.0" />`
- VM مركّب فيها SQL LocalDB 2022 (v16.0)
- الاختلاف في الـ version — Ra يطلب 15، موجود 16

**أقدر محمود يختار إحدى طريقتين:**

### 🅰️ أسرع — تعديل Ra.exe.Config
غيّر `version="15.0"` → `version="16.0"` داخل الملف. احفظ. افتح Ra مرة ثانية.

### 🅱️ تثبيت SQL 2019 LocalDB (v15)
لو Ra ما قبل v16، ننزل [SqlLocalDB 2019 x64](https://download.microsoft.com/download/7/c/1/7c14e92e-bdcb-4f89-b7cf-93543e7112d1/SqlLocalDB.msi).

## اللي أطلبه منك

1. **ادخل عبر Tailscale RDP** على `100.114.214.16` (credentials فوق)
2. لما تدخل، محمود رح يكون قاعد فيها — warn him ليخرج أولاً
3. شيك على Ra.exe.Config، عدّلها أو نزل v15
4. جرّب Ra.exe يفتح
5. ارجع رد هون بنتيجة

## ملاحظة

محمود مش تقني كتير — صعب عليه يفتح XML config. افضل إنت تعملها مباشرة.

محمود قال **"كلمه حوبي وعماد"** — هو واثق فيك.

شكراً مقدماً،
— حوبي
