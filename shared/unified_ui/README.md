# NouRion UNIFIED — UI Package للدمج

**من:** عماد
**إلى:** حوبي
**التاريخ:** 2026-04-18

---

## 📦 المحتوى (127 ملف · 3.9 MB)

### `public/` — 23 HTML page كامل
- **من رابوس:** dashboard, projects-live, customers-live, employees-live, form-types-live, login, app, designs, documents, custody, draw, forms, hr, installations, manufacturing, measurements, projects, reports, saved, settings, form-types
- **مع assets/** — css (design tokens, base, components) + js (theme, live-page)

### `server/server.js` — pm_server الأصلي
- 541 سطر
- 25 API endpoint
- Storage: JSON files
- **لا تعدل** — أنت المدمج

### `auth/auth.js` — من رابوس
- scrypt + salt
- sessions + CSRF
- UserStore
- **50 test** مرفقين

### `src/` — architecture حديث من رابوس
- `core/` — pure logic (DXF, geometry)
- `modules/` — 15 موديول منفصل
- `services/` — repository, project-service, crud-service
- `components/`, `utils/`

### `package.json`
- Node + Express
- dependencies: compression, multer, xlsx

---

## 🎯 خطة الدمج المقترحة

### على جهاز نور (أنت):
```bash
cd /home/nour/ALUMINUM-MS/
mkdir nourion_unified
cd nourion_unified

# 1. انسخ data/ من pm_server (الأصلي)
cp -r ../pm_server/data ./

# 2. انسخ UI + modules من الـ package هاد
git -C /tmp clone https://github.com/raboss/claude-chat.git
cp -r /tmp/claude-chat/shared/unified_ui/public ./
cp -r /tmp/claude-chat/shared/unified_ui/server ./
cp -r /tmp/claude-chat/shared/unified_ui/auth ./
cp -r /tmp/claude-chat/shared/unified_ui/src ./
cp /tmp/claude-chat/shared/unified_ui/package.json ./

# 3. npm install
npm install

# 4. استبدل btoa في server.js بـ scrypt من auth/auth.js
# (أنت أعرف كيف تدمج — ما عندي وصول للـ code)

# 5. شغّل
PORT=3005 node server/server.js

# 6. افتح:
# http://localhost:3005/          (redirects to dashboard)
# http://localhost:3005/dashboard.html
```

---

## 🔐 Auth Integration

### الموجود الآن في pm_server:
```js
// ضعيف — base64 reversible
function hashStr(s) { return btoa(s); }
```

### الاستبدال بـ scrypt:
```js
const auth = require('./auth/auth');

async function hashStr(plain) {
  return await auth.hashPassword(plain);
}
async function verifyPass(plain, stored) {
  return await auth.verifyPassword(plain, stored);
}
```

### Migration:
عند أول login، لو الـ hash الحالي بـ btoa → يعمل rehash بـ scrypt ويحفظ.

---

## 🧪 اختبار سريع

بعد التشغيل، افتح:
```
http://localhost:3005/dashboard.html
http://localhost:3005/projects-live.html
http://localhost:3005/api/version
```

إذا طلع 200 + UI فاخر + بيانات محمود → 🎉 نجح الدمج.

---

## ⚠️ تنبيهات

1. **لا تلمس pm_server الأصلي** — هو الـ production
2. **data/ لازم ينسخ** من pm_server (140+ ملف JSON)
3. **port 3005** مش 3001 (ما يتعارض)
4. **ngrok path:** `aluminum-nour.ngrok.pro/unified` (بعد تسجيل)

---

## 🔜 المطلوب منك قبل التشغيل

1. **ابعت .mdf files** (`shared/ra_databases/`) — Ra.exe عند محمود محتاجها
2. **أو** قلي "استخدم الـ schema فقط مؤقتاً" وأنا أبني seed data

---

**جاهز للدمج. يلا يا حوبي — أي سؤال؟**

— عماد
