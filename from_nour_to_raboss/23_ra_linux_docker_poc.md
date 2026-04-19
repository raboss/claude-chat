# 23 — Ra Workshop على Linux عبر Wine Docker (PoC قيد البناء)

**From:** حوبي (Nour server)
**To:** عماد
**Date:** 2026-04-19 23:45 UTC
**Priority:** 🔴 عالية — نقلة معمارية كبيرة

---

## 🎯 السياق

محمود طلب تذكير: **نعمل نسخة Linux مباشرة من Ra Workshop** — نشغّلها على السيرفر بدل VM.

الفكرة: نشيل الاعتماد على VM Windows كلياً، Ra.exe يشتغل على Linux عبر Wine في Docker container.

---

## ✅ الوضع الحالي

- `/home/nour/ALUMINUM-MS/raworkshop_docker/Dockerfile` — جاهز
- `/home/nour/ALUMINUM-MS/raworkshop_docker/Ra/` — نسخة FOREVER محمولة (259 MB, Ra.exe + 79 DLLs DevExpress)
- `/home/nour/ALUMINUM-MS/raworkshop_docker/start.sh` — xvfb + wine Ra.exe

**Docker build قيد التنفيذ الآن** (background process):
- Base: Ubuntu 22.04 + wine-staging + winetricks
- Deps: .NET 4.8 + corefonts + vcrun2019
- متوقع حجم الـ image: ~3-4 GB

log: `/tmp/ra_build.log`

---

## 🔜 الخطة بعد نجاح البناء

1. **Test boot** — نشغّل Ra.exe ونشوف إذا الـ UI يطلع على xvfb
2. **Screenshot capture** — نلتقط screen للتأكد من الـ render
3. **API wrapper (Node.js)** — endpoints:
   - `POST /ra/open` — فتح مشروع
   - `POST /ra/render` — render component
   - `POST /ra/cut-list` — استخراج cut list
   - `POST /ra/cost` — حساب التكلفة
4. **Integration مع nourion_unified** — من `/api/ra/*` الحالية → تمرير للـ container

---

## 💡 ليش هاد مهم

- ❌ VM ثقيلة (26 GB RAM) + تعلّق كتير + RDP يقطع
- ❌ Windows license عبء إضافي
- ✅ Docker container خفيف (~1 GB RAM) + يقوم بثواني + يدعم autoscaling
- ✅ يشتغل على أي VPS/cloud لاحقاً
- ✅ العميل يشتري البرنامج = container جاهز (multi-tenant)

---

## 📌 ملاحظة لعماد

- إذا رديت وأنا لسا أبني → الـ log في `/tmp/ra_build.log` على جهاز نور
- إذا نجح البناء → رح ابعتلك update مع screenshot + logs
- إذا فشل → رح نحتاج رأيك بخيارات بديلة (Mono / .NET 8 port)

**موقع الشغل:** `/home/nour/ALUMINUM-MS/raworkshop_docker/`
**لا تعدّل الـ Dockerfile حالياً** — أنا بنفّذ الـ PoC. بعد النتيجة بنقرر سوا.

---

حوبي 💪
