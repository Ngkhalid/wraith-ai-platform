# كتالوج البيانات الاصطناعية

هذا الكتالوج يصف ملفات `data/seed/` كما يسجلها `data/manifest.json`. جميع السجلات حتمية وخيالية ومخصصة للمختبر المحلي؛ لا تحتاج عملية التوليد إلى شبكة.

## ملخص العقد

| البند | القيمة |
|---|---|
| إصدار schema | `1.0.0` |
| seed | `20260731` |
| وقت التوليد المسجل | `2026-07-31T12:00:00Z` |
| مجموعات البيانات التشغيلية | 22 |
| مجموع السجلات التشغيلية | 4,800 |
| الحد الأدنى المطلوب لكل مجموعة تشغيلية | 100 |
| بيانات اعتماد العرض | 4 سجلات إضافية غير تشغيلية |
| سلامة الملفات | عدد سجلات وSHA-256 مستقلان لكل ملف |
| المصالحة | 180 حسابًا و600 معاملة، `reconciled: true` |

## الملفات والحقول

| ملف البيانات | السجلات | تشغيلي | الغرض | أهم الحقول |
|---|---:|:---:|---|---|
| `accounts.json` | 180 | نعم | أرصدة وحالة الحسابات الوهمية ومصالحة دفتر الأستاذ | `account_id`, `customer_id`, `account_type`, `opening_balance`, `current_balance`, `available_balance`, `currency`, `status` |
| `alerts.json` | 180 | نعم | طابور تنبيهات SOC وSLA والتعيين | `alert_id`, `event_id`, `title`, `severity`, `status`, `assignee`, `sla_minutes`, `created_at` |
| `attacks.json` | 320 | نعم | وقائع الهجمات ومصدرها وربطها بـMITRE والخدمة المستهدفة | `attack_id`, `attack_type`, `source_ip`, `country_code`, `target_service`, `severity`, `mitre_tactic`, `mitre_technique_id` |
| `audit_logs.json` | 220 | نعم | أثر تدقيق إجراءات المشغل والموارد | `audit_log_id`, `actor_id`, `actor_role`, `action`, `resource_type`, `resource_id`, `result`, `occurred_at` |
| `auth_logs.json` | 250 | نعم | محاولات الدخول والنتائج والأجهزة ومصادر IP | `auth_log_id`, `customer_id`, `action`, `result`, `reason`, `device`, `ip_address`, `occurred_at` |
| `beneficiaries.json` | 130 | نعم | مستفيدو الحوالات وحساباتهم المعروضة | `beneficiary_id`, `customer_id`, `nickname`, `bank_name`, `account_display`, `currency`, `country_code`, `status` |
| `canary_activity.json` | 180 | نعم | نشاط Canary الوهمي وشدته | `canary_event_id`, `canary_id`, `canary_type`, `action`, `source_ip`, `severity`, `status`, `occurred_at` |
| `cards.json` | 150 | نعم | بطاقات العملاء المقنّعة وحدودها وحالتها | `card_id`, `account_id`, `customer_id`, `pan_masked`, `card_type`, `network`, `daily_limit`, `status` |
| `commands.json` | 300 | نعم | أوامر جلسات المهاجم كنصوص مسجلة غير منفذة | `command_id`, `session_id`, `command_text`, `display_text`, `classification`, `result`, `executed`, `occurred_at` |
| `customers.json` | 120 | نعم | ملفات العملاء الوهمية بالعربية والإنجليزية | `customer_id`, `customer_number`, `display_name`, `display_name_ar`, `email`, `phone`, `kyc_status`, `risk_tier` |
| `demo_credentials.json` | 4 | لا | حسابات دخول خيالية للعرض المحلي فقط | `username`, `password`, `role`, `environment`, `synthetic` |
| `events.json` | 420 | نعم | خط الأحداث الموحد الذي يغذي API وSOC | `event_id`, `attack_id`, `event_type`, `source`, `source_ip`, `target_service`, `severity`, `status`, `occurred_at` |
| `invoices.json` | 130 | نعم | فواتير العملاء والقيم والضرائب والاستحقاق | `invoice_id`, `invoice_number`, `customer_id`, `merchant_id`, `subtotal`, `tax`, `total`, `due_at`, `status` |
| `iocs.json` | 200 | نعم | مؤشرات الاختراق والثقة والفترة الزمنية | `ioc_id`, `type`, `value`, `severity`, `confidence`, `source`, `first_seen`, `last_seen`, `active` |
| `locations.json` | 120 | نعم | إثراء جغرافي اصطناعي لعناوين IP | `location_id`, `ip_address`, `country_code`, `city`, `latitude`, `longitude`, `asn`, `provider` |
| `merchants.json` | 140 | نعم | دليل التجار والتصنيف والمخاطر | `merchant_id`, `merchant_number`, `name`, `category`, `city`, `country_code`, `risk_score`, `status` |
| `mitre_mappings.json` | 120 | نعم | تغطية تقنيات MITRE والخدمات والكشوف | `mapping_id`, `tactic`, `technique_id`, `technique_name`, `coverage`, `detections`, `affected_services`, `last_seen` |
| `payments.json` | 300 | نعم | مدفوعات العملاء وربطها بالتاجر والمعاملة | `payment_id`, `transaction_id`, `account_id`, `merchant_id`, `merchant_name`, `amount`, `currency`, `payment_type`, `status` |
| `playbook_runs.json` | 140 | نعم | تشغيلات Playbook الوهمية وخطواتها ونتيجتها | `playbook_run_id`, `playbook`, `trigger_alert_id`, `status`, `steps_completed`, `steps_total`, `actions`, `external_actions` |
| `sandbox_reports.json` | 120 | نعم | تقارير تحليل ملفات آمنة دون تنفيذ أو شبكة | `report_id`, `artifact_name`, `sha256`, `mime_type`, `file_size`, `verdict`, `risk_score`, `executed`, `network_access` |
| `sessions.json` | 180 | نعم | جلسات الهجوم والبروتوكول والمدة ومحاولات الدخول | `session_id`, `attack_id`, `source_ip`, `protocol`, `username_attempted`, `authentication_result`, `command_count`, `started_at` |
| `transactions.json` | 600 | نعم | دفتر الحركات الواردة والصادرة وأرصدة ما بعد الحركة | `transaction_id`, `account_id`, `customer_id`, `direction`, `type`, `amount`, `balance_after`, `status`, `occurred_at` |
| `transfers.json` | 300 | نعم | حوالات العملاء والجهة المقابلة والحالة | `transfer_id`, `transaction_id`, `account_id`, `beneficiary_id`, `counterparty_name`, `counterparty_account`, `direction`, `amount`, `status` |

