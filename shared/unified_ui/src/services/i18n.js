'use strict';

// ============================================================
//  i18n – Full Auto-Translation System
//  Translates ALL visible UI text without modifying other files
// ============================================================

// Current language — check URL param first (most reliable), then localStorage
var _lang = 'ar';
try {
  var _urlP = new URLSearchParams(window.location.search).get('lang');
  if(_urlP === 'en' || _urlP === 'ar') {
    _lang = _urlP;
    try { localStorage.setItem('pm_lang', _urlP); } catch(e2){}
    // Clean URL without reload
    if(window.history && window.history.replaceState) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  } else {
    _lang = localStorage.getItem('pm_lang') || 'ar';
  }
} catch(e){ _lang = 'ar'; }

// ── Complete Arabic → English Dictionary ──────────────────
// Every Arabic UI string in the app mapped to English
var _dictArToEn = {
  // Navigation
  'المشاريع': 'Projects',
  'التقارير': 'Reports',
  'السجلات': 'Records',
  'المستندات': 'Documents',
  'التركيبات': 'Installations',
  'الرسومات': 'Drawings',
  'الإعدادات': 'Settings',
  'المقاسات': 'Measurements',

  // Common buttons
  'حفظ': 'Save',
  'إلغاء': 'Cancel',
  'حذف': 'Delete',
  'تعديل': 'Edit',
  'إضافة': 'Add',
  'إغلاق': 'Close',
  'بحث': 'Search',
  'تصدير': 'Export',
  'طباعة': 'Print',
  'تحديث': 'Refresh',
  'تحديث البيانات': 'Refresh Data',
  'النسخ الاحتياطي': 'Backup',
  'استعادة': 'Restore',
  'جديد': 'New',
  'موافق': 'OK',
  'تأكيد': 'Confirm',
  'تسجيل الدخول': 'Login',
  'تسجيل الخروج': 'Logout',
  'تثبيت': 'Install',
  'الإشعارات': 'Notifications',
  'تبديل السمة': 'Toggle Theme',
  'نعم': 'Yes',
  'لا': 'No',
  'تطبيق': 'Apply',
  'اختيار': 'Select',
  'عرض': 'View',
  'تنزيل': 'Download',
  'رفع': 'Upload',
  'نسخ': 'Copy',
  'لصق': 'Paste',
  'معاينة': 'Preview',
  'فتح': 'Open',
  'إرسال': 'Send',
  'تراجع': 'Undo',
  'إعادة': 'Redo',
  'مسح': 'Clear',
  'فلترة': 'Filter',
  'ترتيب': 'Sort',
  'الكل': 'All',
  'تم': 'Done',
  'التالي': 'Next',
  'السابق': 'Previous',
  'إنهاء': 'Finish',
  'بدء': 'Start',

  // Auth
  'اسم المستخدم': 'Username',
  'كلمة المرور': 'Password',
  'أدخل الاسم وكلمة المرور': 'Enter username and password',
  'اسم المستخدم أو كلمة المرور غير صحيحة': 'Invalid username or password',
  'مرحباً': 'Welcome',
  'دخول': 'Sign In',

  // Labels
  'الاسم': 'Name',
  'التاريخ': 'Date',
  'الحالة': 'Status',
  'الشركة': 'Company',
  'المنطقة': 'Region',
  'المعرض': 'Gallery',
  'العميل': 'Client',
  'رقم العقد': 'Contract No.',
  'الهاتف': 'Phone',
  'ملاحظات': 'Notes',
  'الإجمالي': 'Total',
  'الكمية': 'Quantity',
  'السعر': 'Price',
  'الوصف': 'Description',
  'النوع': 'Type',
  'العرض': 'Width',
  'الارتفاع': 'Height',
  'المساحة': 'Area',
  'العدد': 'Count',
  'الوحدة': 'Unit',
  'القيمة': 'Value',
  'النسبة': 'Percentage',
  'بدون': 'None',
  'غير معروف': 'Unknown',
  'مطلوب': 'Required',
  'اختياري': 'Optional',
  'الموقع': 'Location',
  'المسؤول': 'Manager',
  'الفني': 'Technician',
  'المقاول': 'Contractor',
  'المشرف': 'Supervisor',
  'رقم الجوال': 'Mobile',
  'البريد': 'Email',
  'العنوان': 'Address',
  'المدينة': 'City',
  'الدولة': 'Country',

  // Status
  'جاري': 'In Progress',
  'مكتمل': 'Completed',
  'معلق': 'Pending',
  'ملغي': 'Cancelled',
  'متأخر': 'Delayed',
  'تم التسليم': 'Delivered',
  'قيد التنفيذ': 'In Execution',
  'جديد': 'New',
  'نشط': 'Active',
  'مغلق': 'Closed',
  'تركيب': 'Installation',
  'تصنيع': 'Manufacturing',

  // Messages
  'هل أنت متأكد من الحذف؟': 'Are you sure you want to delete?',
  'تم الحفظ بنجاح': 'Saved successfully',
  'تم الحذف بنجاح': 'Deleted successfully',
  'تم التصدير بنجاح': 'Exported successfully',
  'لا توجد مشاريع': 'No projects found',
  'لا توجد بيانات': 'No data available',
  'لا توجد ملفات': 'No files found',
  'خطأ في الاتصال بالسيرفر': 'Server connection error',
  'تم إنشاء المجلد': 'Folder created',
  'المجلد غير موجود': 'Folder not found',
  'المجلد فارغ أو غير موجود': 'Folder is empty or not found',
  'تم تحديث البيانات': 'Data updated',
  'تم تحديث جميع البيانات': 'All data updated',
  'فشل التحديث': 'Update failed',
  'خطأ بالتحديث': 'Update error',
  'جارٍ التحميل...': 'Loading...',
  'جارٍ الحفظ...': 'Saving...',
  'جارٍ الرفع...': 'Uploading...',
  'جارٍ الحذف...': 'Deleting...',
  'تمت العملية بنجاح': 'Operation successful',
  'حدث خطأ': 'An error occurred',
  'تحذير': 'Warning',
  'معلومات': 'Information',
  'حذف هذا الملف؟': 'Delete this file?',
  'حذف هذا القطاع؟': 'Delete this profile?',
  'حذف هذا النوع؟': 'Delete this type?',
  'حذف هذا اللون؟': 'Delete this color?',
  'الرجاء إدخال اسم القطاع': 'Please enter profile name',
  'الرجاء إدخال جميع الحقول': 'Please fill all fields',
  'الكود موجود مسبقاً': 'Code already exists',
  'تعذّر تحميل مكتبة XLSX': 'Failed to load XLSX library',
  'الملف لا يحتوي على بيانات كافية': 'File does not contain enough data',
  'لم يتم العثور على بيانات صالحة. تحقق من تنسيق الملف.': 'No valid data found. Check file format.',
  'الرجاء إدخال الكود والاسم': 'Please enter code and name',

  // Projects
  'مشروع جديد': 'New Project',
  'تعديل المشروع': 'Edit Project',
  'تفاصيل المشروع': 'Project Details',
  'ملفات المشروع': 'Project Files',
  'المراحل': 'Stages',
  'نسبة الإنجاز': 'Progress',
  'الميزانية': 'Budget',
  'تاريخ البداية': 'Start Date',
  'تاريخ النهاية': 'End Date',
  'اسحب الملفات هنا أو انقر للاختيار': 'Drag files here or click to select',
  'صور، PDF، Excel وغيرها': 'Images, PDF, Excel and more',
  'مجلد العميل على الجهاز': 'Client folder on device',
  'إنشاء المجلد': 'Create Folder',
  'فتح المجلد': 'Open Folder',
  'جلب الملفات من المجلد': 'Fetch Files from Folder',
  'جارٍ التحقق...': 'Checking...',
  'جارٍ الإنشاء...': 'Creating...',
  'المجلد غير موجود بعد': 'Folder not yet created',
  'المجلد موجود': 'Folder exists',
  'السيرفر غير متاح': 'Server unavailable',
  'جارٍ جلب الملفات من المجلد...': 'Fetching files from folder...',
  'تعذر الاتصال بالسيرفر': 'Cannot connect to server',
  'تعذر جلب الملفات': 'Cannot fetch files',
  'تم جلب': 'Fetched',
  'ملف جديد': 'new file(s)',
  'إجمالي': 'total',
  'المسار': 'Path',
  'ملفات العملاء': 'Client Files',
  'تم الفتح': 'Opened',
  'المجلد غير موجود — اضغط "إنشاء المجلد" أولاً': 'Folder not found — click "Create Folder" first',
  'مشروع غير موجود': 'Project not found',
  'جارٍ رفع الملفات...': 'Uploading files...',
  'تم رفع': 'Uploaded',
  'ملف إلى مجلد العميل': 'file(s) to client folder',
  'تم حفظ': 'Saved',
  'إعداداتي الشخصية': 'My Profile',
  'البريد الإلكتروني': 'Email',
  'رقم الهاتف': 'Phone Number',
  'مرحباً بك مديراً': 'Welcome Admin',
  'كلمة مرور المدير غير صحيحة': 'Admin password is incorrect',
  'كلمة المرور غير صحيحة': 'Password is incorrect',
  'اسم المستخدم غير موجود': 'Username not found',
  'مستخدمين مسجلين': 'registered users',
  'المعاينة للصور وPDF فقط': 'Preview for images and PDF only',
  'الملف غير متاح': 'File not available',
  'تم حذف الملف': 'File deleted',
  'ملف': 'File',

  // Settings
  'المستخدمون': 'Users',
  'الصلاحيات': 'Permissions',
  'عام': 'General',
  'الشركات': 'Companies',
  'المناطق': 'Regions',
  'المعارض': 'Galleries',
  'العلامة المائية': 'Watermark',
  'حول البرنامج': 'About',
  'إضافة مستخدم': 'Add User',
  'تعديل مستخدم': 'Edit User',
  'حذف المستخدم': 'Delete User',
  'الاسم الكامل': 'Full Name',
  'الدور': 'Role',
  'مدير': 'Admin',
  'مشرف': 'Supervisor',
  'فني': 'Technician',
  'مستخدم': 'User',
  'المدير': 'Admin',
  'فني تركيب': 'Installation Technician',

  // Drawing
  'خصائص': 'Properties',
  'المقاسات': 'Dimensions',
  'القطاع': 'Profile',
  'الزجاج': 'Glass',
  'البركلوز': 'Bead',
  'الحلق': 'Frame',
  'القاطع': 'Mullion',
  'تقسيمات الفتحة': 'Opening Divisions',
  'تقسيم العرض': 'Width Division',
  'تقسيم الارتفاع': 'Height Division',
  'القاطع الكامل': 'Full Mullion',
  'رأسي': 'Vertical',
  'أفقي': 'Horizontal',
  'شباك (4 أطراف)': 'Window (4 sides)',
  'باب (3 أطراف)': 'Door (3 sides)',
  'اللون RAL': 'RAL Color',
  'تصدير PNG': 'Export PNG',
  'رسم جديد': 'New Drawing',
  'حفظ الرسم': 'Save Drawing',
  'الرسومات المحفوظة': 'Saved Drawings',
  'لا توجد رسومات محفوظة': 'No saved drawings',
  'اختر قطاع': 'Select Profile',
  'خصم الزجاج': 'Glass Deduction',
  'ديكور': 'Decoration',
  'حلق': 'Section',
  'بركلوز': 'Bead',
  'المحيط': 'Perimeter',
  'شبكة': 'Grid',
  'ظاهرة': 'Visible',
  'أعراض الألواح': 'Panel Widths',
  'أعراض الألواح (مم):': 'Panel Widths (mm):',
  'ارتفاعات الألواح': 'Panel Heights',
  'ارتفاعات الألواح (مم):': 'Panel Heights (mm):',
  'اضغط على أي عنصر لعرض بياناته': 'Click any element to view its details',
  'القطاع من الكتالوج': 'Profile from catalog',
  'مقطع القطاع': 'Profile Section',
  'مقطع القطاع (تخطيطي)': 'Profile Section (schematic)',
  'إجمالي+ديكور': 'Total+Decoration',
  'فتحة الحلق': 'Section Opening',
  'مقاس الديكور': 'Decoration Size',
  'مقاس الحلق': 'Section Size',
  'كتالوج القطاعات': 'Profile Catalog',
  'كتالوج الزجاج': 'Glass Catalog',
  'ألوان الألمنيوم (RAL)': 'Aluminum Colors (RAL)',
  '+ إضافة': '+ Add',
  'نموذج Excel': 'Excel Template',
  'استيراد Excel/CSV': 'Import Excel/CSV',
  'خطوط الرسم': 'Drawing Lines',
  'خطوط عارضة T': 'T-Bar Lines',
  'تقسيمات الفتحة': 'Opening Divisions',
  'صورة مقطع القطاع': 'Profile Section Image',
  'اختر صورة': 'Select Image',
  'حفظ ملف': 'Save File',
  'استعادة من ملف': 'Restore from File',
  'نسخة احتياطية': 'Backup',
  'استيراد': 'Import',
  'لون الزجاج': 'Glass Color',
  '+ إضافة لون RAL مخصص': '+ Add Custom RAL Color',
  'كود RAL': 'RAL Code',

  // Drawing element info
  'حلق علوي': 'Top Frame',
  'حلق سفلي': 'Bottom Frame',
  'حلق أيسر': 'Left Frame',
  'حلق أيمن': 'Right Frame',
  'قاطع رأسي': 'Vertical Mullion',
  'قاطع أفقي': 'Horizontal Mullion',
  'بكلوز علوي': 'Top Bead',
  'بكلوز سفلي': 'Bottom Bead',
  'بكلوز أيمن': 'Right Bead',
  'بكلوز أيسر': 'Left Bead',
  'الطول الخارجي': 'Outer Length',
  'الطول الداخلي': 'Inner Length',
  'عرض القطاع': 'Profile Width',
  'قص البداية': 'Start Cut',
  'قص النهاية': 'End Cut',
  'الطول': 'Length',
  'كامل': 'Full',
  'مقسوم': 'Split',
  'مقاس الفتحة (قبل الخصم)': 'Opening Size (before deduction)',
  'عرض الفتحة': 'Opening Width',
  'ارتفاع الفتحة': 'Opening Height',
  'الخصم': 'Deduction',
  'خصم العرض': 'Width Deduction',
  'خصم الارتفاع': 'Height Deduction',
  'المقاس النهائي للزجاج': 'Final Glass Size',
  'العرض النهائي': 'Final Width',
  'الارتفاع النهائي': 'Final Height',
  'السماكة': 'Thickness',
  'التشكيل': 'Configuration',
  'السماكة الكلية': 'Total Thickness',
  'الاتجاه': 'Direction',
  'فتحة': 'Opening',
  'لوح': 'Panel',
  'زجاج': 'Glass',
  'الدرفة': 'Sash Type',

  // Reports
  'نظرة عامة': 'Overview',
  'حسب الشركة': 'By Company',
  'حسب المنطقة': 'By Region',
  'حسب الحالة': 'By Status',
  'مشاريع نشطة': 'Active Projects',
  'مشاريع مكتملة': 'Completed Projects',
  'القيمة الإجمالية': 'Total Value',
  'متوسط الإنجاز': 'Average Progress',
  'إجمالي المشاريع': 'Total Projects',
  'إجمالي القيمة': 'Total Value',
  'عدد المشاريع': 'Number of Projects',

  // Installations
  'فريق التركيب': 'Installation Team',
  'جدولة التركيب': 'Installation Schedule',
  'صور الموقع': 'Site Photos',
  'إضافة صورة': 'Add Photo',
  'صورة مرفقة': 'Photo Attached',
  'أمر تركيب': 'Installation Order',
  'أمر تسليم': 'Delivery Order',
  'بدأ التركيب': 'Installation Started',
  'انتهى التركيب': 'Installation Completed',
  'تسليم ابتدائي': 'Initial Delivery',
  'تسليم نهائي': 'Final Delivery',
  'صيانة': 'Maintenance',
  'نواقص': 'Deficiencies',
  'إضافة نقص': 'Add Deficiency',
  'مكتمل': 'Completed',

  // Measurements
  'رفع مقاسات': 'Upload Measurements',
  'مقاس تصنيع': 'Manufacturing Size',
  'زيرو زيرو (-8مم)': 'Zero Zero (-8mm)',

  // Forms
  'استمارة': 'Form',
  'استمارة تصنيع': 'Manufacturing Form',
  'أمر شراء': 'Purchase Order',
  'فاتورة': 'Invoice',
  'عرض سعر': 'Quotation',
  'محضر تسليم': 'Delivery Report',
  'كشف حساب': 'Account Statement',

  // Stages
  'توقيع العقد': 'Contract Signing',
  'امر تشغيل': 'Work Order',
  'جاهزية الموقع': 'Site Readiness',
  'رفع مقاسات': 'Measurements Upload',
  'عمل مخططات': 'Create Plans',
  'اعتماد المخططات': 'Approve Plans',
  'اعداد استمارة': 'Prepare Form',
  'طلب الخامات': 'Material Request',
  'دهان الخامات': 'Material Painting',
  'البدء بالتصنيع': 'Start Manufacturing',
  'اصدار مستخلص': 'Issue Extract',
  'سداد الدفعة الثانية': 'Second Payment',
  'توريد اعمال الالمنيوم': 'Aluminum Supply',
  'طلب الزجاج': 'Glass Request',
  'استلام الزجاج مع التوريد': 'Glass Receipt with Supply',
  'تركيب الزجاج': 'Glass Installation',
  'تشطيب الموقع': 'Site Finishing',

  // Table headers
  'م': 'No.',
  'اسم العميل': 'Client Name',
  'رقم العقد': 'Contract No.',
  'المبلغ': 'Amount',
  'الإنجاز': 'Progress',
  'إجراءات': 'Actions',
  'تاريخ الإنشاء': 'Created',
  'آخر تحديث': 'Last Update',

  // Misc
  'سري وخاص': 'Confidential',
  'Project Explorer': 'Project Explorer',
  'Inner view': 'Inner view',
  'Outer view': 'Outer view',
  'مم': 'mm',
  'م²': 'sqm',
  'ريال': 'SAR',
  'يوم': 'day',
  'أيام': 'days',
  'ساعة': 'hour',
  'دقيقة': 'minute',
  'شهر': 'month',
  'سنة': 'year',
  'اليوم': 'Today',
  'أمس': 'Yesterday',
  'هذا الأسبوع': 'This Week',
  'هذا الشهر': 'This Month',

  // Profile form
  'اسم القطاع': 'Profile Name',
  'الديكور': 'Decoration',
  'الديكور (مم)': 'Decoration (mm)',
  'واجهة القطاع (مم)': 'Profile Face (mm)',
  'البركلوز (مم)': 'Bead (mm)',
  'خصم الزجاج (مم)': 'Glass Deduction (mm)',
  'السماكة (مم)': 'Thickness (mm)',
  'أولوية التركيب عند الزوايا': 'Corner Assembly Priority',
  'أفقي (علوي+سفلي) كامل العرض': 'Horizontal (top+bottom) full width',
  'رأسي (يسار+يمين) كامل الارتفاع': 'Vertical (left+right) full height',
  'خطوط الرسم (من الخارج للداخل)': 'Drawing Lines (outer to inner)',
  '+ خط': '+ Line',
  'خطوط عارضة T (من اليسار للوسط)': 'T-Bar Lines (left to center)',
  'لا توجد خطوط': 'No lines',
  'إطار': 'Frame',
  'بلكلوز': 'Bead',
  'عارضة T': 'T-Bar',
  'صورة': 'Image',
  'سماكة': 'Thickness',
  'خطوط الرسم': 'Drawing Lines',

  // Sash types
  'ثابت': 'Fixed',
  'مفصلي يسار': 'Casement Left',
  'مفصلي يمين': 'Casement Right',
  'سحاب يسار': 'Sliding Left',
  'سحاب يمين': 'Sliding Right',
  'علوية خارجية': 'Awning',
  'مسطح داخلي': 'Tilt-In',
  'نوع الدرفة': 'Sash Type',

  // Glass colors
  'شفاف': 'Clear',
  'أزرق': 'Blue',
  'أخضر': 'Green',
  'رمادي': 'Grey',
  'برونزي': 'Bronze',
  'سولار': 'Solar',
  'مرآة': 'Mirror',
  'أوبال أبيض': 'Opal White',

  // More common UI
  'إدارة المشاريع': 'Project Management',
  'التقارير والإحصائيات': 'Reports & Statistics',
  'لوحة التحكم': 'Dashboard',
  'الرئيسية': 'Home',
  'خروج': 'Logout',
  'تسجيل': 'Register',
  'إعدادات النظام': 'System Settings',
  'إعدادات الرسومات': 'Drawing Settings',
  'حفظ التغييرات': 'Save Changes',
  'إلغاء التغييرات': 'Cancel Changes',
  'هل تريد المتابعة؟': 'Do you want to continue?',
  'تم بنجاح': 'Success',
  'فشل': 'Failed',
  'خطأ': 'Error',
  'تنبيه': 'Alert',
  'تأكيد الحذف': 'Confirm Delete',
  'تأكيد العملية': 'Confirm Operation',

  // Installation specific
  'إضافة تركيب': 'Add Installation',
  'تعديل التركيب': 'Edit Installation',
  'حذف التركيب': 'Delete Installation',
  'تفاصيل التركيب': 'Installation Details',
  'تاريخ التركيب': 'Installation Date',
  'فريق العمل': 'Work Team',
  'حالة التركيب': 'Installation Status',
  'ملاحظات التركيب': 'Installation Notes',
  'قبل التركيب': 'Before Installation',
  'بعد التركيب': 'After Installation',
  'أثناء التركيب': 'During Installation',

  // Records/Saved
  'التقارير المحفوظة': 'Saved Reports',
  'المستندات المحفوظة': 'Saved Documents',
  'الاستمارات': 'Forms',
  'أوامر الشراء': 'Purchase Orders',
  'عروض الأسعار': 'Quotations',
  'الفواتير': 'Invoices',
  'المحاضر': 'Reports',
  'لا توجد سجلات': 'No records',

  // Backup
  'حفظ ملف': 'Save File',
  'استعادة': 'Restore',
  'تصدير': 'Export',
  'استيراد': 'Import',
  'نسخة احتياطية': 'Backup',
  'نسخة احتياطية كاملة': 'Full Backup',
  'استعادة من نسخة': 'Restore from Backup',

  // ── Project Cards & Stats ──
  'جاري التنفيذ': 'In Progress',
  'مرحلة التركيب': 'Installation Stage',
  'بانتظار المراجعة': 'Awaiting Review',
  'تأكيد المشروع': 'Confirm Project',
  'بدون اسم': 'No Name',
  'المرحلة': 'Stage',
  'التسليم': 'Delivery',
  'لم يحدد': 'Not Set',
  'قيمة العقد': 'Contract Value',
  'الدفعة المقدمة': 'Down Payment',
  'قيمة الإنتاج': 'Production Value',
  'المتبقي': 'Remaining',
  'الإجراءات': 'Actions',
  'تم تأكيد المشروع ونقله للصفحة الرئيسية': 'Project confirmed and moved to home',
  'تم تغيير المرحلة إلى:': 'Stage changed to:',
  '➕ مشروع جديد': '➕ New Project',
  '✏️ تعديل المشروع': '✏️ Edit Project',
  'يرجى ملء الحقول الإلزامية': 'Please fill required fields',
  'تم حفظ المشروع': 'Project saved',
  'تم حذف المشروع': 'Project deleted',
  'هل تريد حذف مشروع': 'Delete project',
  'تم إعادة ترقيم': 'Renumbered',
  'اختر مشروعاً أولاً': 'Choose a project first',
  'اختر المرحلة...': 'Choose stage...',
  'كل الحالات': 'All Statuses',
  'كل الشركات': 'All Companies',
  'كل المناطق': 'All Regions',
  'كل المعارض': 'All Galleries',
  'التغيير السريع للمرحلة': 'Quick Stage Change',
  'عقد:': 'Contract:',
  'موقوف / تأخير': 'Paused / Delayed',

  // ── Side Panel Actions ──
  '✏️ تعديل': '✏️ Edit',
  '📅 المخطط الزمني': '📅 Timeline',
  '📊 تغيير المرحلة': '📊 Change Stage',
  '🖨️ مستخلص': '🖨️ Extract',
  '📋 استمارة تصنيع': '📋 Manufacturing Form',
  '🛒 طلب شراء': '🛒 Purchase Order',
  '📄 تقرير العميل': '📄 Client Report',
  '📁 ملفات المشروع': '📁 Project Files',
  '📐 المقاسات': '📐 Measurements',
  '💰 عرض الأسعار': '💰 Quotation',
  '📋 أمر تسليم': '📋 Delivery Order',
  '🗑️ حذف': '🗑️ Delete',

  // ── Reports ──
  'مشروع': 'Project',
  'إجمالي إنتاج': 'Total Production',
  'ر.س': 'SAR',
  'المبلغ المتبقي': 'Remaining Amount',
  'الحالة الحالية': 'Current Status',
  'المرحلة الحالية': 'Current Stage',
  'نسبة الإنجاز الكلية': 'Overall Progress',
  'يوم مدة العقد': 'Contract Duration (days)',
  'مرحلة مكتملة من': 'Stages completed of',

  // ── Installations ──
  'تم التأكيد': 'Confirmed',
  'قيد المراجعة': 'Under Review',
  '🔨 إضافة عميل — التركيبات': '🔨 Add Client — Installations',
  'اسم العميل الكامل': 'Full Client Name',
  '— اختر المعرض —': '— Choose Gallery —',
  'ملاحظات إضافية...': 'Additional notes...',
  'أدخل اسم العميل': 'Enter client name',
  'تم إضافة العميل': 'Client added',
  'حذف العميل': 'Delete Client',
  'لا يمكن التراجع': 'Cannot undo',
  'تم حذف العميل وجميع مقاساته': 'Client and all measurements deleted',
  '📐 مقاسات': '📐 Measurements',
  'أنواع النواقص': 'Types of Defects',
  'إجمالي النواقص': 'Total Defects',
  '🛠️ أمر صيانة جديد': '🛠️ New Maintenance Order',
  'ملاحظات الفني عن الإنجاز': 'Technician Notes',
  'بيانات العميل': 'Client Data',
  'المنطقة / المعرض': 'Region / Gallery',
  'ملاحظات الفني': 'Technician Notes',
  '30 يوماً': '30 Days',
  '📋 إنشاء أمر تسليم موقع': '📋 Create Site Delivery Order',
  'اختر العميل': 'Choose Client',
  'تأكيد تسليم الموقع للعميل': 'Confirm site delivery to client',

  // ── Settings / Users ──
  'الدفعة الأولى': 'First Payment',
  'قيمة المستخلص': 'Extract Value',
  'تاريخ العقد': 'Contract Date',
  'تاريخ التسليم': 'Delivery Date',
  'الملاحظات': 'Notes',
  'مدة العقد': 'Contract Duration',
  'كلمة المرور الجديدة (فارغة = بدون تغيير)': 'New password (empty = no change)',
  'كلمة مرور جديدة': 'New password',
  'علامة مائية': 'Watermark',
  'إظهار العلامة المائية دائماً': 'Always show watermark',
  'إخفاء العلامة المائية': 'Hide watermark',
  'علامة مائية دائمة': 'Permanent Watermark',
  'بدون علامة مائية': 'No Watermark',
  'حذف المستخدم:': 'Delete User:',
  'لا يوجد مستخدمون بعد — أضف مستخدماً من الأسفل': 'No users yet — add a user below',
  'المدير لديه وصول كامل دائماً (زر "دخول كمدير")': 'Admin always has full access',
  'صلاحية': 'Permission',
  '⚠️ لا صلاحيات محددة': '⚠️ No permissions assigned',
  'القوالب السريعة:': 'Quick Templates:',
  'مشاهد فقط': 'View Only',
  'مبيعات': 'Sales',
  'محاسب': 'Accountant',
  'الكل': 'All',
  'بدون': 'None',

  // ── Saved Reports ──
  'لا توجد تقارير محفوظة بعد': 'No saved reports yet',
  'لا توجد بيانات مواد محفوظة بعد': 'No saved materials data yet',
  'لا توجد تقارير أسبوعية محفوظة': 'No saved weekly reports',
  'تم حفظ تقرير الإنتاج': 'Production report saved',
  'تم حفظ التقرير الأسبوعي': 'Weekly report saved',
  'رقم': 'Number',

  // ── Measurements ──
  'تم حفظ المقاسات': 'Measurements saved',
  'تم حفظ عرض الأسعار': 'Price list saved',
  '— اختر —': '— Choose —',
  'مقاس تصنيع (-8مم)': 'Manufacturing Size (-8mm)',
  'مقاس التصنيع': 'Manufacturing Size',
  'الأبعاد': 'Dimensions',
  'إضافة صف': 'Add Row',
  'حذف صف': 'Delete Row',

  // ── Documents ──
  'تقرير إنتاج': 'Production Report',
  'تقرير أسبوعي': 'Weekly Report',
  'بيان المواد': 'Materials Statement',
  'طلب المواد': 'Materials Request',
  'مشروع جديد': 'New Project',

  // ── Misc UI ──
  'سجل النشاطات': 'Activity Log',
  'لم يتم تصدير نسخة احتياطية منذ فترة': 'Backup not exported recently',
  'تصدير الآن': 'Export Now',
  'إجراءات العميل': 'Client Actions',
  'بحث في المشاريع...': 'Search projects...',
  'تحديث البيانات': 'Refresh Data',
  'تسجيل الخروج': 'Logout',
  'وضع عادي': 'Normal Mode',
  'وضع الفضاء': 'Space Mode',
  'حفظ': 'Save',
  'تثبيت': 'Install',
  'النسخ الاحتياطي': 'Backup',
  'English / العربية': 'English / العربية',
  'تبديل السمة': 'Toggle Theme',
  'الإشعارات': 'Notifications',
  'كلمة مرور المدير مفعّلة — الدخول يتطلب كلمة مرور': 'Admin password enabled — login requires password',
  'لا توجد كلمة مرور للمدير — يدخل بدون كلمة مرور': 'No admin password — enters without password',
  'كلمة المرور يجب 4 أحرف على الأقل': 'Password must be at least 4 characters',
  'كلمتا المرور غير متطابقتين': 'Passwords do not match',
  'تم حفظ كلمة مرور المدير': 'Admin password saved',
  'إزالة كلمة مرور المدير؟': 'Remove admin password?',
  'تم إزالة كلمة مرور المدير': 'Admin password removed',
  'تم حفظ مدة الجلسة:': 'Session duration saved:',
  'دقيقة': 'minute',
  'بدون انتهاء': 'No expiry',
  'اكتب "تأكيد" لمسح كلمة مرور المدير:': 'Type "confirm" to reset admin password:',
  'تم المسح': 'Cleared',

  // ── Settings Tabs ──
  'الأساسيات': 'Basics',
  'الأمان': 'Security',
  'المراحل': 'Stages',
  'الأعمدة': 'Columns',
  'الشعارات': 'Logos',
  'القطاعات': 'Profiles',
  'النسخ الاحتياطي': 'Backup',
  'العطل والمدة': 'Holidays & Duration',
  'داتا استمارة التصنيع': 'Manufacturing Form Data',
  'إعدادات الرسومات': 'Drawing Settings',

  // ── Common words without ال (for word-level matching) ──
  'معرض': 'Gallery',
  'شركة': 'Company',
  'منطقة': 'Region',
  'عميل': 'Client',
  'مشروع': 'Project',
  'مشاريع': 'Projects',
  'تقرير': 'Report',
  'تقارير': 'Reports',
  'إجمالي': 'Total',
  'عقد': 'Contract',
  'رقم': 'Number',
  'هاتف': 'Phone',
  'بريد': 'Email',
  'عنوان': 'Address',
  'مدينة': 'City',
  'مرحلة': 'Stage',
  'صيانة': 'Maintenance',
  'مستخلص': 'Extract',
  'فاتورة': 'Invoice',
  'كشف': 'Statement',
  'حساب': 'Account',
  'استمارة': 'Form',
  'أمر': 'Order',
  'تسليم': 'Delivery',
  'تصنيع': 'Manufacturing',
  'خامات': 'Materials',
  'زجاج': 'Glass',
  'ألمنيوم': 'Aluminum',
  'دفعة': 'Payment',
  'قيمة': 'Value',
  'نسبة': 'Percentage',
  'إنجاز': 'Progress',
  'ملاحظات': 'Notes',
  'صور': 'Photos',
  'ملفات': 'Files',
  'مقاسات': 'Measurements',
  'تاريخ': 'Date',
  'بداية': 'Start',
  'نهاية': 'End',
  'موقع': 'Site',
  'فريق': 'Team',
  'فني': 'Technician',
  'مدير': 'Manager',
  'مشرف': 'Supervisor',
  'محاسب': 'Accountant',
  'مستخدم': 'User',
  'صلاحيات': 'Permissions',
  'كلمة': 'Word',
  'مرور': 'Password',
  'دخول': 'Login',
  'خروج': 'Logout',
  'إضافة': 'Add',
  'تعديل': 'Edit',
  'حذف': 'Delete',
  'حفظ': 'Save',
  'طباعة': 'Print',
  'تصدير': 'Export',
  'استيراد': 'Import',
  'بحث': 'Search',
  'فلترة': 'Filter',
  'ترتيب': 'Sort',
  'جديد': 'New',
  'قديم': 'Old',
  'نشط': 'Active',
  'مكتمل': 'Completed',
  'معلق': 'Pending',
  'ملغي': 'Cancelled',
  'متأخر': 'Delayed',
  'جاري': 'In Progress',
  'موقوف': 'Paused',
  'أسبوعي': 'Weekly',
  'شهري': 'Monthly',
  'يومي': 'Daily',
  'سنوي': 'Annual',
  'نسخة': 'Copy',
  'احتياطية': 'Backup',
  'استعادة': 'Restore',
  'تحديث': 'Update',
  'اختيار': 'Select',
  'نعم': 'Yes',
  'لا': 'No',
  'تأكيد': 'Confirm',
  'إلغاء': 'Cancel',
  'إغلاق': 'Close',
  'فتح': 'Open',
  'رسم': 'Drawing',
  'رسومات': 'Drawings',
  'لون': 'Color',
  'ألوان': 'Colors',
  'سعر': 'Price',
  'أسعار': 'Prices',
  'كمية': 'Quantity',
  'وحدة': 'Unit',
  'طول': 'Length',
  'عرض': 'Width',
  'ارتفاع': 'Height',
  'مساحة': 'Area',
  'محيط': 'Perimeter',
  'سماكة': 'Thickness',
  'قطاع': 'Profile',
  'قطاعات': 'Profiles',
  'خط': 'Line',
  'خطوط': 'Lines',

  // ── Extra notification/confirm messages ──
  'تم إضافة': 'Added',
  'تم تحديث': 'Updated',
  'تم الحذف': 'Deleted',
  'اسم المستخدم موجود': 'Username already exists',
  'كلمة المرور قصيرة': 'Password too short',
  'كلمة المرور 4 أحرف على الأقل': 'Password must be at least 4 characters',
  'أدخل اسم المستخدم': 'Enter username',
  'حذف المستخدم:': 'Delete user:',
  'بانتظار المراجعة': 'Awaiting Review',
  'تأكيد المشروع': 'Confirm Project',
  'بدون اسم': 'No Name',
  'لا توجد مشاريع بعد': 'No projects yet',
  'أضف مشروعاً جديداً للبدء': 'Add a new project to start',
  'تم حفظ المشروع بنجاح': 'Project saved successfully',
  'هل تريد حذف مشروع': 'Delete project',
  'نهائياً؟': 'permanently?',
  'لم يحدد': 'Not set',
  'اسم العميل': 'Client Name',
  'رقم العقد': 'Contract No.',
  'الشركة': 'Company',
  'المنطقة': 'Region',
  'المعرض': 'Gallery',
  'قيمة العقد': 'Contract Value',
  'الدفعة المقدمة': 'Down Payment',
  'قيمة المستخلص': 'Extract Value',
  'تاريخ العقد': 'Contract Date',
  'تاريخ التسليم': 'Delivery Date',
  'نسبة الإنجاز': 'Progress',
  'الهاتف': 'Phone',
  'الملاحظات': 'Notes',

  // PWA & Install
  'تثبيت NourMetal': 'Install NourMetal',
  'أضف التطبيق لشاشتك الرئيسية': 'Add app to your home screen',
  'لاحقاً': 'Later',
  'تم تثبيت التطبيق بنجاح!': 'App installed successfully!',
  'تثبيت التطبيق على الآيفون': 'Install App on iPhone',
  'اضغط على ⎙ ثم "إضافة إلى الشاشة الرئيسية"': 'Tap ⎙ then "Add to Home Screen"',
  'فهمت': 'Got it',
  'اتبع الخطوات التالية لتثبيت التطبيق': 'Follow these steps to install the app',
  'افتح Safari': 'Open Safari',
  'يجب استخدام متصفح Safari فقط': 'Must use Safari browser only (not Chrome)',
  'ادخل الرابط في Safari': 'Enter the URL in Safari',
  'اكتب في شريط العنوان:': 'Type in the address bar:',
  'تم النسخ ✓': 'Copied ✓',
  'انسخ 📋': 'Copy 📋',
  'اضغط على زر المشاركة': 'Tap the Share button',
  'اضغط على أيقونة ⎙ في شريط Safari السفلي': 'Tap the ⎙ icon in the Safari bottom bar',
  'إضافة إلى الشاشة الرئيسية': 'Add to Home Screen',
  'اختر "إضافة إلى الشاشة الرئيسية" ثم اضغط "إضافة"': 'Choose "Add to Home Screen" then tap "Add"',
  'تحميل تطبيق الأندرويد': 'Download Android App',
  'تطبيق حقيقي يتثبت على جهازك مثل أي تطبيق من المتجر': 'A real app that installs on your device like any store app',
  'تحميل التطبيق (APK)': 'Download App (APK)',
  'بعد التحميل:': 'After download:',
  'افتح الملف المحمّل': 'Open the downloaded file',
  'من الإشعارات أو مجلد التحميلات': 'From notifications or Downloads folder',
  'اسمح بالتثبيت من مصادر غير معروفة': 'Allow install from unknown sources',
  'إذا طلب منك الجهاز، اختر "السماح" ثم فعّل الخيار': 'If prompted, choose "Allow" then enable the option',
  'اضغط "تثبيت"': 'Tap "Install"',
  'سيظهر التطبيق على شاشتك الرئيسية': 'The app will appear on your home screen',
  'التحديث تلقائي': 'Auto Update',
  'محتوى التطبيق يتحدث تلقائياً من السيرفر': 'App content updates automatically from server',
  'تثبيت التطبيق': 'Install App',
  'حمّل التطبيق على موبايلك': 'Download the app on your phone',
  'أندرويد (APK)': 'Android (APK)',
  '📱 للآيفون:': '📱 For iPhone:',
  'افتح الرابط من Safari على الآيفون ثم اضغط ⎙ → "إضافة إلى الشاشة الرئيسية"': 'Open the link from Safari on iPhone then tap ⎙ → "Add to Home Screen"',
  'أي تعديل يتحدث تلقائياً على كل الأجهزة': 'Any change updates automatically on all devices',

  // Spacecraft
  'وضع عادي': 'Normal Mode',
  'وضع الفضاء': 'Space Mode',

  // Notifications
  'جارٍ التحديث...': 'Refreshing...',
  'تم التحديث': 'Updated',
  'فشل التحديث': 'Update failed',
  'تحديث جديد متوفر!': 'New update available!',
  'تحديث الآن': 'Update Now',

  // Activity
  'المدير': 'Admin',
  'لا توجد نشاطات بعد': 'No activities yet',

  // Time
  'الآن': 'Now',
  'دقيقة': 'min',
  'ساعة': 'hour',
  'يوم': 'day',

  // ── Missing button/label translations ──
  'المخطط الزمني': 'Timeline',
  'تقرير العميل': 'Client Report',
  'تغيير المرحلة': 'Change Stage',
  'طلب شراء': 'Purchase Order',
  'عرض الأسعار': 'Price List',
  'مخطط زمني': 'Timeline',
  'تقرير عميل': 'Client Report',
  'تقارير الإنتاج': 'Production Reports',
  'بيانات المواد': 'Materials Data',
  'تأكيد ونقل': 'Confirm & Transfer',
  'زيرو زيرو': 'Zero Zero',
  'سجلات تقارير الإنتاج المحفوظة': 'Saved Production Reports',
  'التقارير الأسبوعية للمناطق': 'Regional Weekly Reports',
  'سجلات بيانات المواد المحفوظة': 'Saved Materials Data',
  'تقرير إنتاج جديد': 'New Production Report',
  'تقرير أسبوعي جديد': 'New Weekly Report',
  'بيان مواد جديد': 'New Materials Statement',
  'توزيع الحالات': 'Status Distribution',
  'توزيع حسب الشركة': 'Distribution by Company',
  'تفاصيل حسب الشركة والمنطقة': 'Details by Company & Region',
  'التقرير الأسبوعي': 'Weekly Report',
  'التقرير الشهري': 'Monthly Report',
  'كل الأشهر': 'All Months',
  'اختر مشروعاً': 'Choose Project',
  'اختر مشروع': 'Choose Project',
  'طباعة المخطط الزمني': 'Print Timeline',
  'حذف هذا المشروع': 'Delete this project',
  'حذف نهائي لا يمكن التراجع عنه': 'Permanent delete, cannot undo',
  'تعديل المشروع': 'Edit Project',
  'مشروع جديد': 'New Project',
  'تقرير إنتاج': 'Production Report',
  'تقرير أسبوعي': 'Weekly Report',
  'بيان المواد': 'Materials Statement',
  'استمارة تصنيع': 'Manufacturing Form',
  'طلب المواد': 'Materials Request',
  'إنتاج': 'Production',
  'أسبوعي': 'Weekly',
  'شهري': 'Monthly',
  'التركيب': 'Installation',
  'التصنيع': 'Manufacturing',
  'تفاصيل المشروع': 'Project Details',
  'المرحلة الحالية': 'Current Stage',
  'نسبة الإنجاز': 'Progress',
  'تاريخ البداية': 'Start Date',
  'تاريخ النهاية': 'End Date',
  'القيمة الإجمالية': 'Total Value',
  'الدفعة المقدمة': 'Down Payment',
  'المتبقي': 'Remaining',
  'قيمة الإنتاج': 'Production Value',
  'ملاحظات المشروع': 'Project Notes',
  'اختر الشركة': 'Choose Company',
  'اختر المنطقة': 'Choose Region',
  'اختر المعرض': 'Choose Gallery',
  'اختر...': 'Choose...',
  'بدون شركة': 'No Company',
  'بدون منطقة': 'No Region',
  'بدون معرض': 'No Gallery',
  'حالة الإيقاف': 'Pause Reason',
  'اختر سبب الإيقاف': 'Choose pause reason',
  'موقوف - انتظار سداد العميل': 'Paused - Awaiting Client Payment',
  'تأخير من العميل': 'Client Delay',
  'تأخير من الشركة': 'Company Delay',
  'توقيع العقد': 'Contract Signing',
  'امر تشغيل': 'Work Order',
  'جاهزية الموقع': 'Site Readiness',
  'عمل مخططات': 'Create Plans',
  'اعتماد المخططات': 'Approve Plans',
  'اعداد استمارة': 'Prepare Form',
  'طلب الخامات': 'Material Request',
  'دهان الخامات': 'Material Painting',
  'البدء بالتصنيع': 'Start Manufacturing',
  'اصدار مستخلص': 'Issue Extract',
  'سداد الدفعة الثانية': 'Second Payment',
  'توريد اعمال الالمنيوم': 'Aluminum Supply',
  'طلب الزجاج': 'Glass Request',
  'استلام الزجاج مع التوريد': 'Glass Receipt with Supply',
  'تركيب الزجاج': 'Glass Installation',
  'تشطيب الموقع': 'Site Finishing',
  'حفظ التغييرات': 'Save Changes',
  'إضافة شركة': 'Add Company',
  'إضافة منطقة': 'Add Region',
  'إضافة معرض': 'Add Gallery',
  'إضافة مرحلة': 'Add Stage',
  'شركة جديدة': 'New Company',
  'معرض جديد': 'New Gallery',
  'منطقة جديدة': 'New Region',
  'مرحلة جديدة': 'New Stage',
  'عمود جديد': 'New Column',
  'اسم العمود': 'Column Name',
  'نوع العمود': 'Column Type',
  'نص': 'Text',
  'قائمة': 'List',
  'تاريخ': 'Date',
  'نص طويل': 'Long Text',
  'ثابت': 'Fixed',
  'غير ثابت': 'Not Fixed',
  'صور الموقع': 'Site Photos',
  'قبل': 'Before',
  'بعد': 'After',
  'أثناء': 'During',
  'حذف الكل': 'Delete All',
  'إضافة سطر': 'Add Row',
  'حفظ المقاسات': 'Save Measurements',
  'الرمز': 'Code',
  'الوصف': 'Description',
  'مقاس تصنيع': 'Manufacturing Size',
  'حفظ وإضافة مقاسات': 'Save & Add Measurements',
  'عهدة تشغيل': 'Operating Custody',
  'إجمالي': 'Total',

  // ── Settings page static HTML ──
  '⚙️ الإعدادات': '⚙️ Settings',
  '🏢 الأساسيات': '🏢 Basics',
  '📋 المشاريع': '📋 Projects',
  '👥 الإدارة': '👥 Management',
  '🪟 الألمنيوم': '🪟 Aluminum',
  '🔧 النظام': '🔧 System',
  '🏢 الشركات': '🏢 Companies',
  '🏪 المعارض': '🏪 Galleries',
  '📍 المناطق': '📍 Regions',
  '🖼️ الشعارات': '🖼️ Logos',
  '📋 المراحل': '📋 Stages',
  '📊 الأعمدة': '📊 Columns',
  '👥 المستخدمون': '👥 Users',
  '🔐 الأمان': '🔐 Security',
  '📅 العطل والمدة': '📅 Holidays & Duration',
  '📐 القطاعات': '📐 Profiles',
  '📋 استمارة التصنيع': '📋 Manufacturing Form',
  '🔩 الرسومات': '🔩 Drawings',
  '💾 النسخ الاحتياطي': '💾 Backup',
  '🏢 إدارة الشركات': '🏢 Company Management',
  '📋 إدارة المراحل وتحديد النسب': '📋 Stage Management & Percentages',
  '🏪 إدارة المعارض': '🏪 Gallery Management',
  '📍 إدارة المناطق': '📍 Region Management',
  '📊 إدارة الأعمدة': '📊 Column Management',
  '➕ إضافة شركة': '➕ Add Company',
  '➕ إضافة مرحلة': '➕ Add Stage',
  '➕ إضافة معرض': '➕ Add Gallery',
  '➕ إضافة منطقة': '➕ Add Region',
  'مجموع النسب:': 'Total Percentages:',
  'مجموع النسب': 'Total Percentages',

  // ── Report tabs & labels ──
  '📊 نظرة عامة': '📊 Overview',
  '📋 أسبوعي': '📋 Weekly',
  '📅 شهري': '📅 Monthly',
  '👤 تقرير عميل': '👤 Client Report',
  '📅 مخطط زمني': '📅 Timeline',
  '📈 تقارير الإنتاج': '📈 Production Reports',
  '📦 بيانات المواد': '📦 Materials Data',
  '📋 أسبوعي': '📋 Weekly',
  '📈 توزيع الحالات': '📈 Status Distribution',
  '🏢 توزيع حسب الشركة': '🏢 Distribution by Company',
  '📋 تفاصيل حسب الشركة والمنطقة': '📋 Details by Company & Region',

  // ── Toolbar static HTML ──
  'بحث في المشاريع...': 'Search projects...',
  'كل الحالات': 'All Statuses',
  'كل الشركات': 'All Companies',

  // ── Users settings ──
  '👥 إدارة المستخدمين': '👥 User Management',
  'إضافة مستخدم جديد': 'Add New User',
  'كل الشركات': 'All Companies',
  'كل المناطق': 'All Regions',
  'كل المعارض': 'All Galleries',
  'اسم المستخدم': 'Username',
  'كلمة المرور': 'Password',
  'فلتر حسب الشركة': 'Filter by Company',
  'فلتر حسب المنطقة': 'Filter by Region',
  'فلتر حسب المعرض': 'Filter by Gallery',

  // ── Security settings ──
  'كلمة مرور المدير': 'Admin Password',
  'كلمة المرور الجديدة': 'New Password',
  'تأكيد كلمة المرور': 'Confirm Password',
  'حفظ كلمة المرور': 'Save Password',
  'إزالة كلمة المرور': 'Remove Password',
  'مدة الجلسة (دقائق)': 'Session Duration (minutes)',
  'حفظ المدة': 'Save Duration',
  'مسح الطوارئ': 'Emergency Reset',

  // ── Backup settings ──
  'تصدير نسخة احتياطية': 'Export Backup',
  'استيراد نسخة احتياطية': 'Import Backup',
  'حفظ على السيرفر': 'Save to Server',
  'استعادة من السيرفر': 'Restore from Server'
};

