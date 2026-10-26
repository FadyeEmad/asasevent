# الربط الحالي: Google Sheets

الشيت: https://docs.google.com/spreadsheets/d/1cXvtHo0-Ao0btfnmas0cW0_7rcOXvqbV2T9FBdQF2KI/edit

1. من الشيت افتح Extensions > Apps Script والصق `google-sheets.gs`.
2. احفظ المشروع وشغّل `setup`، ثم وافق على صلاحية التعامل مع جداول البيانات. ينشئ ورقة «تسجيلات الفعالية» دون تعديل الأوراق الموجودة، ويولّد مفتاحًا في Script Properties باسم `REGISTRATION_SECRET`.
3. Deploy > New deployment > Web app: Execute as Me، وWho has access = Anyone. يتطلب هذا موافقة صاحب الحساب؛ الكتابة محمية بمفتاح ولا توجد واجهة لإظهار أسماء أو أرقام المسجلين.
4. في Vercel أضف `GOOGLE_SCRIPT_URL` برابط النشر المنتهي بـ `/exec` و`REGISTRATION_SECRET` بنفس قيمة المفتاح في Project Settings > Script properties.
5. ارفع التعديل إلى GitHub وأعد النشر. عند تعديل السكربت لاحقًا حدّث الـ deployment إلى نسخة جديدة.
6. اختبر تسجيلًا واضحًا وتأكد من وصول صفه قبل إتاحة التسجيل للجمهور.

الاسم غير إلزامي دون كتابة ملاحظة على الفورم. الموبايل يُحفظ كنص ويُسمح له بحجز واحد عبر جميع المواعيد. كل موعد يسع 6 تسجيلات؛ الموعد المكتمل يُقفل وتظهر عليه «مكتمل». تتحدث الإتاحة كل 30 ثانية وعند العودة للصفحة. Script Lock يحمي فحص المقاعد والحفظ. المفتاح محفوظ على السيرفر فقط. رسالة النجاح تتطلب تأكيد الحفظ؛ لا يوجد تخزين تجريبي محلي. صفوف الاختبار ذات كود TEST لا تُحسب ضمن الحجوزات ولا تمنع الرقم.

الفحص المحلي: `node integrations/verify-google.cjs`. لا يضيف بيانات للشيت الحقيقي.

المراجع: https://developers.google.com/apps-script/guides/web وhttps://developers.google.com/apps-script/reference/lock/
