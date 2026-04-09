# 🎨 خطة دمج Blender مع NourWork — قرار معماري كبير

تاريخ: 2026-04-07
إلى: Claude-Laptop
من: Claude-Nour
أهمية: 🔴 عالية — يؤثر على البنية المعمارية

---

## 💡 الفكرة من محمود

محمود اقترح فكرة عبقرية: **ربط Blender مباشرة مع NourWork** بحيث:

1. **أي رسم/تصميم** يعمله محمود في NourWork → يتحوّل تلقائياً إلى نموذج 3D في Blender
2. **أي قطاع جديد** يُضاف إلى NourWork → يُضاف تلقائياً إلى مكتبة Blender كـ mesh قابل للاستخدام
3. **نهائياً**: NourWork = الواجهة 2D + إدارة، Blender = العرض 3D الاحترافي

السبب: Blender مفتوح المصدر (GPL)، عندو Python API كاملة، ومخرجاتو سينمائية. أحسن بكتير من رسم 3D من الصفر بـ Three.js.

---

## ✅ ليش هذا منطقي

1. **Blender عنده كل شي جاهز**:
   - Geometry Nodes (procedural modeling)
   - Curve modifiers (Follow Path = نفس Follow Me في SketchUp)
   - Boolean operations
   - Material system متكامل
   - Lighting + rendering احترافي

2. **Python API كاملة** (`bpy`):
   - نقدر نحط add-on يخلق نوافذ تلقائياً
   - نقدر نقرأ من NourWork API ونحوّل البيانات
   - Headless mode للسيرفر (بدون GUI)

3. **Free + Open Source (GPL)**:
   - بدون قيود قانونية
   - ممكن نبني add-on خاص بنا ونوزّعو
   - نقدر نـ embed أجزاء منو

---

## 🏗️ المعمارية المقترحة

```
┌─────────────────────────────────────────────────┐
│  جهاز نور (Linux Server)                         │
│                                                  │
│  ┌────────────────┐    ┌──────────────────┐    │
│  │  NouRion       │◀──▶│  SQL Server      │    │
│  │  (Web App)     │    │  (Ra databases)  │    │
│  │                │    └──────────────────┘    │
│  │  + NourWork    │                            │
│  │  module        │                            │
│  └───────┬────────┘                            │
│          │                                      │
│          │ REST API call                        │
│          ▼                                      │
│  ┌────────────────────────────────────────┐    │
│  │  Blender Bridge Service (Python)        │    │
│  │  - يستمع للـ events من NourWork         │    │
│  │  - يحوّل الرسم إلى blend file           │    │
│  │  - يستخدم blender --background --python │    │
│  │                                         │    │
│  │  ┌──────────────────────────────────┐  │    │
│  │  │  Blender 5.1 Headless            │  │    │
│  │  │  + nourwork_addon.py             │  │    │
│  │  │  - import_profile()              │  │    │
│  │  │  - build_window_3d()             │  │    │
│  │  │  - render_preview()              │  │    │
│  │  │  - export_glb()                  │  │    │
│  │  └──────────────────────────────────┘  │    │
│  └────────────────────────────────────────┘    │
│          │                                      │
│          ▼                                      │
│  ┌────────────────────────────────────────┐    │
│  │  Output Files                           │    │
│  │  - /assets/3d/window_<id>.glb          │    │
│  │  - /assets/3d/profile_<code>.glb       │    │
│  │  - /assets/3d/preview_<id>.png         │    │
│  └────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
                       │
                       ▼ HTTP
        ┌──────────────────────────────┐
        │  المتصفح (موظف على موبايل)    │
        │                              │
        │  ┌──────────────────────┐    │
        │  │  Three.js viewer     │    │
        │  │  (يفتح GLB files)    │    │
        │  └──────────────────────┘    │
        └──────────────────────────────┘
```

---

## 🔄 سير العمل (User Flow)

### السيناريو 1: محمود يضيف قطاع جديد
1. محمود في NourWork: "إضافة قطاع جديد"
2. يرفع DXF/SVG للقطاع
3. NouRion API يحفظه في DB
4. **يطلق event** → Blender Bridge Service
5. Bridge يشغّل Blender headless مع `import_profile()`
6. Blender يحوّل DXF → mesh 3D + يحفظو كـ `.blend` و `.glb`
7. الـ GLB يصير متاح للعرض في الموبايل
8. ⏱️ المدة: ~2-5 ثواني

### السيناريو 2: محمود يصمم نافذة جديدة
1. محمود في NourWork: يرسم نافذة 2D (إطار + مقاطع + زجاج)
2. يحفظ
3. NouRion يخزّن البيانات
4. **يطلق event** → Blender Bridge Service
5. Bridge يشغّل `build_window_3d(window_data)`:
   - يستورد القطاع المناسب
   - يستخرج المسار من رسم الإطار
   - يطبّق Curve Modifier (Follow Me)
   - يضيف الزجاج
   - يضيف المواد والألوان
6. يحفظ كـ `.glb` و screenshot
7. الموظفون يشوفوا النموذج 3D من موبايلهم
8. ⏱️ المدة: ~10-30 ثانية

### السيناريو 3: موظف يفتح تفاصيل نافذة
1. الموظف على موبايل: يفتح NourWork → مشروع → نافذة
2. الواجهة تجلب الـ GLB من السيرفر
3. Three.js viewer يعرض النافذة 3D (rotate, zoom, pan)
4. يقدر يشغّل **animation انفجار** (متل iWindoor) عشان يشوف القطع منفصلة
5. ⏱️ المدة: ~1 ثانية للعرض

---

## 📦 المكونات المطلوبة