// Build reverse dictionary (English → Arabic) for switching back
var _dictEnToAr = {};
(function(){
  for(var k in _dictArToEn) {
    if(_dictArToEn.hasOwnProperty(k)) {
      _dictEnToAr[_dictArToEn[k]] = k;
    }
  }
})();

// ══════════════════════════════════════════════════════════
//  Arabic → Latin Transliteration (تعريب تلقائي)
//  Converts ANY Arabic text to readable Latin characters
//  Example: "معرض الباحة" → "maared albaha"
// ══════════════════════════════════════════════════════════
var _arToLatinMap = {
  'ال':'al','لا':'la','الش':'alsh','الث':'alth','الخ':'alkh','الذ':'aldh','الغ':'algh',
  'ا':'a','أ':'a','إ':'e','آ':'aa','ب':'b','ت':'t','ث':'th',
  'ج':'j','ح':'h','خ':'kh','د':'d','ذ':'th','ر':'r','ز':'z',
  'س':'s','ش':'sh','ص':'s','ض':'dh','ط':'t','ظ':'th',
  'ع':'a','غ':'gh','ف':'f','ق':'q','ك':'k','ل':'l','م':'m',
  'ن':'n','ه':'h','و':'o','ي':'i','ة':'a','ى':'a','ء':'',
  'َ':'a','ِ':'i','ُ':'u','ّ':'','ْ':'','ً':'an','ٍ':'en','ٌ':'on',
  '،':',','؛':';','؟':'?','٪':'%',
  '٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9'
};
// Sorted keys: longest first (to match "الش" before "ال" before "ا")
var _arLatinKeys = Object.keys(_arToLatinMap).sort(function(a,b){ return b.length - a.length; });

