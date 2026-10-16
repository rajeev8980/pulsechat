# PulseChat

Unified omnichannel messenger — one inbox for WhatsApp, Telegram, Instagram Direct, Messenger, Carrier SMS, and native Pulse.

**No fake users:** sign in with your name, email, and mobile. Contacts start empty.

**Auto-fetch mobiles:** After sign-in, tap **Fetch mobiles from phone** (Android Chrome Contact Picker) or paste `Name, email, phone` lines. PulseChat matches synced numbers to registered accounts and marks **Available on PulseChat**.

**Common messaging gateway:** Platform A → `/api/gateway/send` → Platform B.

**Pulse↔Pulse:** Matched mobiles/emails become Native Pulse peers; messages land in their inbox (live poll every 2s).

**Real WhatsApp / Telegram:** Gateway opens the native app (handoff). Optional WhatsApp Cloud API via `WHATSAPP_ACCESS_TOKEN` + `WHATSAPP_PHONE_NUMBER_ID`.

## Stack

- **Frontend / UI:** Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Next.js Route Handlers (`/api/*`) + cookie session + in-memory data store (persisted under `/tmp`)
- **Android PWA:** installable via Chrome — manifest, service worker, auto-update on `buildId` change

## Run locally

```bash
npm install
npm run build
npm run start -- -p 43127
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127).

**Live (permanent):** [https://pulsechat-lake-one.vercel.app](https://pulsechat-lake-one.vercel.app)

### Install on Android

1. Open the live HTTPS URL in **Chrome** on Android.
2. Tap install / Add to Home screen.
3. Use **Fetch mobiles from phone** — select contacts; mobiles are matched to who is on PulseChat.

## Try the flow

1. **Sign in** with name + email + **mobile** (so friends can find you by number).
2. **Fetch mobiles** from the phonebook (or Paste import).
3. Contacts with a matching Pulse account show **Available on PulseChat** — chat natively.
4. Phone-only contacts without Pulse stay as WhatsApp handoff.

## API overview

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Health check |
| POST | `/api/auth/login` | Sign-in (`name`, `email`, optional `phone`) |
| POST | `/api/auth/logout` | Clear session |
| GET | `/api/auth/me` | Current user |
| GET | `/api/contacts` | Contacts + Pulse availability match |
| POST | `/api/contacts` | Add a contact |
| POST | `/api/contacts/import` | Bulk import (returns `availableOnPulse`) |
| POST | `/api/contacts/resync` | Refresh / device sync helper |
| POST | `/api/gateway/send` | Common messaging gateway |
| GET | `/api/messages/:contactId` | Thread |
| GET | `/api/version` | PWA auto-update build id |

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Dev server (add `-p 43127`) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |

## Source

https://github.com/rajeev8980/pulsechat
