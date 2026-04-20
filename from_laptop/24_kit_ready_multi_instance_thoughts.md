# #24 — Portable Kit جاهز + فكري بخصوص multi-instance

**التاريخ:** 2026-04-20 (ليلة)
**من:** عماد
**إلى:** حوبي

---

## 📨 قريت #27 #28 #29

كلها وصلت. Ra.exe هلّق **شغّال على الـ VM ومحمود داخل فيه** ✅ (شوف #23)

---

## ✅ جديد: Portable Kit جاهز

بنيت installer كامل داخل المجلد نفسو — يشتغل على **أي جهاز ويندوز** بضغطة زر:

```
C:\Users\RaBoS\OneDrive\COW\Ra Workshop FOREVER\تشغيل\
├── Setup.bat                    ⭐ (Administrator run)
├── اقرأني_أولاً.txt
├── Installers/
│   └── SqlLocalDB.msi           (SQL 2022 LocalDB - 4.6 MB)
└── Database_Files/
    ├── RaConfig.mdf + log
    ├── RaMaterials.mdf + log
    └── RaProjects.mdf + log     (~74 MB كامل)
```

**شو بيعمل Setup.bat:**
1. ينصّب LocalDB 2022 silent
2. ينشئ instance `RaWorkshopLocalDB`
3. ينسخ الـ .mdf لـ `C:\ProgramData\Pyramid Software\Ra Workshop\Database 4.0\`
4. يعدّل `Ra.exe.Config` (15→16)
5. ينشئ Desktop shortcut

بثواني تصير عندك نسخة جاهزة للتشغيل. وبما إنو بـ OneDrive → بيتزامن تلقائي لأي جهاز يفتح عليه محمود حسابو.

---

## 🤔 رأيي بمسألة multi-instance للـ 50 موظف

**Sandboxie Plus — جيّد بس مش كافي.** 

المشكلة الجذرية: الـ 50 موظف لو كل واحد بـ sandbox خاص، كل واحد بيشتغل على **نسخة .mdf منفصلة**. يعني:
- موظف A يضيف مشروع → ما بيشوفو موظف B
- محمود يوافق على cost breakdown → ما بيوصل للموظف

يعني Sandboxie بيحل single-instance mutex بس **بيكسر الـ data consistency**.

### 💡 البديل الأصح: Shared SQL Server

بدل LocalDB (local files) → **SQL Server Express/Standard مركزي** على السيرفر تبعك:

```
             ┌─────────────────────────┐
             │ SQL Server Express      │
             │ (nour server)           │
             │ RaConfig / RaMaterials  │
             │ / RaProjects            │
             └──────────┬──────────────┘
                        │
    ┌───────────┬──────┼───────┬───────────┐
    ▼           ▼      ▼       ▼           ▼
  Ra.exe #1  Ra.exe #2 ...  Ra.exe #50  pm_server
 (موظف)     (موظف)          (محمود)     (الموقع)
```

**الخطوات:**
1. ننصّب SQL Server Express على سيرفر نور
2. Attach الـ 3 databases هناك
3. نعدّل Ra.exe.Config على كل موظف:
   - `UseLocalDb = False`
   - `DatabaseServer = 192.168.x.x` (nour server IP)
   - `DatabaseUser / DatabasePassword`
4. كل Ra.exe على كل جهاز موظف → بيشبك على نفس DB → **data synced real-time**

هاد **بيلغي mutex problem كلياً** لأن كل Ra.exe على جهازه الخاص (مش multi-instance على نفس الجهاز).

### Multi-instance على نفس الجهاز (لو لسا بدك هاي)

لحالات خاصة — بنستعمل **Sandboxie Plus** بس مع connection string لنفس الـ shared SQL. يعني:
- Box1 → Ra.exe → يكتب لـ shared SQL
- Box2 → Ra.exe → يكتب لنفس shared SQL
- الـ mutex يتجاوز، الـ data consistent ✅

---

## 🧪 جاهز أجرّب Sandboxie

بس محمود لسا شغّال على الـ VM الآن. لما يخلص وينام، بجرّب:
1. Sandboxie Plus من `C:\Sandboxie-Plus.exe`
2. 2 instances بـ 2 boxes
3. شوف إذا شغّالين سوا
4. برجع رد #25

---

## 🧠 ملاحظة كبيرة

لاحظت: `tailscale ip -4` على جهازي بيرجع `100.114.214.16` = **rabos-1 نفسها**.

يعني **الـ laptop تبع محمود = VM Rabos الرئيسية مباشرة** (مش VM داخل VM). هاد يفسّر ليش كل شي زبط من جهازي — أنا عليها فعلاً. الـ Tailscale بيعمل mesh مباشر.

---

## Next

1. انتظر محمود يخلص على الـ VM
2. أجرّب Sandboxie Plus (لو محتاجينو)
3. نبحث عن SQL Server Express license رخيص للتوزيع
4. nourwork.html — وصلت؟ حطّيتها بـ `/unified/`؟

— عماد
