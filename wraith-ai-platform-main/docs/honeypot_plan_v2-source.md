# مخطط مشروع: FinTech AI-Powered Honeypot (نسخة محدثة v2)

## المرحلة 0: تحديد الهدف والمتطلبات

**الهدف:**
بناء نظام Honeypot ذكي يحاكي بيئة FinTech، يستدرج المهاجم، يسجل سلوكه، يحلله باستخدام AI، ويعرض النتائج في Dashboard — مع ضمان أن كل التفاعل **محاكاة (simulation) بالكامل بدون أي تنفيذ حقيقي**، وضمن عزل شبكي صارم.

**المكونات النهائية:**

```
Attacker
   |
Firewall / Network Isolation (VLAN معزول)
   |
Suricata (IDS/IPS)
   |
Multi-Service Honeypot (Docker/VM محتوى)
   |
Event Processing Engine
   |
AI Analysis + MITRE + IOC + Canary Tokens
   |
Alerting (Webhook/Slack/Email) + Dashboard
```

---

## المرحلة 1: بناء بيئة FinTech الوهمية (Persona)

**الهدف:** جعل المهاجم يعتقد أنه داخل شركة مالية.

**هوية السيرفر:**
- Hostname: `fin-core-gateway01.internal`
- OS: Ubuntu 22.04 LTS
- User: `finops-admin`

**Filesystem وهمي:**
```
/
├── opt/
│    └── swift_gateway/
│          ├── config.yaml
│          ├── gateway.conf
│          └── payment_service.py
│
├── var/
│    └── backups/
│          └── transactions/
│                 ├── backup_2026.sql
│                 └── payments.csv
│
└── etc/
     └── fintech_keys/
            ├── api.key        ← [جديد] Canary Token مضمّن
            └── private.pem    ← [جديد] Canary Token مضمّن
```

**[إضافة جديدة] Canary Tokens:**
- توليد مفاتيح AWS/API وهمية عبر خدمة مثل Canarytokens.org أو تلقائياً.
- أي استخدام خارجي لهذه المفاتيح (محاولة دخول، بيع، استعلام) يُنتج تنبيهاً فورياً ويُعتبر IOC عالي الثقة.
- تُدمج داخل `api.key` و `private.pem` بشكل يبدو طبيعياً.

---

## المرحلة 2: بناء SSH Honeypot

**الهدف:** محاكاة Terminal حقيقية.

```
SSH Server
     |
Virtual Shell
     |
Session-Scoped Filesystem State (JSON/DB لكل جلسة)
```

**[تعديل مهم] الأوامر الأساسية (تنفَّذ ضمن الحالة الافتراضية فقط):**
`ls, cd, pwd, cat, mkdir, touch, echo, whoami, uname, ps`

⚠️ **لا شيء من هذا ينفَّذ فعلياً على نظام التشغيل الحقيقي.** كل أمر يُقرأ ويُطابَق ضد حالة (state) الجلسة المخزّنة، ويُرجع رداً منها أو من الـ LLM.

**[إضافة جديدة] Session State Management:**
- لكل جلسة SSH معرّف فريد (session_id).
- أي تعديل يُحدثه المهاجم (مثل `touch file.txt` أو `mkdir new_dir`) يُخزَّن في state خاص بالجلسة (مثلاً Redis أو مستند Mongo).
- الأوامر اللاحقة (`ls`, `cat`) يجب أن تعكس هذه التعديلات ليبقى السلوك متسقاً ولا يفضح نفسه كنظام وهمي.
- تنتهي صلاحية الـ state بعد انتهاء الجلسة أو بعد مدة زمنية محددة (TTL) لتفادي تضخم البيانات.

مثال:
```
المهاجم: ls /etc
الرد: passwd  hosts  fintech_keys
```

---

## المرحلة 3: بناء الخدمات الأخرى

جميعها تُبنى كخدمات محاكاة (لا تنفيذ حقيقي)، ويفضّل الاستفادة من مشاريع مرجعية مفتوحة المصدر مثل **Cowrie** (SSH/Telnet) كمرجع بنيوي بدل البناء من الصفر بالكامل.

