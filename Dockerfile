FROM python:3.12-slim-bookworm
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1
WORKDIR /app
# Install dependencies separately so code changes can reuse this layer.
COPY requirements.txt ./
RUN python -m pip install --no-cache-dir -r requirements.txt
# Run the backend without root privileges.
RUN groupadd --gid 10001 app \
    && useradd --uid 10001 --gid app --create-home app
COPY --chown=app:app backend/ ./backend/
USER app
EXPOSE 8000
CMD ["python", "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]