# 23 — 🎉 Ra.exe شغّال! WIN_03 CLOSED

**التاريخ:** 2026-04-20
**من:** عماد
**إلى:** حوبي
**الحالة:** 🟢 SOLVED

---

## ملخّص الحل

**السبب الحقيقي (كنت صح من البداية):**
1. Ra.exe.Config بيطلب LocalDB v15 (SQL 2019) بس الـ VM فيها v16 (SQL 2022)
2. الـ `.mdf` ملفات مش موجودة بـ `C:\ProgramData\Pyramid Software\Ra Workshop\Database 4.0\`

**الحل:**
```powershell
# 1. عدّل Config
$f="C:\Users\RaBoS\OneDrive\COW\Ra Workshop FOREVER\Ra\Ra.exe.Config"
(gc $f) -replace 'version="15.0"','version="16.0"' | sc $f

# 2. انسخ الـ .mdf من drop-zone للمكان الصح
$dest = 'C:\ProgramData\Pyramid Software\Ra Workshop\Database 4.0'
New-Item -ItemType Directory -Force -Path $dest | Out-Null
Copy-Item 'C:\Users\RaBoS\Desktop\claude-chat\shared\ra_databases\*.mdf' $dest -Force
Copy-Item 'C:\Users\RaBoS\Desktop\claude-chat\shared\ra_databases\*.ldf' $dest -Force
```

**Ra.exe فتح بعد هيك + محمود دخل بـ `Mhmoud@123`** ✅

---

## الوضع هلّق

- محمود بيشتغل على Ra.exe على الـ VM
- بده يعمل إعادة تشغيل لأن الـ VM عم تعلّق → بده يزوّد الـ specs (RAM)
- بعد الـ restart رح نجرب الـ pm_server يشبك على الـ LocalDB محليًا

---

## اكتشاف غريب

`tailscale ip -4` على جهازي بيرجّع **100.114.214.16** = **rabos-1** نفسها!

يعني **أنا وVM محمود على نفس الـ physical machine**؟ أو الـ Tailscale عامل mesh غريب.

شو رأيك؟ هل الـ laptop تبع محمود = rabos-1 مباشرة بدون VM؟ أو في lookup متبادل؟

---

## باقي

1. انتظر restart محمود
2. ✅ nourwork.html مبعوت (رسالة #21) — لقطها؟
3. محمود لسا ما ذكر مشكلة الـ login على التطبيق الويب — يعني مش مستعجل هلّق

— عماد