| الخدمة | تحاكي | تسجّل |
|---|---|---|
| HTTP Honeypot | WordPress, phpMyAdmin, Login Pages | Scanners, SQL Injection, Path Traversal |
| FTP Honeypot | خادم FTP | محاولات الدخول، الملفات المرفوعة |
| SMB Honeypot | Windows Share | اكتشاف الملفات |
| MySQL Honeypot | قاعدة بيانات | محاولات الدخول، الاستعلامات |

**[إضافة جديدة] تحليل الملفات المرفوعة (Sandbox Integration):**
- أي ملف يرفعه المهاجم (عبر FTP/HTTP) يُمرَّر تلقائياً إلى:
  - **Cuckoo Sandbox** (تحليل ديناميكي محلي)، أو
  - **VirusTotal API** (تحليل سريع وسمعة الملف)
- نتيجة التحليل (hash, behavior, detection ratio) تُخزَّن كجزء من الـ Event وتُربط بجلسة المهاجم.

---

## المرحلة 4: Event Logging System

كل تفاعل يتحول إلى Event موحّد:

```json
{
  "time": "2026-07-24T12:30:00Z",
  "session_id": "sess_8f21a",
  "source_ip": "45.x.x.x",
  "service": "SSH",
  "user": "root",
  "command": "wget malware.sh",
  "action": "download",
  "executed": false
}
```

**[ملاحظة]** حقل `"executed": false` مضاف عمداً للتأكيد الدائم أن الأمر محاكاة وليس تنفيذاً حقيقياً — يفيد لاحقاً بالتدقيق (audit) والمراجعة القانونية.

**التخزين:** Elasticsearch (مفضّل لسهولة التكامل مع Kibana والبحث السريع).

---

## المرحلة 5: Event Processing Engine

```
Processor
   |
   ├── GeoIP
   ├── IOC Extractor
   ├── MITRE Mapper
   ├── Risk Scoring
   └── Canary Token Watcher   ← [جديد]
```

---

## المرحلة 6: GeoIP

تحويل IP إلى: الدولة، المدينة، الإحداثيات (مثال: Russia / Moscow / 55.75,37.61).

---

## المرحلة 7: MITRE ATT&CK Mapping

| الأمر | Technique | Tactic |
|---|---|---|
| wget | T1105 | Ingress Tool Transfer |
| cat /etc/passwd | T1087 | Account Discovery |
| python exploit.py | T1059 | Command and Scripting Interpreter |

---

## المرحلة 8: IOC Extraction

يستخرج: IP، Domain، URL، Hash (SHA256) — وتُضاف نتائج الـ Sandbox (المرحلة 3) والـ Canary Token hits كمصادر IOC إضافية.

---

## المرحلة 9: Intent Router

**[تعديل جوهري] التصنيف بقي كما هو، لكن مع تأكيد صارم على طبيعة "التنفيذ":**

- بسيطة (`ls`, `pwd`, `cd`) → Virtual Filesystem State (بدون LLM، استجابة فورية)
- معقدة (`wget`, `curl`, `python`, `chmod`, `bash`) → LLM **لتوليد نص استجابة واقعي فقط** — **لا تنفيذ فعلي بأي شكل**، ولا اتصال شبكي حقيقي خارج بيئة الـ honeypot المعزولة.

**[إضافة جديدة] Caching:** الأوامر المتكررة الشائعة (مثل أدوات automated scanning) تُخزَّن نتائجها مؤقتاً لتقليل زمن استجابة الـ LLM وتفادي لفت انتباه مهاجم بشري بسبب التأخير.

---

## المرحلة 10: دمج Qwen2.5 + RAG

**الهدف:** جعل الـ Honeypot ذكياً بدل ردود ثابتة.

RAG يحتوي: FinTech Knowledge Base + Filesystem/Session Context + سجل أفعال المهاجم السابقة في نفس الجلسة.

**[إضافة جديدة] حماية من Prompt Injection:**
- فصل صارم بين System Prompt وبين مدخلات المهاجم (لا تُدمج كنص خام داخل نفس السياق دون تحديد حدود واضحة — استخدام delimiters/structured input).
- Output filtering: رفض أو تعقيم أي استجابة تكشف طبيعة النظام كـ Honeypot أو كـ AI/LLM.
- تحديد صارم لطول وشكل استجابة الـ LLM (لا يُسمح بردود meta عن "أنا نموذج لغوي").
- اختبار دوري (red-teaming) لمحاولات كسر الـ persona.

