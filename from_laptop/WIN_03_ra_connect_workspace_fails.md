# WIN_03 — Ra.exe FrmMain يعمل dispose — ConnectClientToWorkspace null

**التاريخ:** 2026-04-20
**من:** عماد
**إلى:** حوبي
**الأولوية:** 🔴 محمود عم يحاول يشتغل على Ra الآن

---

## المشكلة

محمود بده يفتح Ra.exe على الـ VM (192.168.122.106) ويشتغل على مشاريعه، لكن النافذة **ما بتظهر**.

## ما جربت

1. ✅ نصّبت SQL LocalDB 2022 (v16)
2. ✅ أنشأت instance `RaWorkshopLocalDB` — Running
3. ✅ شغّلت `RaServer.exe` قبل `Ra.exe`
4. ✅ حذفت state files (`FrmMain.State.dat`, `FrmAuthenticate.State.dat`)
5. ✅ شغّلت Ra.exe as Administrator
6. ✅ عملت `ShowWindow + SetForegroundWindow` على الـ handle
7. ❌ النافذة بتظهر `Visible=False` وعنوانها فاضي

## Stack trace (من Ra.log.xml)

```
System.NullReferenceException: Object reference not set to an instance of an object.
   at Pyramid.Ra.FrmMain.ConnectClientToWorkspace()
   at Pyramid.Ra.FrmMain..ctor(String[] applicationArguments)
   at Pyramid.Ra.Program.A(String[] )
```

ثم:
```
System.ObjectDisposedException: Cannot access a disposed object.
Object name: 'FrmMain'.
   at System.Windows.Forms.Control.CreateHandle()
   ...
   at Pyramid.Framework.FrameworkApplication.Initialize(Form mainForm)
```

## ما لم أجرب (محتاج منك)

### 1. Ra.exe.Config يقول v15.0
```xml
<localdbinstances>
  <add name="RaWorkshopLocalDB" version="15.0" />
</localdbinstances>
```
هل نحتاج LocalDB v15 بالذات (SQL 2019)؟ ما لقيت winget package.

### 2. Remoting settings
Ra.exe يتصل بـ RaServer.exe عبر .NET Remoting. هل فيه:
- Port محدد؟
- مفتاح تشفير؟
- User.config في مكان ثاني؟

### 3. FirstRun setup
Ra.exe.Config فيه `<setting name="FirstRun" value="True">`. هل Ra.exe أول ما يبدأ يبغى wizard للإعدادات؟

## المسار الحالي

```
Ra.exe location: C:\Users\RaBoS\OneDrive\COW\Ra Workshop FOREVER\Ra\
.mdf files:      مش موجودة (لسا بانتظارك)
user.config:     C:\Users\RaBoS\AppData\Roaming\Pyramid Software\Ra Workshop\4.1.0.0\
```

## طلبي

أبعتلي **ملف user.config** الصحيح اللي مع Ra.exe على جهاز نور (اللي بيفتح بنجاح). عشان أنسخه في نفس المسار عندي.

أو **screenshot** للإعدادات لما Ra يشتغل عندك عشان أطابقها.

**محمود منتظر — يبغى يشتغل الآن.**

— عماد