// Detect if text contains Arabic characters
var _arRegex = /[\u0600-\u06FF\u0750-\u077F]/;
function _hasArabic(s) { return _arRegex.test(s); }

// Transliterate Arabic → Latin
function _transliterate(text) {
  var result = '';
  var i = 0;
  while(i < text.length) {
    var matched = false;
    // Try longest keys first
    for(var k = 0; k < _arLatinKeys.length; k++) {
      var key = _arLatinKeys[k];
      if(text.substr(i, key.length) === key) {
        result += _arToLatinMap[key];
        i += key.length;
        matched = true;
        break;
      }
    }
    if(!matched) {
      result += text[i];
      i++;
    }
  }
  return result;
}

// Normalize Arabic-Indic numerals (٠-٩) to Western (0-9) — always
function _normalizeNums(s) {
  return s.replace(/[٠-٩]/g, function(c){ return String.fromCharCode(c.charCodeAt(0) - 0x0660 + 48); });
}

// Full translation: dictionary first, then word-by-word, then transliterate
function _toEnglish(text) {
  if(!text || typeof text !== 'string') return text;
  var trimmed = text.trim();
  // 1. Exact dictionary match (fastest)
  if(_dictArToEn[trimmed]) return _normalizeNums(_dictArToEn[trimmed]);
  // 2. If no Arabic chars, just normalize numbers
  if(!_hasArabic(trimmed)) return _normalizeNums(text);
  // 3. Split into tokens (words + separators) — keep dots with adjacent chars
  var tokens = trimmed.split(/(\s+|[\:\-\(\)\[\]\{\}\/\\,;!?\u061F\u060C\u061B\|]+)/);
  var result = tokens.map(function(tok){
    var t2 = tok.trim();
    if(!t2) return tok;
    if(_dictArToEn[t2]) return _dictArToEn[t2];
    if(_hasArabic(t2)) return _transliterate(t2);
    return tok;
  }).join('');
  return _normalizeNums(result);
}

