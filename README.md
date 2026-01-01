# AI Trading Bot Platform

A professional-grade AI trading bot platform featuring sentiment analysis, social signals, and institutional-ready trading logic.

## 🛠️ Deployment Checklist

Before taking the platform live, ensure you have configured the following environment variables in your production environment. These are critical for security and cross-origin communication.

| Variable | Description | Recommendation |
| :--- | :--- | :--- |
| `ENV` | Environment mode | Set to `production` to enable security headers. |
| `JWT_SECRET` | Backend auth secret | Use a long, unique random string. |
| `SESSION_SECRET` | Session middleware secret | Use a unique random string. |
| `ALLOWED_ORIGINS` | Permitted frontend domains | e.g. `https://yourbot.com`. |
| `NEXT_PUBLIC_API_URL` | Frontend API base URL | e.g. `https://api.yourbot.com`. |

### ✅ Verification
1. Run `GET /health` to verify system and database status.
2. Check `auth/login` to ensure JWTs are being issued with the new 7-day expiry.
3. Verify that CORS is restricted to your production domain.

## 🚀 Setup & Development

### Backend
1. `cd backend`
2. `pip install -r requirements.txt`
3. `cp .env.example .env` (then fill in your credentials)
4. `uvicorn app.main:app --reload`

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`
