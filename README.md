# CS2SCOPE — CS2 Player Stats & FACEIT ELO Tracker

Full-stack MVP: React + TypeScript frontend, Node.js + Express backend.

## Project Structure

```
cs2scope/
├── backend/          # Express API server
│   ├── server.js     # Main server (routes: /api/resolve, /api/player/:id)
│   └── .env          # API keys
└── frontend/         # Vite + React + TypeScript
    ├── src/
    │   ├── App.tsx
    │   ├── api.ts         # Axios API client
    │   ├── i18n.ts        # EN / RU / ES translations
    │   ├── types.ts       # TypeScript interfaces
    │   ├── useLang.tsx    # Language context
    │   ├── utils.ts       # Stat helpers
    │   └── components/
    │       ├── Header.tsx
    │       ├── SearchBar.tsx
    │       ├── LoadingPanel.tsx
    │       ├── ProfileHeader.tsx
    │       ├── CS2Stats.tsx
    │       ├── FaceitPanel.tsx   ← FACEIT level images
    │       └── SeoSection.tsx
    └── index.html     # SEO meta, JSON-LD schema
```

## Running locally

### Backend
```bash
cd backend
npm install
npm start          # port 3001
```

### Frontend
```bash
cd frontend
npm install
npm run dev        # port 5173
```

### Production build
```bash
cd frontend && npm run build   # outputs to dist/
```
Serve `dist/` with any static host (Vercel, Netlify, Nginx).
Set `VITE_API_URL` in frontend `.env` to your backend URL.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/resolve?input=...` | Resolve vanity/URL → SteamID64 |
| GET | `/api/player/:steamid64` | Full player data (Steam + FACEIT) |
| GET | `/api/health` | Health check |

## Features
- 🎮 Full CS2 stats: K/D, HS%, Win Rate, ADR, Accuracy, weapon/map breakdowns
- 🏆 FACEIT ELO, rank level image, match history, streak
- 🔍 Steam profile: avatar, bans, account age, privacy
- 🌍 3 languages: EN / RU / ES (auto-detected by browser)
- 📈 SEO: JSON-LD schema, Open Graph, hreflang, FAQ microdata