// ── Translation function (used by all other JS files) ──
function t(key) {
  if(_lang === 'en') {
    if(_dictArToEn[key]) return _dictArToEn[key];
    if(_hasArabic(key)) return _transliterate(key);
    return key;
  }
  if(_lang === 'ar' && _dictEnToAr[key]) return _dictEnToAr[key];
  return key;
}

// ══════════════════════════════════════════════════════════
//  Language Switch — Full page reload for clean translation
// ══════════════════════════════════════════════════════════
function switchLang(newLang) {
  if(newLang === _lang) return;
  try { localStorage.setItem('pm_lang', newLang); } catch(e){}

  if(newLang === 'ar') {
    // ── Switch to Arabic ──
    _lang = 'ar';
    // 1) Restore all saved originals
    _restoreArabic();
    // 2) Re-render all pages (t() returns Arabic)
    _reRenderAll();
    // Update buttons
    var b1 = document.getElementById('langToggleBtn');
    if(b1) b1.textContent = 'EN';
    var b2 = document.getElementById('langToggleBtnMob');
    if(b2) b2.textContent = 'EN';
    document.documentElement.setAttribute('lang', 'ar');
    document.documentElement.setAttribute('dir', 'rtl');
    try { notify('اللغة: العربية'); } catch(e){}
    return;
  }

  // ── Switch to English ──
  _lang = 'en';
  // Update buttons
  var btn = document.getElementById('langToggleBtn');
  if(btn) btn.textContent = 'ع';
  var btnM = document.getElementById('langToggleBtnMob');
  if(btnM) btnM.textContent = 'ع';
  // 1) Re-render all pages (t() returns English)
  _reRenderAll();
  // 2) Translate + save originals for ALL remaining text (multiple passes)
  _translateAllText();
  setTimeout(_translateAllText, 200);
  setTimeout(_translateAllText, 500);
  setTimeout(_translateAllText, 1000);
  setTimeout(_translateAllText, 2000);
  setTimeout(_translateAllText, 4000);
  document.documentElement.setAttribute('lang', 'en');
  document.documentElement.setAttribute('dir', 'ltr');
  try { notify('Language: English'); } catch(e){}
}

