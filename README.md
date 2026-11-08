# Wraith AI - Autonomous Honeypot Analytics & Threat Intelligence System

> An advanced AI-powered system designed to analyze honeypots, track attacker behaviors, and provide real-time threat intelligence.

---

## Table of Contents
- [Project Overview](#-project-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Installation Methods](#-installation-methods)
- [General Usage & Portals](#-general-usage--portals)
- [Status](#-status)

---

## 🚀 Project Overview
A graduation project built to bridge the gap in traditional detection systems by integrating honeypots with modern artificial intelligence capabilities to examine attacker behavior, analyze intent, and classify attacks with high precision within a secure, isolated environment.

---

## 💡 Key Features

- **AI Intent Classification**
  - Leverages the **Google Gemini 2.5 API** to analyze and classify attacker intent and malicious behavior upon detection within the honeypot with advanced accuracy.
- **Threat Intelligence & Binary Analysis**
  - Integrates with the **VirusTotal API** to automatically scan hashes and suspicious files uploaded or downloaded by attackers within the environment without executing them locally.
- **MITRE ATT&CK Mapping**
  - Automatically classifies and maps attacks against **MITRE ATT&CK** standards to help analysts understand adversary tactics, techniques, and procedures (TTPs).
- **3D Attack Visualization Dashboard**
  - An interactive React-based web interface that displays incoming attacks and their flows visually using 3D rendering, offering session replays and indicators of compromise (IoCs) inspection.
- **Robust Containerized Architecture**
  - Built using **Python** and **FastAPI** for high performance, with components containerized via **Docker** on an **Ubuntu Server** environment to ensure complete isolation and security.
- **Canary Mesh Decoy Artifacts**
  - Deploys honeytokens and decoy credential files (such as private keys and cloud tokens) as tripwires to detect unauthorized access attempts and trigger real-time alerts.

---

## 🛠️ Tech Stack
- **Backend:** Python, FastAPI
- **Environment & Deployment:** Docker, Ubuntu Server
- **APIs & Intelligence:** Google Gemini 2.5 API, VirusTotal API, MITRE ATT&CK Mapping
- **Frontend / Dashboards:** FinTech Portal, SOC Console (React, Vite)
- **Database:** Supabase (PostgreSQL)

---

## ⚙️ Installation Methods

| Method | Notes |
| :--- | :--- |
| `git clone https://github.com/Ngkhalid/wraith-ai-platform.git` | Clone the repository to your local machine or server |
| `npm install` | Install root workspace packages |
| `npm install --prefix apps/soc-console` | Install dependencies for SOC Console |
| `npm install --prefix apps/fintech-portal` | Install dependencies for FinTech Portal |
| `docker-compose up --build -d` | Deploy production environment on Ubuntu Server |

---

## 🖥️ General Usage & Portals

To run the application locally, use the commands corresponding to each portal:

### 1. FinTech Portal (Deception Target)
To run the simulated financial technology environment:
```bash
npm run dev:fintech
```
Port: 5173

Access URL: http://127.0.0.1:5173

Demo Accounts:

Operations Account: ops@finova-demo.local / Ledger!Sim-2026

Customer Account: layla.haddad@finova-demo.local / Honeypot!Demo-2026

---

2. SOC Console (Analyst Security Dashboard)
To run the centralized security operations dashboard featuring 3D attack visualizations and real-time telemetry:

```bash
npm run dev:soc
```

Port: 5174

Access URL: http://127.0.0.1:5174



🚧 Status
Under Development: This project is currently under active development and continuous improvement.




## 📸 Dashboard Previews & Interfaces

### 1. FinTech Portal (Deception Target Interface)
The realistic financial technology environment used as a honeypot decoy to track user and attacker interactions.
![FinTech Portal Dashboard](https://github.com/user-attachments/assets/c8409117-613d-48ed-bce5-7167296b2dfd)

### 2. SOC Console (Analyst Security Dashboard)
The centralized security operations dashboard displaying global attack telemetry, 3D threat maps, and analytics.
![SOC Console Dashboard](https://github.com/user-attachments/assets/b729855b-c2d3-44a2-ae78-a181c5efdfc7)
