# Frontend env
NEXT_PUBLIC_API_URL=http://localhost:4000

---

# CareBot Frontend — Integration Guide

## Muundo wa Faili

```
/carebot-frontend
├── app/
│   ├── layout.jsx          ← copy from app-layout.jsx
│   ├── page.jsx            ← redirect to /auth or /dashboard
│   ├── auth/page.jsx       ← copy auth-flow.jsx content
│   └── dashboard/page.jsx  ← copy dashboard-connected.jsx content
├── context/
│   ├── AuthContext.jsx     ← global user + business state
│   └── SocketContext.jsx   ← real-time WebSocket events
├── hooks/
│   └── useData.js          ← data fetching hooks
├── lib/
│   └── api.js              ← central API client
├── middleware.js            ← route protection
├── .env.local              ← NEXT_PUBLIC_API_URL=http://localhost:4000
└── package.json
```

## Anza Haraka

```bash
# 1. Anza Backend kwanza (port 4000)
cd carebot-backend && npm run dev

# 2. Anza Frontend (port 3000)
cd carebot-frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:4000" > .env.local
npm run dev
```

## Data Flow

```
User action (click/type)
        ↓
Component state (useState)
        ↓
API call via lib/api.js
        ↓
Backend Express server (port 4000)
        ↓
PostgreSQL DB / OpenClaw / Meta API
        ↓
Response → setData → UI re-renders

Real-time updates:
Backend → Socket.io → SocketContext → Component listener → UI update
```

## Routes

| Path | Component | Inalinda |
|------|-----------|---------|
| / | Redirect | Hapana |
| /auth | Auth Flow (Login/Register/Onboarding) | Guest only |
| /dashboard | Full Dashboard | Inahitaji token |

## API Token Management

Token inahifadhiwa katika `localStorage` na inawekwa header ya `Authorization: Bearer <token>` kwa kila API call.

Kama token imeisha muda (401), user anaelekezwa `/auth` moja kwa moja.
