# Breakout OS

Breakout OS is a polished public roadmap site for building an AI + backend portfolio that can open better local, remote, and relocation opportunities.

The landing page turns a practical career plan into a high-signal web presence: one strong hero image, a focused roadmap, three portfolio projects, and clear money channels.

## What Is Inside

- Next.js frontend with Tailwind styling
- AI/backend career roadmap landing page
- Generated hero artwork saved at `frontend/public/breakout-hero.png`
- Existing dashboard, auth, bot, market, and backend modules preserved
- Fast anchor navigation for roadmap, projects, and income channels

## Local Development

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Deployment Checklist

Set production environment variables before shipping:

| Variable | Description |
| --- | --- |
| `ENV` | Set to `production` for hardened headers. |
| `JWT_SECRET` | Long unique backend auth secret. |
| `SESSION_SECRET` | Unique session middleware secret. |
| `ALLOWED_ORIGINS` | Production frontend domains. |
| `NEXT_PUBLIC_API_URL` | Public backend API base URL. |

## Validation

```bash
cd frontend
npm run build
```

Backend health can be checked with `GET /health` after the API is running.
