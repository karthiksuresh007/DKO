# QA Checklist

## Startup

- `npm.cmd install`
- `npm.cmd run typecheck`
- `npm.cmd run build`
- `npm.cmd run seed:demo`

## Farmer flow

- Farmer email/password signup works
- Farmer login redirects to `/farmer/query`
- Text query returns an AI response
- Voice query uploads and returns a response
- Image query uploads and returns a response
- History page shows all previous queries
- Notifications page shows escalation and officer-response events

## Officer flow

- Officer login works for seeded officer account
- Officer dashboard queue loads
- Claiming a case changes status to `in_progress`
- Officer response resolves the case
- Resolved response appears on farmer thread
- Analytics page loads overview data

## API smoke checks

- `GET /health`
- `POST /api/auth/verify`
- `POST /api/queries`
- `GET /api/queries/:id`
- `POST /api/queries/:id/feedback`
- `GET /api/escalations`
- `POST /api/escalations/:id/respond`
- `GET /api/notifications`
- `GET /api/analytics/overview`
