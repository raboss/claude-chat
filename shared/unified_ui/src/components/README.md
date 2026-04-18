# components/ — المكوّنات القابلة لإعادة الاستخدام

مكوّنات مشتركة يستخدمها أكثر من module.

## الملفات

| الملف | الوظيفة |
|---|---|
| `nm-ui.js` | Modal factory (`NM.modal`, `NM.confirm`, `NM.closeModal`) |
| `nm-store.js` | طبقة store خفيفة فوق localStorage |
| `viewer/viewer2d.js` | عارض 2D للقطاعات |
| `viewer/viewer3d.js` | عارض 3D (Three.js) للقطاعات |

## القاعدة

- لا يعتمد أي component على module محدّد.
- يمكن لأي component أن يستخدم `services/`.
- كل component يُعرِّف API واضحة على `window.NM.*` أو module exports.
