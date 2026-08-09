# تشغيل البنية التحتية المعزولة

## قاعدة البداية

لا تشغّل `compose.sensor.linux.yml` على Windows ولا تفتح ports على الراوتر. OpenCanary يحتاج Linux host networking للحصول على معلومات شبكة صحيحة، وSuricata يحتاج وصولًا منخفض المستوى للواجهة؛ لذلك ملف sensor مخصص لـLinux VM/host داخل VLAN معزولة فقط.

## النسخة الخفيفة

```powershell
Copy-Item .\infra\.env.example .\infra\.env
# غيّر POSTGRES_PASSWORD وREDIS_PASSWORD
docker compose --env-file .\infra\.env -f .\infra\compose.yml --profile demo up -d --build
```

## Core ثم Search

```powershell
docker compose --env-file .\infra\.env -f .\infra\compose.yml --profile core up -d
docker compose --env-file .\infra\.env -f .\infra\compose.yml --profile search up -d
```

لا تبدأ `search` إذا كانت المساحة الحرة أقل من 100GB. لا تبدأ `ai` و`search` معًا في أول تجربة. ClamAV مضبوط بحد 4GB RAM لأن قاعدة التواقيع تحتاج ذاكرة ملحوظة.

## AI محلي

```powershell
docker compose --env-file .\infra\.env -f .\infra\compose.yml --profile ai up -d ollama
docker exec -it nabilo-honeypot-ollama-1 ollama pull qwen2.5:7b-instruct-q4_K_M
```

تنزيل النموذج هو الإجراء الوحيد هنا الذي يحتاج إنترنت. بعد التنزيل يمكن منع الخروج وإعادة تشغيل profile. الـAPI الحالي لا يمنح النموذج tools أو shell أو شبكة.

## Sensor على Linux فقط

قبل التشغيل: غيّر `HOME_NET` والواجهة، أنشئ VLAN، طبّق deny-all egress، ثم اختبر عدم وجود route إلى LAN/Internet. بعدها فقط:

```bash
docker compose --env-file .env -f compose.sensor.linux.yml config
docker compose --env-file .env -f compose.sensor.linux.yml up -d
```

Cowrie/OpenCanary/Suricata تعالج مدخلات غير موثوقة؛ راقب CPU/RAM/disk، فعّل quotas، واجمع logs إلى جهة منفصلة. لا تحول SSH العام إلى Cowrie قبل اختبار الوصول الإداري البديل.

## إيقاف قابل للاستعادة

```powershell
docker compose --env-file .\infra\.env -f .\infra\compose.yml --profile demo --profile core --profile search --profile malware --profile ai down
```

لا تضف `-v` إلا إذا أردت حذف قواعد البيانات والـvolumes نهائيًا.

