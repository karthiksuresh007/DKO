# Demo Script

## 1. Launch the stack

1. Start backend: `npm.cmd run dev:backend`
2. Start frontend: `npm.cmd run dev:app`
3. Optional: seed demo data with `npm.cmd run seed:demo`

## 2. Open the landing page

- Route: `http://localhost:3000/`
- Show the premium landing page and explain the two user surfaces:
  - Farmer PWA
  - Officer Dashboard

## 3. Farmer flow

1. Sign in as `farmer.demo@dko.app`
2. Open text query and submit a question
3. Show the AI response page
4. Open voice query and explain hands-free use in the field
5. Open image query and explain photo-based crop diagnosis
6. Open history and show all previous conversations
7. Open notifications and show officer review / officer response events

## 4. Escalation flow

1. From a farmer response page, click `Need officer review`
2. Explain that low-confidence answers also auto-escalate
3. Show the escalation status badge on the farmer response thread

## 5. Officer flow

1. Sign in as `officer.demo@dko.app`
2. Open the officer dashboard queue
3. Claim a pending escalation
4. Open the escalation detail page
5. Send an officer response
6. Return to the farmer response page and refresh to show the human reply

## 6. Analytics

1. Open `/dashboard/analytics`
2. Show total queries, resolved cases, open escalations, and unread notifications
3. Show query type breakdown and recent activity

## 7. Close-out talking points

- Firebase Auth + Firestore for user and data workflows
- Cloudinary for media uploads
- Gemini for text, voice, and image advisory
- Human-in-the-loop escalation path for low-confidence responses
- Premium mobile-first farmer UI and desktop officer dashboard
