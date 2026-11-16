# Stelli

Stelli is a curated marketplace for booking vetted photographers and filmmakers,
live at **[getstelli.com](https://getstelli.com)**, piloting at Elon University
(NC) with New York City next. A client picks a creator and sends a date, the
creator replies with a private quote, the client pays through Stripe, and the
money is held until the photos are delivered.

The app is built on [Base44](https://base44.com). This repo and the Base44
builder are two views of the same code: a change merged to `main` shows up in
the builder, and a change made in the builder is committed to `main` by
`base44-builder[bot]`.

## What's where

```
src/                     The website (React 18, Vite, Tailwind, TanStack Query)
  App.jsx                Every route in one place
  pages/                 One file per page; creator portal pages in pages/creator/
  components/
    system/              Shared building blocks (see "Design system" below)
    shared/              Layout, navbar, footer, menus
    home/ browse/ profile/   Public pages: home, creator list, creator profiles
    thread/              The shoot thread: messages, quotes, delivery, payment
    wizard/              The creator profile wizard (/apply, /edit-profile)
    dashboard/ creator/  Client and creator portals
    admin/               The founder dashboard (/admin)
    ui/                  Low-level inputs (shadcn/Radix)
  hooks/                 Data hooks for each portal
  lib/                   Helpers: formatting, auth, booking status, legal text
  styles/                system.css plus page-specific stylesheets

base44/                  The backend, deployed by Base44
  entities/              Data models (Booking, Lensman = creator, Quote, ...)
  functions/<name>/entry.ts   One backend function per folder
  shared/                Code the functions share: money math, refunds, payouts,
                         booking rules, access checks, Stripe
  workflows/             Scheduled jobs (hourly payout release, status emails)
  agents/                The FAQ concierge's instructions

tests/                   Backend flows run against a fake Base44 and fake Stripe
  e2e/                   Browser test and the local mock backend
  live-stripe/           Optional: real Stripe test-mode runs (npm run test:stripe)

docs/reviews/            Written reviews of the code (money and access, Nov 2026)
ci/                      Type-check config and the GitHub ruleset for main
```

Naming: the backend calls a creator a **Lensman**; the website says
**creator**. They are the same thing.

## Run it

```bash
npm install
npm run dev:mock      # the site plus a local fake backend, no live data touched
```

Sign in with any password as `jordan@example.com` (client), `maya@example.com`
(creator), `sam@example.com` (new creator), `priya@example.com` (creator in
review) or `founder@example.com` (opens `/admin`).

To point at the live backend instead, create `.env.local` with
`VITE_BASE44_APP_ID` and `VITE_BASE44_APP_BASE_URL`, then `npm run dev`.
Be careful: the live app takes real payments.

## Checks

Every pull request runs four checks (`.github/workflows/ci.yml`). Run them
locally with:

```bash
npm test              # backend flows: payments, refunds, payouts, access
npm run lint
npm run typecheck     # backend must be clean; frontend can't add new errors
npm run build
```

Commits from the Base44 builder land on `main` directly and skip these gates,
so a builder edit can break a check. Look at the Actions tab after a builder
session.

## Design system

Every screen is built from `src/styles/system.css` and the components in
`src/components/system`. The top of `system.css` lists every class and token.
Brand: dark navy `#0a0f1e` base; lime `#C4F82A` for actions, cyan `#2AE8F8`
for creator-side UI, magenta `#F82AC4` for ratings; Fraunces for headlines,
Inter for body text.

## Publishing

Merging to `main` updates the code in Base44. Publish from the Base44 editor
to put it live.
