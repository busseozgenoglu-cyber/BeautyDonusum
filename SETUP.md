# Local Development Setup

## Prerequisites

- Python 3.11+
- Node.js 20+
- Yarn 1.22+
- MongoDB Atlas (free tier) or local MongoDB

---

## 1. Clone the Repository

```bash
git clone https://github.com/busseozgenoglu-cyber/BeautyDonusum.git
cd BeautyDonusum
```

---

## 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env – fill in MONGO_URL, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD

# Start the server
./start.sh
# Server available at: http://localhost:8000
# API docs at:         http://localhost:8000/docs
```

---

## 3. Frontend Setup

```bash
cd frontend

# Install dependencies
yarn install

# Configure environment
cp .env.example .env
# Edit .env – set EXPO_PUBLIC_API_URL=http://localhost:8000

# Start Expo dev server
yarn start

# Press 'w' for web, 'i' for iOS simulator, 'a' for Android emulator
```

---

## 4. Docker (easiest)

```bash
# From the project root:
cp .env.example .env
# Edit .env

docker compose up --build
```

Services:
- Backend: http://localhost:8000
- Frontend: http://localhost:8081

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `MONGO_URL` | MongoDB connection string |
| `DB_NAME` | Database name |
| `JWT_SECRET` | Secret key for JWT tokens |
| `ADMIN_EMAIL` | Seeded admin email |
| `ADMIN_PASSWORD` | Seeded admin password |
| `EMERGENT_LLM_KEY` | Optional – LLM API key |
| `CORS_ORIGINS` | Allowed frontend origins |
| `EXPO_PUBLIC_API_URL` | Backend URL for frontend |

---

## Running Tests

```bash
# Backend tests
cd backend
pytest tests/ -v

# Frontend lint
cd frontend
yarn lint
```
