# Design QA — Honeypot Environment (FinTech + SOC)

## النطاق

تم فحص بوابة FinTech ولوحة SOC بصريًا ووظيفيًا داخل المتصفح المحلي، مع إبقاء الخدمات على `127.0.0.1` وعدم تشغيل حاويات البنية الثقيلة أو تعريض أي منفذ للإنترنت.

## المصادر البصرية

| الشاشة | المصدر | أبعاد المصدر | لقطة التنفيذ |
|---|---|---:|---|
| SOC overview | `$env:NABILO_REFERENCE_ROOT\nabilo-source-overview.jpg` | 540×1200؛ قص المحتوى 540×407 | `.nabilo/screenshots/nabilo-soc-overview-final.png`، 1050×788 |
| Attack map | `$env:NABILO_REFERENCE_ROOT\nabilo-source-attack-map.jpg` | 540×1200؛ قص المحتوى 540×314 | `.nabilo/screenshots/nabilo-soc-attack-map-final.png`، 1050×788، تأطير كامل عند zoom 74% |
| MITRE ATT&CK | `$env:NABILO_REFERENCE_ROOT\nabilo-source-mitre.jpg` | 540×1200؛ قص المحتوى 540×314 | `.nabilo/screenshots/nabilo-soc-mitre.png`، 1440×1080 |

المقارنات الموحّدة التي تجمع المصدر والتنفيذ في صورة واحدة:

- `.nabilo/qa/nabilo-compare-overview.png`
- `.nabilo/qa/nabilo-compare-attack-map.png`
- `.nabilo/qa/nabilo-compare-mitre.png`

## نتيجة المقارنة البصرية

- البنية العامة تطابق المرجع: شريط جانبي داكن، شريط علوي، صف KPI كثيف، شبكة panels، رسوم خطية وأعمدة وdonut، جداول ومؤشرات حالة.
- صف Overview أصبح يحتوي العناصر المرجعية السبعة نفسها: Resolved incidents، Mean dwell time، Mean resolve time، FTE gained، Time saved، Dollars saved وNotables.
- خريطة الهجمات تحتوي قائمة الدول والنسب، خريطة عالمية تفاعلية، نقاط مصدر نابضة، zoom، قياس 24 ساعة وAttack volume بنسبة 60.2%.
- MITRE يحتوي summary cards وTop mitigations/techniques/groups/tactics ثم matrix أفقية قابلة للبحث والتمرير، مع ترميز شدة لوني.
- لوحات البيانات تحافظ على لوحة ألوان navy/cyan/blue/purple/red موحدة، وحدود ومسافات وأحجام نص متناسقة مع المرجع.
- الانحراف البصري المقبول P3: حدود الدول أزيلت من طبقة ECharts الأساسية لتفادي وصلات antimeridian الطويلة؛ أشكال اليابسة والمواقع والنسب بقيت واضحة ولا يؤثر ذلك في القراءة أو التفاعل.

## الفحص الوظيفي

- تسجيل دخول FinTech الخاطئ يعرض رسالة فشل واقعية، والحساب الصحيح يفتح اللوحة.
- التحويل بقيمة SAR 500 اجتاز review ثم confirm وأصدر مرجعًا بصيغة `FNV-*` وأغلق نافذة النجاح.
- دفع الفاتورة `INV-20260001` اجتاز confirm وعرض رسالة نجاح.
- تبديل English/العربية يعمل، و`dir="rtl"` مطبق على الحالة العربية.
- المقاس 390×844 يعمل في FinTech، مع فتح وإغلاق قائمة الهاتف.
- المقاس 390×844 يعمل في SOC، وتم إصلاح حالة القائمة المفتوحة لتملك زر إغلاق مستقل وتغلق بعد اختيار عنصر.
- تنقل SOC اختُبر على Overview، Attack map، MITRE، Live events، Event drawer وSession replay؛ زر replay قدّم الخط الزمني دون تنفيذ مدخلات.
- SOC قرأ `/api/v1/ready` واتصل ببث WebSocket المحلي وعرض عدّاد الرسائل وسجلًا واردًا حديثًا.

## الوصول وجودة المتصفح

- فحص الأزرار الظاهرة في الحالتين لم يجد أزرارًا بلا نص أو `aria-label` أو `title` بعد الإصلاحات.
- أضيفت أسماء وصول لأزرار الخيارات، البحث، الإغلاق، pagination، zoom، replay، الملفات وcanary.
- سجل المتصفح النهائي: 0 أخطاء و0 تحذيرات لكل من FinTech وSOC؛ رسائل Vite/React التطويرية فقط.
- لا توجد عبارات ظاهرة في بوابة العميل تكشف `Demo` أو `Simulation`؛ حقيقة البيانات الاصطناعية تبقى موثقة للمشغّل فقط.

## التحقق الآلي النهائي

- `npm run verify`: ناجح.
- API/security: 12 passed مع تحذير Starlette TestClient deprecation غير حاجب.
- FinTech Sites worker: 4 passed.
- SOC Sites worker: 4 passed.
- بنـاء Vite الإنتاجي: ناجح للتطبيقين.
- ملفا Docker Compose: صالحان بنيويًا، ولم تُشغَّل أي حاوية.

Final result: passed