function _reRenderAll() {
  try { renderStats(); } catch(e){}
  try { renderTable(); } catch(e){}
  try { renderReports(); } catch(e){}
  try { renderSavedReports(); } catch(e){}
  try { renderSettings(); } catch(e){}
  try { renderDocProjects(); } catch(e){}
  try { if(typeof renderInstallations==='function') renderInstallations(); } catch(e){}
}

// ── Direct text translation — saves originals for restore ──
function _translateAllText() {
  var skip = {SCRIPT:1,STYLE:1,TEXTAREA:1,INPUT:1,CANVAS:1,SVG:1};
  var allEls = document.body.getElementsByTagName('*');
  for(var i = 0; i < allEls.length; i++) {
    var el = allEls[i];
    if(skip[el.tagName]) continue;
    for(var j = 0; j < el.childNodes.length; j++) {
      var node = el.childNodes[j];
      if(node.nodeType !== 3) continue;
      var txt = node.textContent.trim();
      if(txt.length < 1) continue;
      if(!_hasArabic(txt)) continue;
      // Save original Arabic text BEFORE translating
      node._origAr = node.textContent;
      var en = _toEnglish(txt);
      if(en !== txt) node.textContent = en;
    }
    // Placeholders
    if(el.placeholder && _hasArabic(el.placeholder)) {
      el._origPh = el.placeholder;
      el.placeholder = _toEnglish(el.placeholder);
    }
    // Titles
    if(el.title && _hasArabic(el.title)) {
      el._origTitle = el.title;
      el.title = _toEnglish(el.title);
    }
  }
}

