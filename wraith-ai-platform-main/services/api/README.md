# Honeypot Environment local synthetic API

This service exposes versioned, read-only FinTech and SOC endpoints backed by
the generated JSON fixtures. It verifies every fixture against
`data/manifest.json`, then builds a disposable SQLite cache. If SQLite cannot be
created, the API continues with its verified in-memory JSON fallback.

The service is local-demo only. It has no outbound HTTP client, does not fetch
URLs, and never executes captured commands or artifacts. The virtual shell maps
a small command vocabulary to fixed strings and always returns
`executed: false` and `network_access: false`.

## Run locally

Use a Python 3.12 or 3.13 environment for the project. Python 3.14 may work for
development but is not the deployment target.

```powershell
python -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements-dev.txt
.\.venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Useful routes:

- `GET /api/v1/health`
- `GET /api/v1/ready`
- `GET /api/v1/fintech/summary`
- `GET /api/v1/fintech/transactions?direction=incoming&limit=25`
- `GET /api/v1/soc/summary`
- `GET /api/v1/soc/events?severity=critical&limit=25`
- `POST /api/v1/soc/sessions/ses_00001/shell`
- `WS /api/v1/stream/events?interval_ms=1000`

The machine-readable OpenAPI contract is available only on the local listener
at `http://127.0.0.1:8000/api/openapi.json`. Interactive CDN-backed API docs are
deliberately disabled so opening the API does not cause browser egress.

## Test

```powershell
.\.venv\Scripts\python -m pytest -q
```
