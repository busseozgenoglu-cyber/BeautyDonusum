# Deployment Guide

## Railway (Recommended)

### One-Click Deploy

1. Fork the repository
2. Connect your GitHub account to [Railway](https://railway.app)
3. Create a new project from your fork
4. Set environment variables (see below)
5. Deploy! Railway will auto-detect the `railway.json` config

### Environment Variables for Railway

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URL` | ✅ | MongoDB Atlas connection string |
| `DB_NAME` | Optional | Database name (default: `test_database`) |
| `JWT_SECRET` | ✅ | Long random secret for JWT signing |
| `ADMIN_EMAIL` | ✅ | Admin account email |
| `ADMIN_PASSWORD` | ✅ | Admin account password |
| `EMERGENT_LLM_KEY` | Optional | LLM API key |
| `CORS_ORIGINS` | Optional | Comma-separated allowed origins |

### Generate JWT_SECRET

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

---

## Heroku

1. Install [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
2. Login and create an app:
   ```bash
   heroku login
   heroku create beautydonusum-api
   ```
3. Set environment variables:
   ```bash
   heroku config:set MONGO_URL=<your-mongo-url>
   heroku config:set JWT_SECRET=<your-secret>
   heroku config:set ADMIN_EMAIL=admin@example.com
   heroku config:set ADMIN_PASSWORD=securepassword
   ```
4. Deploy:
   ```bash
   git push heroku main
   ```

The `Procfile` at the root handles process configuration.

---

## Docker

### Build and run locally

```bash
# Copy and fill environment variables
cp .env.example .env

# Start all services
docker compose up --build

# Backend runs on: http://localhost:8000
# Frontend runs on: http://localhost:8081
```

### Build images individually

```bash
# Backend
docker build -t beautydonusum-backend ./backend

# Frontend
docker build -t beautydonusum-frontend ./frontend
```

---

## Environment Variables Reference

See `.env.example` for a full template.

### CORS Configuration

Set `CORS_ORIGINS` to a comma-separated list of allowed origins:

```
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

If `CORS_ORIGINS` is empty or unset, all origins (`*`) are allowed (not recommended for production).

---

## Health Check

The backend exposes a health endpoint at `/api/health`:

```bash
curl https://your-api-url/api/health
# {"status":"ok","db":"connected","timestamp":"..."}
```
