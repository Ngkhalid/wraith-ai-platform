"""Shared route helpers."""

from __future__ import annotations

from typing import Any

from fastapi import HTTPException, Request, status

from ..store import DataStore


def get_store(request: Request) -> DataStore:
    return request.app.state.store


def page_payload(items: list[dict[str, Any]], total: int, limit: int, offset: int) -> dict[str, Any]:
    return {
        "items": items,
        "meta": {
            "total": total,
            "limit": limit,
            "offset": offset,
            "has_more": offset + len(items) < total,
            "synthetic": True,
        },
    }


def invalid_resource(resource: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={"code": "resource_not_found", "resource": resource},
    )

