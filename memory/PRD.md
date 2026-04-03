# FaceGlow Pro - PRD (Product Requirements Document)

## Product Overview
AI-powered beauty transformation app that analyzes facial features and provides personalized surgical and non-surgical aesthetic recommendations with AI-generated before/after visualizations.

## Tech Stack
- **Frontend**: React Native (Expo SDK 54), Expo Router, TypeScript
- **Backend**: FastAPI (Python), MongoDB
- **AI**: OpenAI GPT-4o (recommendations), GPT Image 1 (transformations)
- **Auth**: JWT + Emergent Google OAuth
- **Payment**: MOCK (App Store handles real payments)

## Core Features

### 1. Face Analysis
- Photo upload via camera or gallery
- Rule-based facial metrics generation (symmetry, jawline, nose, eyes, lips, skin, etc.)
- 10 distinct metric measurements scored 0-1

### 2. Dual Category System
- **Cerrahi (Surgical)**: Rhinoplasty, jawline, eyelid, chin procedures
- **Medikal Estetik (Non-surgical)**: Botox, laser, dermal fillers, skincare

### 3. AI Recommendations (GPT-4o)
- Personalized suggestions based on facial metrics
- Priority levels (high/medium/low)
- Improvement potential percentages
- Turkish language responses

### 4. Before/After Simulation (GPT Image 1)
- AI-generated transformation visualization
- Premium-only feature
- Clearly labeled "AI Simülasyonu"

### 5. Paywall System (MOCK)
- Free: 1 limited analysis (first recommendation visible, rest locked)
- Premium: Full reports, unlimited analysis, HD transformation
- App Store payment integration planned

### 6. User System
- Email/password registration + login
- Google OAuth via Emergent
- User profiles with analysis history
- Language preference (Turkish/English)

## API Endpoints
- POST /api/auth/register, /api/auth/login, GET /api/auth/me
- POST /api/auth/google-session
- POST /api/analysis/create
- POST /api/analysis/{id}/recommendations
- POST /api/analysis/{id}/transform
- GET /api/analysis/{id}, /api/analysis/user/history
- POST /api/subscription/activate
- GET /api/subscription/status
- PUT /api/user/language

## Screens
1. Splash → Auth redirect
2. Auth (Login/Register + Google)
3. Home (Category selection)
4. Camera (Photo capture/upload)
5. Loading (Analysis processing)
6. Results (Metrics, recommendations, paywall, before/after)
7. History (Past analyses)
8. Profile (Settings, subscription, language)

## Design System
- Dark luxury theme (#0A0A0A background)
- Champagne gold accents (#E5C07B)
- Rose gold secondary (#B76E79)
- Glassmorphism cards
- Premium animations (Reanimated)

## Monetization
- Freemium model via App Store subscriptions
- Premium unlocks all recommendations and AI transformation
- MOCK payment for development (instant activation)