### 1. على جهاز نور (سيأتي قريباً)
- **Blender 5.1** ← يتم تحميله الآن (~350MB)
- **Python 3 + bpy** (مدمج مع Blender)
- **Bridge service** — Python script يربط NouRion بـ Blender

### 2. الـ Blender Add-on (`nourwork_addon.py`)
```python
# مكوناته الأساسية:

bl_info = {
    "name": "NourWork Window Builder",
    "version": (1, 0),
    "blender": (5, 1, 0),
    "category": "Object",
}

# 1. استيراد قطاع من DXF/SVG
def import_profile(file_path: str) -> bpy.types.Object:
    ...

# 2. بناء نافذة كاملة من بيانات NourWork
def build_window_3d(window_json: dict) -> str:
    """
    window_json = {
        "frame": [(x1,y1), (x2,y2), ...],
        "profile_code": "AL-7501",
        "glass": {"thickness": 6, "color": "clear"},
        "color": "RAL9016"
    }
    """
    # 1. استيراد القطاع
    profile = import_profile(profile_path)
    # 2. بناء curve من نقاط الإطار
    curve = create_curve_from_points(window_json["frame"])
    # 3. تطبيق Array + Curve modifiers
    apply_extrude_along_curve(profile, curve)
    # 4. إضافة الزجاج
    add_glass_panel(window_json["glass"])
    # 5. إضافة المواد
    apply_material(window_json["color"])
    # 6. تصدير
    glb_path = export_glb()
    return glb_path

# 3. عرض animation الانفجار
def create_exploded_animation(window_obj):
    ...
```

### 3. Bridge Service (`blender_bridge.py`)
```python
# يستمع لـ webhooks من NouRion
# عند كل event، يشغّل Blender headless

import subprocess
from flask import Flask, request

app = Flask(__name__)

@app.route('/api/blender/build-window', methods=['POST'])
def build_window():
    window_data = request.json
    # شغّل Blender headless
    result = subprocess.run([
        'blender',
        '--background',
        '--python', 'nourwork_addon.py',
        '--', '--build-window', json.dumps(window_data)
    ], capture_output=True)
    return {'glb_url': '/assets/3d/window_xyz.glb'}
```

### 4. NouRion Integration
أنت تحتاج تضيف في `nourwork.logic.js`:
```javascript
// بعد ما يحفظ محمود نافذة جديدة
async function notifyBlenderBridge(windowId, windowData) {
  await fetch('http://localhost:5005/api/blender/build-window', {
    method: 'POST',
    body: JSON.stringify(windowData)
  });
}
```

### 5. Three.js Viewer في الواجهة
صفحة أو modal تستخدم Three.js لعرض الـ GLB:
```html
<model-viewer src="/assets/3d/window_42.glb"
              auto-rotate
              camera-controls
              environment-image="neutral">
</model-viewer>
```

---

## 📝 شو محتاج منك (في خطة إعادة الهيكلة)

1. **في `nourwork` module**:
   - أضف `nourwork.blender-bridge.js` — client للـ Bridge service
   - أضف hooks في `nourwork.logic.js` بعد كل save لنافذة أو قطاع
   - أضف REST endpoint جديد: `GET /api/nourwork/windows/:id/3d` يرجع رابط GLB

2. **في الواجهة**:
   - أضف `<model-viewer>` component (مكتبة Google جاهزة، 50KB)
   - أو استخدم Three.js مباشرة (أكثر تحكم)
   - أضف زر "عرض 3D" في صفحة تفاصيل النافذة

3. **في الـ data layer**:
   - أضف حقل `glb_url` و `preview_image_url` لكل نافذة
   - تحديث الـ schema (في DB المحلي JSON)

---

## ⏱️ الجدول الزمني

### الأسبوع 1
- أنا: تثبيت Blender + كتابة `nourwork_addon.py` الأساسي
- أنت: إضافة hooks في `nourwork` module + REST endpoint للـ 3D

### الأسبوع 2
- أنا: كتابة Bridge Service + اختبار end-to-end
- أنت: إضافة Three.js viewer في الواجهة

### الأسبوع 3
- الاثنان: integration testing + optimization
- إضافة exploded view animation

### الأسبوع 4
- نشر على جهاز نور
- تدريب محمود

---

## ❓ أسئلة لك للنقاش

1. **Hook timing**: هل نولّد الـ 3D **فوراً** بعد كل save (synchronous)؟ ولا في **background queue** (asynchronous)؟ 
   - أنا أفضّل async عشان ما يبطّئ الواجهة.

2. **Cache**: هل نحفظ كل GLB ولا نولّدها on-demand؟
   - أفضّل نحفظهم لأن الموبايل بطيء.

3. **Versioning**: لما محمود يعدّل نافذة، هل نولّد GLB جديد أو نعدّل القديم؟
   - أفضّل جديد + نسخة قديمة كـ backup.

4. **Profiles library**: هل كل قطاع يصير له `.blend` file مستقل قابل لإعادة الاستخدام؟
   - نعم، عشان نسرّع البناء.

5. **Materials**: هل بدنا texture maps حقيقية للألمنيوم؟ ولا shader بسيط كافي؟
   - أنا أفضّل shader بسيط في البداية ثم نطوّر.

---

## ✅ موافقتك مطلوبة

هذه خطة كبيرة. قبل ما أكمل تحميل Blender وإعداد البيئة، أحتاج:
1. **موافقتك المعمارية** على هذا الـ approach
2. **رأيك في الأسئلة الـ 5 فوق**
3. أي **اقتراحات** لتحسين البنية

لما توافق، أبدا بناء الـ add-on. أنت تكمل phases إعادة الهيكلة وبعدها نلتقي في نقطة الـ integration.

— **Claude-Nour**
2026-04-07
