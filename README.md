# Digital Krishi Officer

Digital Krishi Officer (DKO) is an AI-powered agricultural advisory prototype built for an academic capstone. It delivers a mobile-first farmer experience and a desktop officer dashboard with a fast, visible end-to-end workflow: farmer query, AI response, escalation, officer intervention, notification, and analytics.

## Stack

- Frontend: Next.js 14, React, Tailwind CSS, Framer Motion
- Backend: Node.js, Express, TypeScript
- Auth + Data: Firebase Auth, Firestore
- Media: Cloudinary
- AI: Gemini multimodal API

## Current Feature Set

### Farmer app

- Email/password signup and login
- Premium landing page and farmer workspace
- Text, voice, and image advisory flows
- AI response thread with confidence and escalation controls
- Query history screen
- In-app notifications inbox

### Officer dashboard

- Officer/admin email login
- Escalation queue with claim flow
- Escalation detail page with response composer
- Analytics overview page
- Logout flow

### Backend

- Firebase token verification
- Query creation and retrieval APIs
- Media upload APIs
- Escalation APIs
- Notification APIs
- Analytics overview API
- Demo seed script for repeatable presentation data

## Repo Structure

- `app/`: Next.js farmer and officer UI
- `backend/`: Express API and seed tooling
- `shared/`: shared TypeScript contracts
- `docs/`: demo and QA documentation

## Local Setup

1. Create frontend env file:
   - copy `app/.env.local.example` to `app/.env.local`
2. Create backend env file:
   - copy `backend/.env.example` to `backend/.env`
3. Install dependencies:
   - `npm.cmd install`
4. Start backend:
   - `npm.cmd run dev:backend`
5. Start frontend:
   - `npm.cmd run dev:app`

## Main Scripts

- `npm.cmd run dev:app`
- `npm.cmd run dev:backend`
- `npm.cmd run typecheck`
- `npm.cmd run build`
- `npm.cmd run seed:demo`

## Demo Data

Seed deterministic demo users and data with:

```powershell
npm.cmd run seed:demo
```

Demo credentials are documented in [docs/DEMO_CREDENTIALS.md](./docs/DEMO_CREDENTIALS.md).

## Demo Flow

Use [docs/DEMO_SCRIPT.md](./docs/DEMO_SCRIPT.md) for the presentation walkthrough.

## QA

Use [docs/QA_CHECKLIST.md](./docs/QA_CHECKLIST.md) for final smoke testing.

## Important Notes

- This is a prototype optimized for speed and a visible end-to-end demo.
- Notifications are implemented as in-app inbox notifications for reliability.
- Secrets must remain in local env files only. Do not commit `.env` files or service account JSON files.
