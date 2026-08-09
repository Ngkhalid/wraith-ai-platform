"""Health, readiness, and local simulated event streaming."""

from __future__ import annotations

import asyncio
from itertools import cycle
import re

from fastapi import APIRouter, Request, WebSocket, WebSocketDisconnect

from ..config import settings
from .common import get_store


router = APIRouter(tags=["system"])


@router.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "honeypot-api", "environment": "local-demo", "synthetic": True}


@router.get("/ready")
def ready(request: Request) -> dict:
    status = get_store(request).status()
    return {"status": "ready" if status["ready"] else "not-ready", **status}


@router.websocket("/stream/events")
async def event_stream(websocket: WebSocket) -> None:
    origin = websocket.headers.get("origin")
    if origin and re.fullmatch(settings.local_origin_regex, origin) is None:
        await websocket.close(code=1008, reason="local origins only")
        return
    await websocket.accept()
    store = websocket.app.state.store
    events = store.all_records("events")
    try:
        requested = int(websocket.query_params.get("interval_ms", "1000"))
    except ValueError:
        requested = 1000
    interval_seconds = max(250, min(requested, 5000)) / 1000
    sequence = 0
    try:
        for event in cycle(events):
            await websocket.send_json({"stream_sequence": sequence, "simulated": True, "event": event})
            sequence += 1
            await asyncio.sleep(interval_seconds)
    except WebSocketDisconnect:
        return
