# BeautyDonusum 💄

AI-powered beauty transformation and face analysis app built with FastAPI and React Native (Expo).

## ✨ Features

- 🤖 AI face analysis with detailed metrics
- 💉 Surgical & non-surgical treatment recommendations
- 📊 Analysis history
- 🔐 JWT authentication + Google OAuth
- 🌍 Turkish / English language support
- 📱 iOS, Android & Web support

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 20+
- Yarn 1.22+
- MongoDB Atlas account (or local MongoDB)

### 1. Clone & setup environment

```bash
cp .env.example .env
# Edit .env with your values
```

### 2. Backend

```bash
cd backend
cp .env.example .env
pip install -r requirements.txt
./start.sh
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
yarn install
yarn start
```

### 4. Docker (all-in-one)

```bash
cp .env.example .env
docker compose up --build
```

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI + Uvicorn |
| Database | MongoDB (Motor async) |
| Authentication | JWT + bcrypt + Google OAuth |
| Frontend | React Native + Expo Router |
| Deployment | Railway / Docker |

## 📖 Docs

- [Setup Guide](SETUP.md)
- [Deployment Guide](DEPLOYMENT.md)
- [API Reference](API.md)

