# Railway deployment image for the FastAPI backend.
#
# Separate from backend/Dockerfile (which docker-compose.yml still uses
# locally with build context ./backend) because this one needs a repo-root
# build context to also bundle data/raw — the 5 real OIL India PDFs + the
# government CSV — so document registration/indexing works in production
# the same way it does locally, without requiring a volume mount.
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/app ./app
COPY data ./data

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