// ── Restore all saved Arabic originals ──
function _restoreArabic() {
  var skip = {SCRIPT:1,STYLE:1,TEXTAREA:1,INPUT:1,CANVAS:1,SVG:1};
  var allEls = document.body.getElementsByTagName('*');
  for(var i = 0; i < allEls.length; i++) {
    var el = allEls[i];
    if(skip[el.tagName]) continue;
    for(var j = 0; j < el.childNodes.length; j++) {
      var node = el.childNodes[j];
      if(node.nodeType !== 3) continue;
      if(node._origAr) {
        node.textContent = node._origAr;
        delete node._origAr;
      }
    }
    if(el._origPh) { el.placeholder = el._origPh; delete el._origPh; }
    if(el._origTitle) { el.title = el._origTitle; delete el._origTitle; }
  }
}

// ══════════════════════════════════════════════════════════
//  DOM Translation Engine — walks EVERY text node
// ══════════════════════════════════════════════════════════
var _skipTags = {SCRIPT:1,STYLE:1,TEXTAREA:1,CODE:1,PRE:1,CANVAS:1,SVG:1};

function _translateDOM() {
  try {
    _translateTextNodes();
    _translateAttributes();
  } catch(e) {
    console.error('i18n error:', e);
  }
}

function _translateTextNodes() {
  var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
  var nodes = [];
  var nd;
  while(nd = walker.nextNode()) {
    var par = nd.parentElement;
    if(!par || _skipTags[par.tagName]) continue;
    var txt = nd.textContent.trim();
    if(txt.length < 1) continue;
    nodes.push(nd);
  }

  for(var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    var raw = node.textContent;
    var txt = raw.trim();
    if(!txt) continue;

    if(_lang === 'en') {
      // ── English mode: translate/transliterate ALL Arabic ──
      if(!_hasArabic(txt)) continue; // already English — skip
      var translated = _toEnglish(txt);
      if(translated !== txt) {
        node.textContent = raw.replace(txt, translated);
      }
    } else {
      // ── Arabic mode: restore English UI terms back to Arabic ──
      // Only translate known English terms, leave names/data as-is
      if(_hasArabic(txt)) continue; // already Arabic — skip
      if(_dictEnToAr[txt]) {
        node.textContent = raw.replace(txt, _dictEnToAr[txt]);
      }
    }
  }
}

