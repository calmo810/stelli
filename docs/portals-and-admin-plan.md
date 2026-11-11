# Portals and admin page: the plan, for your go-ahead

This is the "show me before you build" step for PR 2. Nothing here is built yet. Each screen has **what's there now**, **what I'd change**, and **why**. Say "go" (or change anything) and I'll build it on this branch.

It builds on PR 1, which already fixed what the portals *say*: the real next step for each booking, calm status lines, nothing falling out of the lists, signed-out redirects, and the new thread controls (cancel, decline, review, release early). This plan is about how the screens are *laid out*.

Brand rules throughout: navy `#0a0f1e`, lime for the one main action, cyan for the creator side, magenta for ratings and warnings; Fraunces / Inter / JetBrains Mono / Caveat; few options, nothing busy. Every tap target at least 48 px tall. One column on phones, no sideways scrolling. Loading placeholders the same size as what replaces them, so nothing jumps.

---

## What each person needs, most often first

**Client**
1. Where my booking stands, and the one thing I need to do (answer a quote, pay, look at my photos).
2. Talk to my creator.
3. My photos.
4. Book someone (again).
5. My agreements and receipts.
6. Say yes or no to a creator showing my shoot.
7. Account settings.

**Creator**
1. New requests to answer and quote.
2. Shoots to deliver.
3. Talk to clients.
4. My money: what's held for me, what's on its way, what I've been paid. Payout setup if it isn't done.
5. My profile: edit it, share it.
6. Photo releases to answer.
7. Agreements, account.

Everything on screen should map to one of these. Anything that doesn't goes.

---

## Client portal (`/client-dashboard`)

**Now:** "Hey, Jordan." → a "To do" list (or "You're all caught up") → "Your shoots" with Active / Past tabs and status chips → a "Photo releases" section → an "Agreements" section → rows for Messages, Find a creator, Account. Five sections, two of which are usually empty or rarely needed.

