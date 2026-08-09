FROM python:3.13-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1

RUN groupadd --system nabilo && useradd --system --gid nabilo --home-dir /app nabilo
WORKDIR /app/services/api

COPY services/api/requirements.txt ./requirements.txt
RUN python -m pip install --requirement requirements.txt

COPY services/api/app ./app
COPY data /app/data
RUN mkdir -p /app/services/api/.runtime && chown -R nabilo:nabilo /app/services/api/.runtime

USER nabilo
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/v1/ready', timeout=2)"

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--no-server-header"]

