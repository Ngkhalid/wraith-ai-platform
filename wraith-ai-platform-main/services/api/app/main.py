"""FastAPI entry point for the local synthetic FinTech and SOC demo."""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from .config import settings
from .routers import fintech, soc, system
from .store import DataIntegrityError, DataStore


@asynccontextmanager
async def lifespan(application: FastAPI):
    store = DataStore(settings.data_dir, settings.manifest_path, settings.database_path)
    store.initialize()
    application.state.store = store
    try:
        yield
    finally:
        store.close()


app = FastAPI(
    title="Honeypot Environment Synthetic API",
    version="1.0.0",
    description="Local-only API serving deterministic fictional data. No runtime network egress is used.",
    docs_url=None,
    redoc_url=None,
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["localhost", "127.0.0.1", "testserver"])
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=settings.local_origin_regex,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Accept", "Content-Type"],
    max_age=600,
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Cache-Control"] = "no-store"
    response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"
    return response


@app.exception_handler(DataIntegrityError)
async def integrity_error_handler(_: Request, exc: DataIntegrityError) -> JSONResponse:
    return JSONResponse(status_code=503, content={"code": "data_integrity_error", "detail": str(exc)})


@app.get("/")
def root() -> dict:
    return {
        "service": "honeypot-api",
        "version": "1.0.0",
        "synthetic": True,
        "health": "/api/v1/health",
        "openapi": "/api/openapi.json",
    }


app.include_router(system.router, prefix="/api/v1")
app.include_router(fintech.router, prefix="/api/v1")
app.include_router(soc.router, prefix="/api/v1")
