# SCENTORY — Modern Fragrance Library

واجهة تجريبية احترافية بالتصميم الداكن الحديث (Option B).

## الملفات
- `public/` الواجهة كاملة: HTML/CSS/JS والصور.
- `wrangler.jsonc` إعداد Cloudflare Workers Static Assets.
- `package.json` أوامر التطوير والنشر.

## التجربة
يمكن فتح `public/index.html` مباشرة، أو تشغيل static server داخل `public`.

## التخزين الحالي
القوائم (المفضلة / أريد تجربتها / أريد شراءها / أملكها) محفوظة في `localStorage` على الجهاز.

## المرحلة التالية
بعد إنشاء مستودع GitHub وربطه بـ Cloudflare، يمكن إضافة D1 + تسجيل الدخول والمزامنة بين الأجهزة دون تغيير الهوية البصرية.

> بيانات العطور والدرجات الحالية تجريبية لاختبار الواجهة، والمشروع لا يقوم بعمل scraping من Fragrantica.
