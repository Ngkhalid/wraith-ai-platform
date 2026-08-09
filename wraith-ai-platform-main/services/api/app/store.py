"""Verified JSON data source with a disposable SQLite query cache."""

from __future__ import annotations

import hashlib
import json
import sqlite3
import threading
from pathlib import Path
from typing import Any


RESOURCE_NAMES = frozenset(
    {
        "customers",
        "accounts",
        "cards",
        "beneficiaries",
        "merchants",
        "invoices",
        "payments",
        "transfers",
        "transactions",
        "auth_logs",
        "audit_logs",
        "attacks",
        "events",
        "sessions",
        "commands",
        "iocs",
        "alerts",
        "locations",
        "mitre_mappings",
        "sandbox_reports",
        "canary_activity",
        "playbook_runs",
    }
)

PRIMARY_ID_FIELDS = {
    "customers": "customer_id",
    "accounts": "account_id",
    "cards": "card_id",
    "beneficiaries": "beneficiary_id",
    "merchants": "merchant_id",
    "invoices": "invoice_id",
    "payments": "payment_id",
    "transfers": "transfer_id",
    "transactions": "transaction_id",
    "auth_logs": "auth_log_id",
    "audit_logs": "audit_log_id",
    "attacks": "attack_id",
    "events": "event_id",
    "sessions": "session_id",
    "commands": "command_id",
    "iocs": "ioc_id",
    "alerts": "alert_id",
    "locations": "location_id",
    "mitre_mappings": "mapping_id",
    "sandbox_reports": "report_id",
    "canary_activity": "canary_event_id",
    "playbook_runs": "playbook_run_id",
}


class DataIntegrityError(RuntimeError):
    """Raised when the generated seed manifest does not match its files."""


class DataStore:
    """Read-only application store.

    JSON files are canonical. SQLite is a local, disposable cache. If SQLite
    cannot be initialized, query methods continue to use the verified in-memory
    JSON data.
    """

    def __init__(self, data_dir: Path, manifest_path: Path, database_path: Path) -> None:
        self.data_dir = data_dir
        self.manifest_path = manifest_path
        self.database_path = database_path
        self._records: dict[str, list[dict[str, Any]]] = {}
        self._connection: sqlite3.Connection | None = None
        self._lock = threading.RLock()
        self.integrity_verified = False
        self.backend = "uninitialized"

    def initialize(self) -> None:
        manifest = json.loads(self.manifest_path.read_text(encoding="utf-8"))
        if manifest.get("synthetic") is not True:
            raise DataIntegrityError("manifest is not explicitly synthetic")

        loaded: dict[str, list[dict[str, Any]]] = {}
        for resource in sorted(RESOURCE_NAMES):
            path = self.data_dir / f"{resource}.json"
            payload = path.read_bytes()
            expected = manifest.get("files", {}).get(path.name, {})
            actual_checksum = hashlib.sha256(payload).hexdigest()
            if actual_checksum != expected.get("sha256"):
                raise DataIntegrityError(f"checksum mismatch for {path.name}")
            rows = json.loads(payload)
            if not isinstance(rows, list) or len(rows) != expected.get("records"):
                raise DataIntegrityError(f"record count mismatch for {path.name}")
            loaded[resource] = rows

        self._records = loaded
        self.integrity_verified = True
        try:
            self._initialize_sqlite()
            self.backend = "sqlite-cache"
        except (OSError, sqlite3.Error):
            self._connection = None
            self.backend = "verified-json-fallback"

    def _initialize_sqlite(self) -> None:
        self.database_path.parent.mkdir(parents=True, exist_ok=True)
        connection = sqlite3.connect(self.database_path, check_same_thread=False)
        connection.row_factory = sqlite3.Row
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS records (
                resource TEXT NOT NULL,
                record_id TEXT NOT NULL,
                payload TEXT NOT NULL,
                search_text TEXT NOT NULL,
                PRIMARY KEY (resource, record_id)
            )
            """
        )
        connection.execute("DELETE FROM records")
        for resource, rows in self._records.items():
            values = []
            for index, row in enumerate(rows):
                record_id = self._record_id(resource, row, index)
                payload = json.dumps(row, ensure_ascii=False, sort_keys=True)
                values.append((resource, record_id, payload, payload.lower()))
            connection.executemany(
                "INSERT INTO records(resource, record_id, payload, search_text) VALUES (?, ?, ?, ?)",
                values,
            )
        connection.commit()
        self._connection = connection

    @staticmethod
    def _record_id(resource: str, row: dict[str, Any], index: int) -> str:
        primary_field = PRIMARY_ID_FIELDS[resource]
        if primary_field in row:
            return str(row[primary_field])
        for key, value in row.items():
            if key == "id" or key.endswith("_id"):
                return str(value)
        return str(index)

    def _require_resource(self, resource: str) -> None:
        if resource not in RESOURCE_NAMES:
            raise KeyError(resource)

    def all_records(self, resource: str) -> list[dict[str, Any]]:
        self._require_resource(resource)
        if self._connection is None:
            return list(self._records[resource])
        with self._lock:
            rows = self._connection.execute(
                "SELECT payload FROM records WHERE resource = ? ORDER BY record_id",
                (resource,),
            ).fetchall()
        return [json.loads(row["payload"]) for row in rows]

    def list_records(
        self,
        resource: str,
        *,
        limit: int,
        offset: int,
        query: str | None = None,
        filters: dict[str, str | None] | None = None,
    ) -> tuple[list[dict[str, Any]], int]:
        rows = self.all_records(resource)
        normalized_query = query.strip().lower() if query else None
        if normalized_query:
            rows = [
                row
                for row in rows
                if normalized_query in json.dumps(row, ensure_ascii=False, sort_keys=True).lower()
            ]
        for key, value in (filters or {}).items():
            if value is not None:
                normalized = value.strip().lower()
                rows = [row for row in rows if str(row.get(key, "")).lower() == normalized]
        total = len(rows)
        return rows[offset : offset + limit], total

    def get_record(self, resource: str, record_id: str) -> dict[str, Any] | None:
        self._require_resource(resource)
        if self._connection is not None:
            with self._lock:
                row = self._connection.execute(
                    "SELECT payload FROM records WHERE resource = ? AND record_id = ?",
                    (resource, record_id),
                ).fetchone()
            return json.loads(row["payload"]) if row else None
        for index, row in enumerate(self._records[resource]):
            if self._record_id(resource, row, index) == record_id:
                return dict(row)
        return None

    def status(self) -> dict[str, Any]:
        return {
            "ready": self.integrity_verified and bool(self._records),
            "backend": self.backend,
            "integrity_verified": self.integrity_verified,
            "resources": len(self._records),
            "records": sum(len(rows) for rows in self._records.values()),
        }

    def close(self) -> None:
        if self._connection is not None:
            with self._lock:
                self._connection.close()
            self._connection = None
