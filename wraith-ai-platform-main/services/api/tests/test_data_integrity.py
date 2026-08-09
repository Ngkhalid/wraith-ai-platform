from __future__ import annotations

import hashlib
import json
from collections import defaultdict
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[3]
DATA_DIR = PROJECT_ROOT / "data" / "seed"
MANIFEST_PATH = PROJECT_ROOT / "data" / "manifest.json"


def test_manifest_counts_and_checksums() -> None:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    assert manifest["synthetic"] is True
    assert manifest["runtime_network_required"] is False
    operational = 0
    for filename, metadata in manifest["files"].items():
        payload = (DATA_DIR / filename).read_bytes()
        assert hashlib.sha256(payload).hexdigest() == metadata["sha256"]
        rows = json.loads(payload)
        assert len(rows) == metadata["records"]
        if metadata["operational"]:
            operational += 1
            assert len(rows) >= manifest["minimum_operational_records"]
    assert operational == 22


def test_ledger_reconciles_exactly_in_cents() -> None:
    accounts = json.loads((DATA_DIR / "accounts.json").read_text(encoding="utf-8"))
    transactions = json.loads((DATA_DIR / "transactions.json").read_text(encoding="utf-8"))
    deltas: dict[str, int] = defaultdict(int)
    directions: set[str] = set()
    for transaction in transactions:
        cents = int(round(float(transaction["amount"]) * 100))
        directions.add(transaction["direction"])
        deltas[transaction["account_id"]] += cents if transaction["direction"] == "incoming" else -cents
    assert directions == {"incoming", "outgoing"}
    for account in accounts:
        opening = int(round(float(account["opening_balance"]) * 100))
        current = int(round(float(account["current_balance"]) * 100))
        assert opening + deltas[account["account_id"]] == current


def test_demo_credentials_are_explicitly_fictional() -> None:
    credentials = json.loads((DATA_DIR / "demo_credentials.json").read_text(encoding="utf-8"))
    assert {row["username"] for row in credentials} == {
        "layla.haddad@finova-demo.local",
        "ops@finova-demo.local",
        "soc.analyst@honeypot.local",
        "audit@honeypot.local",
    }
    assert all(row["synthetic"] is True for row in credentials)
    assert all(row["environment"] == "local-demo-only" for row in credentials)


def test_security_fixtures_never_claim_execution_or_network() -> None:
    commands = json.loads((DATA_DIR / "commands.json").read_text(encoding="utf-8"))
    reports = json.loads((DATA_DIR / "sandbox_reports.json").read_text(encoding="utf-8"))
    assert all(row["executed"] is False for row in commands)
    assert all(row["executed"] is False and row["network_access"] is False for row in reports)

