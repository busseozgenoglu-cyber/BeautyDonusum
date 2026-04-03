# API Reference

Base URL: `https://your-api-url/api`

All protected endpoints require the `Authorization: Bearer <token>` header.

---

## Authentication

### Register

```
POST /api/auth/register
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "Ada Lovelace"
}
```

**Response:**
```json
{
  "user": { "user_id": "...", "email": "...", "name": "...", "subscription": "free" },
  "token": "<jwt-token>"
}
```

---

### Login

```
POST /api/auth/login
```

**Body:**
```json
{ "email": "user@example.com", "password": "securepassword" }
```

---

### Get Current User

```
GET /api/auth/me
```
*Protected*

---

### Google OAuth

```
POST /api/auth/google-session
```

**Body:**
```json
{ "session_id": "<session-id-from-oauth-flow>" }
```

---

## Face Analysis

### Create Analysis

```
POST /api/analysis
```
*Protected*

**Body:**
```json
{
  "category": "cerrahi",
  "photo_base64": "<base64-encoded-image>",
  "subcategory": null
}
```

`category` values: `"cerrahi"` (surgical) | `"estetik"` (non-surgical)

---

### Get Analysis by ID

```
GET /api/analysis/{analysis_id}
```
*Protected*

---

### Get My Analyses

```
GET /api/analysis/my
```
*Protected*

---

## Subscription

### Activate Subscription

```
POST /api/subscription/activate
```
*Protected*

**Body:**
```json
{ "plan": "premium" }
```

---

### Get Subscription Status

```
GET /api/subscription/status
```
*Protected*

---

## User Settings

### Update Language Preference

```
PUT /api/user/language
```
*Protected*

**Body:**
```json
{ "language": "tr" }
```

---

## Health

```
GET /api/health
```

**Response:**
```json
{ "status": "ok", "db": "connected", "timestamp": "2024-01-01T00:00:00Z" }
```
