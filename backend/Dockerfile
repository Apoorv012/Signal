FROM python:3.12-slim

WORKDIR /app
ENV PYTHONUNBUFFERED=1 \
    DATABASE_URL=sqlite:////data/signal.db \
    MEDIA_DIR=/data/media

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

# Single worker on purpose: the WebSocket manager is in-memory.
# Mount a persistent volume at /data (SQLite file + uploads).
VOLUME /data
EXPOSE 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --proxy-headers"]
