# Estetik Pusula - PRD (Product Requirements Document)

## Product Overview
AI-powered personal beauty roadmap app that analyzes facial features, provides personalized aesthetic recommendations, daily beauty tips, skincare routine tracking, and AI-generated transformation simulations.

## Tech Stack
- **Frontend**: React Native (Expo SDK 54), Expo Router, TypeScript
- **Backend**: FastAPI (Python), MongoDB
- **AI**: OpenAI GPT-4o (face analysis & recommendations), DALL-E 3 (transformation simulations)
- **Auth**: JWT + Emergent Google OAuth
- **Payment**: RevenueCat (iOS) / MOCK dev activation

## Core Features

### 1. AI Face Analysis
- Photo upload via camera or gallery
- AI-powered facial metrics analysis (symmetry, jawline, nose, eyes, lips, skin, etc.)
- 10 distinct metric measurements scored 0-1
- Face shape detection with personalized tips

### 2. Dual Category System
- **Cerrahi (Surgical)**: Rhinoplasty, jawline, eyelid, chin procedures
- **Medikal Estetik (Non-surgical)**: Botox, laser, dermal fillers, skincare

### 3. AI Recommendations (GPT-4o)
- Personalized suggestions based on facial metrics
- Priority levels (high/medium/low)
- Improvement potential percentages
- Cost estimates in Turkish Lira
- Turkish language responses

### 4. Before/After Simulation (DALL-E 3)
- AI-generated transformation visualization
- Premium-only feature
- Clearly labeled "AI Simülasyonu"

### 5. Daily Beauty Tips
- Rotating daily tips across categories (skincare, nutrition, lifestyle)
- Displayed prominently on home screen
- Available via API endpoint

### 6. Beauty Routine Tracker
- Log morning and evening skincare routines
- Track steps completed daily
- Streak tracking for consistency motivation
- Notes for personal observations

### 7. Progress Tracking
- Track score changes across multiple analyses
- Trend analysis (improving/stable/declining)
- Historical score visualization

### 8. Procedure Discovery
- Comprehensive procedure catalog
- Filter by surgical/medical categories
- Cost ranges, duration, recovery info
- Expert advice cards

### 9. Paywall System
- Free: 1 limited analysis (first recommendation visible, rest locked)
- Premium: Full reports, unlimited analysis, HD transformation
- RevenueCat integration for iOS

### 10. User System
- Email/password registration + login
- Google OAuth via Emergent
- Auto-login with device-based accounts
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
- GET /api/daily-tips
- POST /api/routine/log
- GET /api/routine/history
- GET /api/progress/summary
- GET /api/procedures

## Screens
1. Splash → Auto-login redirect (light theme with floating orbs)
2. Auth (Login/Register + Google) - Clean card-based form
3. Home (Daily tip, hero scanner, category selection, quick stats)
4. Discover (Expert tips, procedure catalog, filters)
5. History (Score-based cards, analysis list)
6. Profile (Avatar, stats, settings, language)
7. Camera (Photo capture/upload with scan frame)
8. Loading (Pulsing rings, step-by-step progress)
9. Results (Score card, metrics, recommendations, face shape, transform)

## Design System
- **Theme**: Clean & Airy (light background #FAFBFE)
- **Primary**: Blue (#3B82F6)
- **Secondary**: Purple (#8B5CF6)
- **Accent**: Teal (#06B6D4)
- **Cards**: White with subtle shadows and rounded corners
- **Animations**: Reanimated (floating orbs, metric bars, score counters)
- **Typography**: Bold headings, clean body text

## Monetization
- Freemium model via App Store subscriptions (RevenueCat)
- Premium unlocks all recommendations, AI transformation, unlimited analyses
- MOCK payment for development (instant activation)

## Unique Differentiators
- Daily rotating beauty tips
- Skincare routine tracker with streaks
- Progress tracking across analyses
- Expert advice cards
- Time-based personalized greetings
- Score trend analysis
- Clean light theme (vs typical dark beauty apps)