**Change:**
1. **One "next" card at the top.** The single most pressing step, full width, with one lime button: *"Pay $171 to lock in Maya · Sat, Nov 14."* If there's more than one, the others sit in a short list under it. If there's nothing: *"Nothing needs you right now."* in plain text, with "Find a creator" as a quiet link.
2. **Your shoots, as one list.** Each row: creator, date, and the plain status line ("Booked. Your payment is held safely until your photos arrive.") instead of a chip alone. Past shoots fold into a "Past shoots (3)" line you tap to open, instead of a tab switch.
3. **Photo releases become to-do items** ("Can Maya show your shoot on her page?") in the next-step list, when they're waiting on you. No standing section.
4. **Agreements move into each shoot** (a link in the thread's header) and into Account. Off the dashboard.
5. **Bottom rows:** Messages (with "2 new"), Account. "Find a creator" lives in the nav and in the empty state.

**Why:** you open it and see one thing to do, or nothing. Four sections become two.

---

## Creator portal (`/lensman-dashboard`)

> **Update, 11 November:** `main` now has a new creator workspace you built with the Base44 builder: Overview, Requests (with a page per request), Bookings, Calendar, Earnings and Profile. PR 1 merged it in and kept it, and fixed what it reads. So **this section is out of date**. I won't redesign your new workspace. If you say "go", I'd only fold items 2, 3 and 5 below into it: one "next" card, the money strip on Earnings, and photo releases as to-do items. Everything else on this screen is already yours.

**Before your new workspace:** "Hey, Maya." → one status note (pending / on hold / payout setup) → "To do" → "Your shoots" (Active / Past) → "Photo releases" → "Agreements" → rows for Messages, Edit profile, View public page, Payouts, Account.

**Change:**
1. **Status note only when something is off**, as now, one at a time; the payout card always shows when money is waiting on setup (PR 1).
2. **One "next" card**, same pattern as the client: *"Quote Jordan · Portraits, Sat Nov 14"*, *"Deliver Jordan's final edits"*, *"Accept the agreement for Jordan's shoot"*.
3. **A small money strip** under it, three numbers: *Held for you* · *On its way* · *Paid this month*. Tap opens your Stripe payouts page. No table.
4. **Your shoots** as one list with status lines, past folded away.
5. **Photo releases become to-do items** when they're waiting on you.
6. **Bottom rows:** Messages, Edit profile, Share your page (copies the link), Payouts, Account, Client portal (only if you've booked someone).

**Why:** the money question ("when do I get paid?") is the one creators ask most, and today it's buried in each thread.

---

## The booking thread (`/messages/:id`)

**Now:** header (name, chip, one status line, "Send a quote") → request summary → held-payment note → messages and quote cards mixed by time → delivery card → system notices at the very bottom → (PR 1) cancel / review / release early at the foot.

**Change:**
1. **The next step pinned under the header**, the same card as on the dashboard, so it never scrolls away: pay, accept the agreement, deliver, look at your photos.
2. **Contact card once the booking is paid.** The creator's email, phone and Instagram are unlocked by the server at that point, but no screen shows them today. A small card: *"You're booked. Here's how to reach Maya."*
3. **System notices in the timeline**, where they happened, not stacked at the bottom.
4. **A "⋯" menu in the header** for the rare things: the agreement, report an issue (user reports: off-platform, behaviour, no-show), cancel. The foot of the thread stays clean.
5. **One quote card per state**, as PR 1 made them, but older quotes collapse to one line ("Earlier quote · $300 · replaced").

**Why:** the thread is where everything happens. The one action you need shouldn't depend on scrolling.

---

## Admin page (`/admin`)

> **Update, 11 November (afternoon):** `main` now has a redesigned admin page you built with the Base44 builder: a hero, stat cards, restyled tabs, and a new Applications view with the portfolio and contact details side by side. PR 1 merged it in and kept it, with PR 1's queue, Activity tab, holds and "Fees earned" inside it. The layout below was written before that. If you say "go", I'd keep your design and change only what it doesn't do yet: open on the queue, move reports into it, cut nine tabs to four, and add the Money view with the read-only Stripe reconcile.

**Before your redesign:** a page header, four stat tiles, then nine tabs: Overview, Applications, Active lensmen, Bookings, Needs you, Pay creators, One-off payments, FAQ chat, Activity. Tables of cards; the tabs wrap on a phone.

**Change — four places, phone first, a bottom bar on phones and a left rail on a computer:**

1. **Queue** (opens here). One list of everything waiting on you, most urgent first: card disputes, payouts to pull back, unmatched payments, reported problems and possible no-shows, failing payouts, failed refunds, creator cancellations, nothing delivered after ten days, money waiting on payout setup, manual payouts still waiting, **creator applications**, and **user reports** (no screen today). Empty: *"Nothing is waiting on you."*
   - **Tap an item → a sheet** with who's involved, the dates, the amount, the client's note, links to the thread and to the payment in Stripe, then the two or three actions that settle it, each with its cost ("Release $86.00 to Maya", "Refund Jordan $114.00", "Put Maya on hold"). The confirmations and the log from PR 1 stay as they are.
2. **Bookings.** Search by name or date. Tap one → its **timeline**: requested → quoted → accepted → paid → delivered → window closed → paid out (or cancelled / refunded / disputed), each with its date and amount, built from the booking's own fields, so you can see at a glance where it is and why it's stuck.
3. **Creators.** Search. Each creator: status, rating and review count, open reports, on hold or not, payouts on or not. **Applications open side by side with the portfolio**, approve or reject in one tap (with the confirmation).
4. **Money.** Five numbers: *Held now* · *Due to release* (window closed, waiting on the sweep or setup) · *Paid out* · *Manual payouts owed* · **Fees earned**. Below: Pay a creator, One-off payment. And a reconcile line (see below).
   - **More** (in the rail / under a menu): Activity log, FAQ questions.

**Reconciling with Stripe.** The app's numbers come from the bookings. To check them against Stripe I'd add one admin-only function that reads Stripe's balance transactions for a date range and compares: charges vs. `amount_charged`, refunds vs. `refund_amount`, transfers vs. `creator_payout`, reversals vs. `reversal_amount_done`. Anything that doesn't match is listed, so you can see it, not guess. Read-only; nothing moves.

**Why:** today you have to know which of nine tabs a problem is in. This opens on the problems, lets you settle each in one place, and keeps the rest one tap away. The look stays Stelli's: dark, neon accents used sparingly, generous spacing, cards not spreadsheets.

---

## What I need from you

- **Go, or changes** on each of the five screens above.
- **D1 (album access)** is decided: anyone with the link, and the client can reset it. The album wording follows that.
- **Creator portal:** keep your new workspace as is, or fold in items 2, 3 and 5 above.
- Whether you want the **Money reconcile** function (it reads Stripe, read-only).
