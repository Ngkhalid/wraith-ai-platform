"""Read-only SOC telemetry and deterministic shell simulation endpoints."""

from __future__ import annotations

from collections import Counter

from fastapi import APIRouter, HTTPException, Query, Request, status

from ..models import VirtualShellRequest, VirtualShellResponse
from ..simulation import simulate_shell
from .common import get_store, invalid_resource, page_payload


router = APIRouter(prefix="/soc", tags=["soc"])
SOC_RESOURCES = frozenset(
    {
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
ALIASES = {
    "mitre-mappings": "mitre_mappings",
    "sandbox-reports": "sandbox_reports",
    "canary-activity": "canary_activity",
    "playbook-runs": "playbook_runs",
}


@router.get("/summary")
def summary(request: Request) -> dict:
    store = get_store(request)
    events = store.all_records("events")
    alerts = store.all_records("alerts")
    attacks = store.all_records("attacks")
    severity = Counter(row["severity"] for row in events)
    countries = Counter(row["country_code"] for row in attacks)
    return {
        "synthetic": True,
        "events": len(events),
        "attacks": len(attacks),
        "sessions": len(store.all_records("sessions")),
        "open_alerts": sum(row["status"] != "closed" for row in alerts),
        "severity": dict(severity),
        "top_countries": [
            {"country_code": country, "events": count} for country, count in countries.most_common(10)
        ],
    }


@router.post("/sessions/{session_id}/shell", response_model=VirtualShellResponse)
def virtual_shell(session_id: str, payload: VirtualShellRequest, request: Request) -> VirtualShellResponse:
    if len(session_id) > 100:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="session id too long")
    if get_store(request).get_record("sessions", session_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="session not found")
    output, exit_code = simulate_shell(payload.command)
    return VirtualShellResponse(
        session_id=session_id,
        command=payload.command,
        output=output,
        exit_code=exit_code,
        executed=False,
        network_access=False,
    )


@router.get("/{resource}")
def list_resource(
    resource: str,
    request: Request,
    limit: int = Query(25, ge=1, le=100),
    offset: int = Query(0, ge=0, le=100_000),
    q: str | None = Query(None, min_length=1, max_length=100),
    status_filter: str | None = Query(None, alias="status", min_length=1, max_length=40),
    severity: str | None = Query(None, pattern="^(low|medium|high|critical)$"),
    country_code: str | None = Query(None, pattern="^[A-Z]{2}$"),
) -> dict:
    canonical = ALIASES.get(resource, resource)
    if canonical not in SOC_RESOURCES:
        raise invalid_resource(resource)
    items, total = get_store(request).list_records(
        canonical,
        limit=limit,
        offset=offset,
        query=q,
        filters={"status": status_filter, "severity": severity, "country_code": country_code},
    )
    return page_payload(items, total, limit, offset)


@router.get("/{resource}/{record_id}")
def get_resource(resource: str, record_id: str, request: Request) -> dict:
    canonical = ALIASES.get(resource, resource)
    if canonical not in SOC_RESOURCES:
        raise invalid_resource(resource)
    if len(record_id) > 100:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="record id too long")
    record = get_store(request).get_record(canonical, record_id)
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="record not found")
    return record