## علاقات البيانات الأساسية

- `customers.customer_id` يربط العملاء بالحسابات والبطاقات والمستفيدين والفواتير والمعاملات.
- `accounts.account_id` يربط الرصيد بالبطاقات والمدفوعات والحوالات والمعاملات.
- `transactions.transaction_id` يربط حركة دفتر الأستاذ بمدفوعة أو حوالة عند وجودها.
- `attacks.attack_id` يربط الهجوم بالأحداث والجلسات، و`events.event_id` يربط الحدث بالتنبيهات.
- `locations.location_id` و`source_ip` يدعمان الخريطة والإثراء الجغرافي.
- `mitre_mappings.technique_id` يوحّد تغطية MITRE مع تقنيات الهجمات المعروضة في SOC.

## قواعد السلامة والجودة

- كل ملف تشغيلي يحتوي 120 سجلًا على الأقل، متجاوزًا الحد الأدنى في manifest وهو 100.
- مجموع المعاملات يتوزع إلى 150 واردة و450 صادرة، وتُراجع الأرصدة باستخدام أرقام صحيحة بالسنت لتجنب أخطاء الفاصلة العائمة.
- الحقل `synthetic: true` موجود في السجلات لتسهيل منع خلطها ببيانات إنتاج.
- الأوامر والتقارير تحفظ الدليل فقط؛ `executed` يظل `false`، ولا يوجد وصول شبكة ديناميكي.
- `demo_credentials.json` غير تشغيلي، غير معروض عبر API، وكلمات مروره لا تصلح خارج العرض المحلي.
- أي تعديل يدوي على ملف seed يغيّر SHA-256؛ عندها يجب إعادة التوليد أو تحديث العقد عبر الأداة المعتمدة بدل تجاوز فحص السلامة.
