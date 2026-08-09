# الموارد والمساحة وإعادة التشغيل

## الوضع الذي بُني عليه المشروع

- Windows 11 Pro، RAM نحو 32GB، وRTX 5060 Ti بذاكرة 16GB.
- Docker Desktop وWSL2 مثبتان لكن الخدمات الثقيلة لم تُشغّل تلقائيًا.
- المساحة الحرة المقاسة قبل التنفيذ كانت نحو 75GB؛ لذلك النسخة الافتراضية خفيفة.

## ميزانية التخزين

| المجموعة | مساحة بداية تقريبية | تشغيل مريح |
|---|---:|---:|
| الكود والواجهات وبيانات demo | 3–8GB | 10GB |
| Python/Node caches والصور الأساسية | 5–12GB | 15GB |
| PostgreSQL + Redis | 2–8GB | 15GB |
| Elastic + Kibana | 8–25GB | 40–80GB |
| Cowrie/Suricata/ClamAV | 5–15GB | 20–40GB |
| Qwen 7B quantized | 5–10GB | 12–20GB |
| PCAP/quarantine/log retention | متغير | 50GB+ مع quotas |

الحد العملي لتشغيل كل profiles محليًا: **120–180GB إضافية**، والهدف الأفضل قرابة **200GB حرة**. مع 75GB تُشغّل النسخة الخفيفة و`core` فقط، ولا يُنصح بـElastic+AI+PCAP معًا.

## الذاكرة

- UI + API: عادة أقل من 2GB إضافية.
- PostgreSQL/Redis: 1–3GB بالحدود الحالية.
- Elastic/Kibana: 4–8GB حسب heap.
- Qwen 7B quantized: يعتمد على quantization والسياق، و16GB VRAM مناسبة كبداية، لكن لا تشغله بالتزامن مع أحمال GPU كبيرة.

## هل يلزم Restart؟

لا يلزم إطفاء الجهاز أو تسجيل الخروج لتشغيل الواجهات وAPI. قد يلزم **Restart عادي واحد فقط** إذا تم تفعيل Hyper-V جديد أو بعد تحديثات Windows/WSL/Docker المعلقة. `wsl --shutdown` يكفي غالبًا بعد تغييرات Docker/WSL ولا يعيد تشغيل Windows. لا يُفعّل Hyper-V الكامل ضمن هذا التسليم.

