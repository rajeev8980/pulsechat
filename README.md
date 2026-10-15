# PulseChat

Unified omnichannel messenger — one inbox for WhatsApp, Telegram, Instagram Direct, Messenger, Carrier SMS, and native Pulse. Frontend UI matches the uploaded design; backend is a Next.js API with session cookies and an in-memory store (local demo, no real OAuth or carrier gateways).

**No fake users:** sign in with your own name + email. Contacts start empty — add people yourself.

**Common messaging gateway:** Platform A (PulseChat) → `/api/gateway/send` → Platform B (Pulse / WhatsApp / Telegram / SMS…). See `docs` in the agent store: `messaging-gateway.md`.

**Pulse↔Pulse:** Add a contact as **Native Pulse** with their PulseChat email. Messages land in their inbox when they sign in with that email (live poll every 2s).

**Real WhatsApp / Telegram:** Gateway opens the native app (handoff); they receive it after you Send there. Optional WhatsApp Cloud API via `WHATSAPP_ACCESS_TOKEN` + `WHATSAPP_PHONE_NUMBER_ID`.

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

1. Open the **live** URL (see docs) or your LAN/dev URL in **Chrome** on Android.
2. Tap the install banner, or Chrome menu → **Install app** / **Add to Home screen**.
3. Launch PulseChat from the home screen — it opens fullscreen (`display: standalone`).

PWA assets: `/manifest.webmanifest`, `/sw.js`, `/icons/icon-192.png`, `/icons/icon-512.png`.

## Try the flow

1. **Landing** — Sign in with your name + email (`POST /api/auth/login`).
2. **Discovery** — Contacts start empty; **Add contact**, then `GET /api/contacts`. Refresh via `POST /api/contacts/resync`.
3. **Chat** — Threads from `GET /api/messages/:id`; send via `POST /api/messages/:id`.
4. **Simulate Recipient** — `POST /api/bridges/:id/accept` or `…/simulate-reply`.
5. Tip: send `/fail` once to exercise failed delivery + retry (`POST /api/messages/:id/retry`).

## API overview

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Health check |
| POST | `/api/auth/login` | Email sign-in (sets `pulsechat_session`) |
| POST | `/api/auth/logout` | Clear session |
| GET | `/api/auth/me` | Current user |
| GET | `/api/contacts` | Your contacts (starts empty) |
| POST | `/api/contacts` | Add a contact |
| POST | `/api/contacts/resync` | Refresh phonebook |
| GET | `/api/messages/:contactId` | Thread (+ optional `?after=`) |
| POST | `/api/messages/:contactId` | Send message |
| POST | `/api/messages/:contactId]/retry` | Retry failed message |
| POST | `/api/bridges/:contactId/accept` | Accept platform bridge |
| POST | `/api/bridges/:contactId/simulate-reply` | Recipient reply |

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Dev server (add `-p 43127`) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |

## Source

https://github.com/rajeev8980/pulsechat
