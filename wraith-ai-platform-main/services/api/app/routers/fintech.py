"""Read-only synthetic FinTech endpoints."""

from __future__ import annotations

from collections import Counter

from fastapi import APIRouter, HTTPException, Query, Request, status

from .common import get_store, invalid_resource, page_payload


router = APIRouter(prefix="/fintech", tags=["fintech"])
FINTECH_RESOURCES = frozenset(
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
    }
)
ALIASES = {"auth-logs": "auth_logs", "audit-logs": "audit_logs"}


@router.get("/summary")
def summary(request: Request) -> dict:
    store = get_store(request)
    accounts = store.all_records("accounts")
    transactions = store.all_records("transactions")
    invoices = store.all_records("invoices")
    directions = Counter(row["direction"] for row in transactions)
    return {
        "synthetic": True,
        "customers": len(store.all_records("customers")),
        "accounts": len(accounts),
        "aggregate_balance": round(sum(float(row["current_balance"]) for row in accounts), 2),
        "transactions": len(transactions),
        "incoming_transactions": directions["incoming"],
        "outgoing_transactions": directions["outgoing"],
        "open_invoices": sum(row["status"] != "paid" for row in invoices),
    }


@router.get("/{resource}")
def list_resource(
    resource: str,
    request: Request,
    limit: int = Query(25, ge=1, le=100),
    offset: int = Query(0, ge=0, le=100_000),
    q: str | None = Query(None, min_length=1, max_length=100),
    status_filter: str | None = Query(None, alias="status", min_length=1, max_length=40),
    direction: str | None = Query(None, pattern="^(incoming|outgoing)$"),
) -> dict:
    canonical = ALIASES.get(resource, resource)
    if canonical not in FINTECH_RESOURCES:
        raise invalid_resource(resource)
    items, total = get_store(request).list_records(
        canonical,
        limit=limit,
        offset=offset,
        query=q,
        filters={"status": status_filter, "direction": direction},
    )
    return page_payload(items, total, limit, offset)


@router.get("/{resource}/{record_id}")
def get_resource(resource: str, record_id: str, request: Request) -> dict:
    canonical = ALIASES.get(resource, resource)
    if canonical not in FINTECH_RESOURCES:
        raise invalid_resource(resource)
    if len(record_id) > 100:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="record id too long")
    record = get_store(request).get_record(canonical, record_id)
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="record not found")
    return record