function _translateAttributes() {
  // Placeholders
  document.querySelectorAll('input[placeholder]').forEach(function(el){
    var ph = el.placeholder;
    if(_lang === 'en' && _hasArabic(ph)) {
      el.placeholder = _toEnglish(ph);
    } else if(_lang === 'ar' && _dictEnToAr[ph]) {
      el.placeholder = _dictEnToAr[ph];
    }
  });

  // Title attributes
  document.querySelectorAll('[title]').forEach(function(el){
    var ti = el.title;
    if(_lang === 'en' && _hasArabic(ti)) {
      el.title = _toEnglish(ti);
    } else if(_lang === 'ar' && _dictEnToAr[ti]) {
      el.title = _dictEnToAr[ti];
    }
  });

  // Select options
  document.querySelectorAll('select option').forEach(function(el){
    var otxt = el.textContent.trim();
    if(_lang === 'en' && _hasArabic(otxt)) {
      el.textContent = _toEnglish(otxt);
    } else if(_lang === 'ar' && _dictEnToAr[otxt]) {
      el.textContent = _dictEnToAr[otxt];
    }
  });

  // Update page lang attribute
  document.documentElement.setAttribute('lang', _lang);
  document.documentElement.setAttribute('dir', _lang === 'ar' ? 'rtl' : 'ltr');
}

// Alias
function _applyTranslations() { _translateDOM(); }

// ══════════════════════════════════════════════════════════
//  Auto-translate on page load when language is English
// ══════════════════════════════════════════════════════════
var _i18nInterval = null;

function _startI18nEngine(){
  try {
    var btn = document.getElementById('langToggleBtn');
    if(btn) btn.textContent = 'ع';
    var btnM = document.getElementById('langToggleBtnMob');
    if(btnM) btnM.textContent = 'ع';
  } catch(e){}

  // Run translation every 500ms for 15 seconds
  var _count = 0;
  _i18nInterval = setInterval(function(){
    try { _translateAllText(); } catch(e){}
    _count++;
    if(_count >= 30) {
      clearInterval(_i18nInterval);
      _i18nInterval = null;
    }
  }, 500);

  try { _translateAllText(); } catch(e){}
}

(function(){
  if(_lang === 'ar') return;

  // Start as soon as DOM is ready
  if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _startI18nEngine);
  } else {
    _startI18nEngine();
  }
  // Also on full load as backup
  window.addEventListener('load', function(){
    if(!_i18nInterval) _startI18nEngine();
  });
})();