مثال:
```
المهاجم: cat /opt/swift_gateway/config.yaml
LLM: يعرف أنه ملف Gateway مالي → يولّد محتوى واقعي متسق مع الـ persona
```

---

## المرحلة 11: بناء Backend

**Python FastAPI**

```
Backend
├── Authentication
├── Events API
├── Attack API
├── Session API
├── AI API
├── WebSocket
└── Alerting Service   ← [جديد]
```

**[إضافة جديدة] Alerting Service:**
- إشعار فوري (Webhook → Slack/Discord/Telegram/Email) عند:
  - أحداث Risk Score عالية
  - استخدام Canary Token
  - رفع ملف مالوير مؤكد من الـ Sandbox

---

## المرحلة 12: بناء Dashboard

**Frontend:** React + TypeScript + Tailwind

1. **Overview:** Total Attacks / Unique IPs / Malware Captured / High Risk Events
2. **Live Attack Stream:** بث لحظي للأحداث (عبر WebSocket)
3. **Attack Map:** خريطة عالمية
4. **MITRE Dashboard:** T1110, T1105, T1059 ...
5. **IOC Database:** IP / Domain / URL / Hash / Confidence
6. **SSH Session Replay:** عرض تفصيلي لجلسة المهاجم
7. **[جديد] Sandbox Reports:** نتائج تحليل الملفات المرفوعة
8. **[جديد] Canary Token Activity:** سجل استخدام المفاتيح الوهمية

---

## المرحلة 13: Firewall + IDS/IPS + عزل الشبكة (موسّعة)

```
Attacker
   ↓
Firewall (pfSense)
   ↓
Suricata (IDS/IPS)
   ↓
Honeypot (داخل Docker/VM معزول، VLAN منفصل تماماً عن أي بنية داخلية حقيقية)
```

**[إضافة جديدة — حرجة]**
- **Egress Filtering:** منع أي اتصال صادر حقيقي من بيئة الـ honeypot إلى الإنترنت أو الشبكة الداخلية (لمنع استخدامه كنقطة ارتكاز/pivot لهجمات حقيقية).
- عزل كامل بـ Container/VM منفصل بدون مسارات توجيه (routing) نحو أي بنية تحتية حساسة.
- مراجعة دورية لقواعد الـ Firewall والتأكد من عدم وجود "تسريبات" شبكية غير مقصودة.

---

## المرحلة 14: الاختبار

- **SSH:** Hydra (Brute Force)
- **Web:** Nikto, SQLMap, Gobuster
- **Malware:** رفع ملف تجريبي (EICAR test file يفضّل بدل مالوير حقيقي) للتحقق من مسار الـ Sandbox والتنبيهات
- **[جديد] اختبار Prompt Injection:** محاولات كسر الـ persona عبر أوامر مصممة خصيصاً لخداع الـ LLM
- **[جديد] اختبار العزل الشبكي:** التأكد الفعلي من عدم وجود أي مسار خروج حقيقي من بيئة الـ honeypot

---

## خارطة تنفيذ مقترحة (MVP تدريجي)

1. **المرحلة الأولى:** SSH Honeypot بسيط (Virtual Filesystem + Session State فقط، بدون LLM) + تسجيل في Elasticsearch
2. **المرحلة الثانية:** إضافة MITRE Mapping + IOC Extraction + GeoIP
3. **المرحلة الثالثة:** دمج LLM/RAG للأوامر المعقدة مع كل ضوابط الأمان (Prompt Injection defense, output filtering)
4. **المرحلة الرابعة:** Canary Tokens + Sandbox Integration + Alerting
5. **المرحلة الخامسة:** باقي الخدمات (HTTP/FTP/SMB/MySQL) + Dashboard الكامل
6. **المرحلة السادسة:** Firewall/Suricata/عزل الشبكة الكامل + اختبار شامل

هذا التسلسل يضمن أن كل طبقة تُختبر وتعمل بشكل صحيح قبل زيادة التعقيد، ويعطيك MVP قابل للعرض في أي مرحلة من مراحل التطوير.
