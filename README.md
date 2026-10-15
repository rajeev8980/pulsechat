# PulseChat

Unified omnichannel messenger — one inbox for WhatsApp, Telegram, Instagram Direct, Messenger, Carrier SMS, and native Pulse. This repo ships a complete local v1 web slice matching the uploaded design (mock Google sign-in and bridged conversations; no real OAuth or platform APIs).

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Client-side mock data for contacts, threads, and bridge simulation

## Run locally

```bash
npm install
npm run dev -- -p 43127
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127).

## Try the flow

1. **Landing** — Continue with Google / Gmail (mock account chooser).
2. **Discovery** — Search/filter synced contacts; open Chat Workspace or Chat Now.
3. **Chat** — Pick a conversation, send messages, use **Simulate Recipient** to accept a bridge or reply from the other side.
4. Tip: send `/fail` once to exercise the failed-delivery + retry state.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Dev server (add `-p 43127` for the project port) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |

## Design source

Product UI follows the PulseChat omnichannel design HTML (landing → discovery → chat workspace + device simulator).
