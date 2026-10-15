# PulseChat

Unified omnichannel messenger — one inbox for WhatsApp, Telegram, Instagram Direct, Messenger, Carrier SMS, and native Pulse. Frontend UI matches the uploaded design; backend is a Next.js API with session cookies and an in-memory store (local demo, no real OAuth or carrier gateways).

## Stack

- **Frontend / UI:** Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Next.js Route Handlers (`/api/*`) + cookie session + in-memory data store
- **Client:** React context talks to the API for login, contacts, messages, and bridge simulation
- **Android mobile web app (PWA):** installable via Chrome — manifest, service worker, home-screen icons, install banner

## Run locally

```bash
npm install
npm run dev -- -p 43127
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127).

### Install on Android

1. Open the site in **Chrome** on Android (same LAN URL as the machine running `npm run dev`, e.g. `http://<your-ip>:43127`).
2. Tap the install banner, or Chrome menu → **Install app** / **Add to Home screen**.
3. Launch PulseChat from the home screen — it opens fullscreen (`display: standalone`).

PWA assets: `/manifest.webmanifest`, `/sw.js`, `/icons/icon-192.png`, `/icons/icon-512.png`.

## Try the flow

1. **Landing** — Continue with Google / Gmail (mock account chooser → `POST /api/auth/login`).
2. **Discovery** — Contacts from `GET /api/contacts`; re-sync via `POST /api/contacts/resync`.
3. **Chat** — Threads from `GET /api/messages/:id`; send via `POST /api/messages/:id`.
4. **Simulate Recipient** — `POST /api/bridges/:id/accept` or `…/simulate-reply`.
5. Tip: send `/fail` once to exercise failed delivery + retry (`POST /api/messages/:id/retry`).

## API overview

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Health check |
| POST | `/api/auth/login` | Mock Gmail login (sets `pulsechat_session`) |
| POST | `/api/auth/logout` | Clear session |
| GET | `/api/auth/me` | Current user |
| GET | `/api/contacts` | Synced contacts |
| POST | `/api/contacts/resync` | Re-sync phonebook |
| GET | `/api/messages/:contactId` | Thread (+ optional `?after=`) |
| POST | `/api/messages/:contactId` | Send message |
| POST | `/api/messages/:contactId/retry` | Retry failed message |
| POST | `/api/bridges/:contactId/accept` | Accept platform bridge |
| POST | `/api/bridges/:contactId/simulate-reply` | Recipient reply |

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Dev server (add `-p 43127`) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |

## Design source

Product UI follows the PulseChat omnichannel design (landing → discovery → chat workspace + device simulator).
