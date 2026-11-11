# Stelli review — money, access, albums, admin

This is the audit for PR 1 (`fable/money-and-access`). It was written **before any fix**, from a full read of every backend function, shared module, entity file, workflow and the portal/thread/admin frontend, plus a read-only look at the live app's data and settings. Each finding has a status line that is updated as fixes land on this branch.

Sections:

1. [What I could and could not check](#1-what-i-could-and-could-not-check)
2. [What the live data says](#2-what-the-live-data-says-read-only)
3. [State map of a booking (as the code works today)](#3-state-map-as-the-code-works-today)
4. [Verdicts on the six known issues](#4-verdicts-on-the-six-known-issues)
5. [New findings](#5-new-findings)
6. [Code vs. your spec](#6-where-the-code-and-your-spec-disagree)
7. [Things only you can check](#7-things-outside-the-repo-only-you-can-check)

Sections added once the fixes are in: the state map after the fixes, which findings were fixed and which only flagged, your decisions list, and the Stripe test checklist.

---

## 1. What I could and could not check

**Could:** read all the code; run unit tests on pure logic (added in this PR); build and lint the frontend; read live records and app settings through the Base44 connection (read only — I changed nothing in the live app).

**Could not:** run the Deno backend functions, call Stripe (test or live), receive a webhook, or click through the deployed app. So every backend fix in this PR is **read and unit-tested where the logic is pure, not run end to end**. The test checklist at the end of this file is how you confirm them.

One thing shapes the whole review: **the deployed app runs on live Stripe keys.** `stripeKey()` in `base44/shared/stripe.ts` uses `STRIPE_SECRET_KEY` whenever it exists, and it does. There is no switch for test mode short of deleting the live key. See finding H-12 and the checklist notes.

---

## 2. What the live data says (read only)

Twelve bookings exist. No reviews. Seven creator profiles (three approved). Two admin accounts.

- **Add-on payout bug (known issue 1): no existing booking is affected.** No booking has any picked add-ons, so every stored `fee_amount` and `creator_payout` matches what was charged.
- **One real payment is held:** a $20 quote, $22.80 charged, $17.20 owed to the creator. Shoot date 4 November, not delivered yet. Two things about it:
  - The creator on it has not finished payout setup, so when it releases it will wait in `needs_payout_setup`.
  - The creator has not accepted the contract. If they do it today, the booking falls back to `awaiting_creator_acceptance` and loses its delivery controls (known issue 5). Fixed in this PR — please merge before anyone taps "Accept agreement" on that booking.
- **Known issue 5 has already happened twice** in test bookings: two unpaid bookings sit in `awaiting_creator_acceptance` with the creator accepted and the client flag false.
- **One test-mode booking is "delivered, held, waiting on payout setup"** ($35, paid with a test card back when the app used test keys). Its charge only exists in Stripe test mode. The hourly sweep retries it every hour and always will. It can't pay out real money, because the transfer is tied to a charge the live account doesn't have, but it should be closed by hand (see the decisions list).
- Its delivery link is `https://Users/…/Downloads/….html` — a file path that passed the "starts with https://" check. Not a real link (finding M-14).
- **Admins:** two accounts have `role = admin`. Both were created before launch. I did not print their emails here.
- **Workflows:** both are active. `Release Payouts` has run 1,153 times with no recorded failures. `Creator Status Emails` last ran today, so approving from the admin page or the Base44 dashboard both fire it (it triggers on the record, not on the screen you used).
- **Session recording is off.** Good — that matches the privacy promise.

---

## 3. State map (as the code works today)

### 3.1 `Booking.status`

| Status | Set by | Who can trigger it | Notes |
|---|---|---|---|
| `requested` | `submitBookingRequest` | any signed-in user | Also set by `declineQuote`. |
| `quoted` | `sendQuote` | the creator on the booking, or an admin | Blocked only when the booking is paid. **Not blocked for cancelled or completed bookings** (H-6). |
| `quote_accepted` | `acceptQuote` | the client, or an admin | Also set by the webhook when a bank payment fails. |
| `pending` | — | — | **Never set by any code.** |
| `awaiting_creator_acceptance` | `acceptBookingContract` | either party | A trap: see known issue 5. |
| `confirmed` | `markBookingPaid` (Stripe webhook), or `acceptBookingContract` | Stripe; either party | The contract path can confirm an **unpaid** booking if both flags are true. |
| `in_progress` | — | — | **Never set.** |
| `awaiting_delivery` | — | — | **Never set.** The client dashboard's "your photos are ready" item only looks at this status, so it never appears. |
| `delivered` | `markDelivered` (final step) | the creator, or an admin | No check on the current status or on payment. Can be called again and again. |
| `completed` | `releaseBooking` | sweep, founder, client (`confirmDelivery`), payout-setup catch-up | `completed_at` is never written. |
| `cancelled` | `cancelBooking`, `releasePayout` (refund) | either party; admin | |
| `disputed` | — | — | **Never set.** Disputes are tracked by `dispute_status` + `flagged_for_review`. |

### 3.2 `Booking.payment_status`

| Status | Set by | Trigger |
|---|---|---|
| `pending` | `submitBookingRequest`; webhook on `checkout.session.async_payment_failed` | — |
| `processing` | webhook on `checkout.session.completed` with `payment_status: unpaid` (bank debit) | **No state check** — can overwrite `held` (H-3). |
| `held` | `markBookingPaid` | `checkout.session.completed` (paid) or `async_payment_succeeded` |
| `released` | `releaseBooking` | transfer created |
| `partially_refunded` | `refundBooking`; webhook `charge.refunded` | 48–72 h cancellation |
| `refunded` | `refundBooking`; webhook `charge.refunded` | full refund |

### 3.3 The path, step by step

| Step | Function | Caller check | State check | Stripe / workflow |
|---|---|---|---|---|
| Request | `submitBookingRequest` | signed in | none: creator can be pending, rejected or under review; date can be in the past; you can book yourself | — |
| Quote | `sendQuote` | creator on booking or admin | not paid | Tries to expire the old Checkout session; ignores failure |
| Accept | `acceptQuote` | client or admin | quote is `sent`, not expired. **Booking status not checked** | Creates the contract (or reuses the old one) |
| Decline | `declineQuote` | client | quote is `sent` | Deployed under the name `declineQuote/entry`; nothing calls it |
| Pay | `createBookingCheckout` | client | not already paid. **Not checked: cancelled, quote expired** | Checkout Session |
| Paid | `stripeWebhook` → `markBookingPaid` | Stripe signature | same payment not already recorded | `checkout.session.completed`, `async_payment_succeeded` |
| Contract | `acceptBookingContract` | party (creator matched by `lensman_email` only) | none | — |
| Unedited set | `markDelivered` (`unedited`) | creator or admin | none | — |
| Final delivery | `markDelivered` (`final`) | creator or admin | none | Starts the 48 h window, opens the photo release |
| Report a problem | `reportBookingProblem` | client or admin | `payment_status = held` | Sets the flag |
| Release early | `confirmDelivery` | client | `status = delivered` | Transfer. Nothing calls it |
| Auto release | `releasePayouts` (hourly workflow) | admin (the workflow runs as one) | delivered, held, due, not flagged — **checked on a list read at the start** | Transfer |
| Founder decision | `releasePayout` | admin | none | Transfer or refund |
| Payout setup catch-up | `startPayoutSetup`, webhook `account.updated` | creator; Stripe | `needs_payout_setup` | Transfer |
| Cancel | `cancelBooking` | either party | not completed or cancelled | Refund and/or transfer |
| Refund seen | webhook `charge.refunded` | Stripe | — | — |
| Dispute | webhook `charge.dispute.created` / `.closed` | Stripe | — | Sets the flag |

### 3.4 Places a booking can get stuck

1. **`awaiting_creator_acceptance`.** Neither dashboard lists this status, the thread hides the delivery card for it, photo upload refuses it, and contact details lock again. A paid booking lands here the moment the creator accepts the contract (known issue 5).
2. **Paid, never delivered.** `confirmed` + `held` has no clock. If the creator never delivers, nothing happens and nothing tells you. This is also the only shape a no-show takes in the data today.
3. **`processing` forever.** If the "bank payment cleared" event is lost, or the "payment started" event is retried after it, the booking sits in `processing`: checkout refuses it and the sweep ignores it (H-3).
4. **Flagged forever.** A founder release pays the creator but never clears `flagged_for_review`, so the booking stays in the queue with live buttons (H-4). A dispute that closes in your favor leaves the flag on too, and there is no "clear" action.
5. **Cancelled late, creator has no payout account.** The creator's share waits in `needs_payout_setup`. The hourly sweep only looks at `delivered` bookings, so this one is only paid when the creator's own payout-setup check runs.
6. **`quote_accepted` with a dead Checkout session.** If a bank payment fails, the retry reuses the same Stripe idempotency key for 24 hours and gets the same finished session back (M-3).

### 3.5 Moves that can happen twice

- **Final delivery** — restarts the 48 h window each time (known issue 6).
- **Payout** — guarded by a status check on a stale copy plus a Stripe idempotency key; the report race is known issue 3.
- **Manual payout** — a double click on "Pay" creates two payouts, each with its own key (H-9).
- **Refund** — keyed by amount, then blocked for good by `refunded_at` (known issue 4).
- **Review** — the "already reviewed" flag is a field the Booking entity doesn't have, so it never sticks (M-9).

---

## 4. Verdicts on the six known issues

All six are real. Details and what I found beyond the earlier review:

### K1 — Add-ons charged but left out of the payout math · **Confirmed · Critical**
`markBookingPaid` (`shared/payouts.ts`) sets `fee_amount = serviceFee(quote.amount)` and `creator_payout = creatorPayout(quote.amount)`. `createBookingCheckout` charges `quote.amount + add-ons + 14%`.
*How it happens:* $100 quote, client ticks a $50 add-on, pays $171. The booking stores a $14 fee and an $86 payout. The creator is owed $129. Stelli keeps $85 instead of $42.
*Existing bookings:* none affected (section 2).
*Fix:* one subtotal function in integer cents, used by acceptance, checkout, the webhook and the contract; the webhook compares it with what Stripe charged and sends any mismatch to review.
**Status: Fixed — `shared/money.ts`; checked against what Stripe charged in `shared/payments.ts`.**

### K2 — An old checkout can become the booking's payment · **Confirmed · Critical**
`sendQuote` supersedes the old quote, tries to expire its session, swallows a failure, and sets `quote_id: ''`. `markBookingPaid` computes `replacedQuote = Boolean(booking.quote_id) && …`, so a blank `quote_id` is "not replaced". It then marks the superseded quote `accepted` and confirms the booking at the old price.
*How it happens:* creator quotes $300, client opens Checkout and leaves the tab open; creator replaces it with $200; the expire call fails; client pays the old tab. The booking is confirmed at $300 with the $200 quote still showing "Accept & pay".
*Also:* `createBookingCheckout` doesn't refuse a cancelled booking or an expired quote, and the session can outlive the quote.
*Fix:* the webhook only accepts a paid session when it is the session on record **and** its quote is the booking's current accepted quote **and** the amount matches; anything else is held and flagged. Checkout requires a live accepted quote and an open booking, and the session expires with the quote.
**Status: Fixed — `bookingRules.paidSessionVerdict`, `shared/payments.ts`, `createBookingCheckout`, `sendQuote`, `acceptQuote`. A payment that doesn’t match is held apart as a “stray payment” for you.**

### K3 — A problem report can lose a race with a payout · **Confirmed · Critical**
`releaseBooking` trusts the booking object it is handed. The sweep hands it rows from a list read before the loop; `confirmDelivery` hands it a copy read before its own write.
*How it happens:* the sweep reads the list at 3:00:00. The client reports a problem at 3:00:01. The sweep reaches that booking at 3:00:02 with `flagged_for_review: false` in its copy, and pays.
*Also:* the transfer already has an idempotency key (`payout-<bookingId>`), so two payout attempts can't both pay. The gap is report-versus-payout, not payout-versus-payout.
*Fix:* one lock field on the booking that the payout and the report both have to claim with a conditional write; whoever loses stops. The payout re-reads the booking after it holds the lock.
**Status: Fixed — `shared/bookingLock.ts`, `shared/payouts.ts`, `reportBookingProblem`. Tested at 41 interleavings.**

### K4 — A refund can be marked done before the reversal is secured · **Confirmed · Critical**
`refundBooking` refunds, then reverses the transfer, then saves. If the reversal throws, nothing is saved, the webhook's `charge.refunded` writes `refunded_at`, and the next attempt returns `already-refunded` at the first line.
*How it happens:* creator was paid $86, has since withdrawn it. Founder refunds the client $114. Stripe refunds; the reversal fails for lack of funds on the creator's balance. The booking now reads "refunded". Stelli is out $86 and there is no retry.
*Also:* `refunded_at` blocks **any** second refund, including refunding the other half after a 50% cancellation.
*Fix:* refund and reversal are tracked separately (new optional fields), each retryable, each with its own idempotency key; an unfinished reversal is a founder-queue item with a retry action.
**Status: Fixed — `shared/refunds.ts`, `shared/disputes.ts`, `releasePayout` (new `retry_reversal`).**

### K5 — The contract can fall out of sync with the payment · **Confirmed · High** (three parts)
1. `createContractForBooking` returns `existing[0]` whatever quote it was written for.
2. `acceptQuote` passes `amount: subtotal` and the add-ons, and the text prints "Agreed amount: $150 / Add-ons: Rush (+$50) / Total: $150" — it reads as if the add-on is on top.
3. `acceptQuote` stamps the contract's `client_accepted_at` but never sets `Booking.client_contract_accepted`. `acceptBookingContract` then computes `nextStatus = 'awaiting_creator_acceptance'` and writes it over a confirmed, paid booking.

*Also found:*
- `acceptBookingContract` writes `status` with no look at the current state. It can un-cancel a cancelled booking and, once the flag bug is fixed, would confirm an **unpaid** booking (which unlocks contact details).
- The client never sees the contract before paying. "Accept & pay" accepts it silently, and no `AgreementAcceptance` record is written for the client.
- The contract's `creator_email` is the creator's typed contact email, and the contract's read rule matches on that field. A creator whose contact email differs from their login email can't open their own contract; whoever owns the typed address can.
- The contract email links to `/agreements/<id>` with no domain.

*Fix:* one contract per accepted quote (the old one is kept, marked superseded); base price, each add-on and total on separate lines; acceptance sets the booking flag; contract acceptance never changes `status`.
**Status: Fixed — `shared/bookingContract.ts`, `acceptQuote`, `acceptBookingContract`, `sendQuote`. Paid bookings already stuck in `awaiting_creator_acceptance` are read as confirmed, with no data change.**

### K6 — Albums can change after delivery; links can't be reset · **Confirmed · High**
- `getAlbumBooking`: anyone with the token gets in; `album_access_emails` is never read. No reset.
- `deliveryPhotos`: `remove` has no state check; `add` is allowed after final delivery too.
- `markDelivered`: no state check at all; calling `final` again rewrites `delivered_at` and `release_due_at`.

*Also found:*
- The token is a random UUID (122 bits) — not guessable. It is compared with `===`, which is not constant time; fixed, though over the network this was never practical to exploit.
- A missing booking and a wrong token do answer the same way. Good.
- The "new photos" email links to `/album/<id>` with no token, so it only works for someone already signed in.
- `markDelivered` can be called on an unpaid or cancelled booking, and on a completed one (which drags it back to `delivered`).
- The album stays open after a refund or cancellation. Decision for you.
- Nothing in the app writes `album_access_emails` or `co_bookers`. The only function that did is an old one nobody calls. So "invited guests" don't exist yet.

*Fix:* delivered albums are locked (no removals, no re-delivery, window never restarts); a "reset album link" action for the client and for founders; constant-time compare; who may open the album goes on your decisions list.
**Status: Fixed — `markDelivered`, `deliveryPhotos`, `getAlbumBooking`, new `resetAlbumLink`. Who may open an album is decision D1.**

---

## 5. New findings

Severity: **Critical** = money lost, wrong person paid, private data exposed. **High** = stuck bookings, broken core flow, a security control that isn't one. Then Medium, Low.

### Critical

**C-1 · A late "cancel" by the client pays the creator in full, at once — even after a no-show, even during a dispute.**
`cancelBooking`. Under 48 hours the client gets nothing and `releaseBooking` runs immediately. There is no upper bound: the shoot date can be days past. And the function first writes `flagged_for_review: false` for a client cancellation, which wipes a problem report or a card-dispute flag.
*How it happens:* the creator doesn't show. The client opens the booking the next day and cancels. Result: no refund, and the creator is paid 100% on the spot. Or: a client disputes the charge with their bank, then cancels — the dispute freeze is cleared and the creator is paid while the bank takes the money back.
*Not reachable from the UI today* (no cancel button exists), but the function is live and callable.
*Fix:* cancellation closes at the shoot's start time — after that it's "report a problem", which freezes the money for a founder. Cancelling never clears a flag, and a flagged or disputed booking moves no money.
**Status: Fixed — `shared/cancellation.ts`, `cancelBooking`.**

**C-2 · Cancellation tiers are measured in the wrong time zone.**
`cancelBooking` builds the shoot time with `new Date('<date>T<time>')`, which the server reads as UTC. Your Terms say America/New_York. The server thinks every shoot is 4–5 hours earlier than it is.
*How it happens:* shoot Saturday 3 pm in New York. Client cancels Wednesday 1 pm — 74 hours ahead, a full refund under your policy. The server computes 69–70 hours and refunds half.
*Also:* with no time set, noon is assumed. If the date or time doesn't parse, the math gives `NaN`, every comparison is false, and the code falls to "creator keeps everything".
*Fix:* a pure, tested function that works in America/New_York (daylight saving included); a shoot time that can't be read goes to a founder instead of guessing.
**Status: Fixed — `shared/shootTime.ts`.**

**C-3 · A "refund" from the admin page can cancel the booking without refunding anyone.**
`releasePayout` calls `refundBooking`, ignores the answer, then always writes `status: 'cancelled'`, `cancelled_by: 'creator'`.
*How it happens:* the booking was half-refunded by a 48–72 h cancellation and you tap "Refund the client" to return the rest. `refundBooking` answers `already-refunded`. The booking is now cancelled "by the creator", the client got nothing more, and the screen shows no error.
*Fix:* the function reports what actually happened and only changes state when money moved.
**Status: Fixed — `releasePayout`.**

**C-4 · Contact details are readable before confirmation — by the other party, straight from the data.**
The read rules on `Booking`, `Quote`, `Message` and `BookingContract` hand each party the whole record. That includes the creator's login email (`creator_email`, `lensman_email`) from the moment a request is filed, the creator's real name and contact email on the contract (created at quote acceptance, before payment), and the client's email and phone for the creator. The UI doesn't show them; the browser's network tab does.
*This breaks "phone and email stay hidden until the booking is confirmed."* It can't be fixed without changing schemas or read rules, which needs your OK — see the decisions list for the plan.
**Status: Flagged — needs your decision (D5).**

### High

**H-1 · The admin page's "release" ignores open disputes.** `releasePayout` forces `flagged_for_review: false` on its copy and pays. Nothing stops a release while a chargeback is open, or after one is lost (the booking still says `held`). **Status: Fixed**

**H-2 · Nothing happens when a dispute is lost, and the creator is never pulled back.** `charge.dispute.closed` only stores the status. Your spec says a paid-out creator should be pulled back where possible. **Status: Fixed**

**H-3 · Webhook events arriving out of order can corrupt a paid booking.** `checkout.session.completed` (unpaid) writes `processing` and `async_payment_failed` writes `pending` + `quote_accepted`, both with no look at the current state or which session the event is about. A retried old "failed" event after a successful re-payment reopens checkout on a paid booking — the client can be charged twice. **Status: Fixed**

**H-4 · A founder release leaves the booking flagged.** Covered in 3.4. The queue fills with finished items; a real one gets lost among them. **Status: Fixed**

**H-5 · Failed payouts are invisible.** A transfer that Stripe rejects (restricted account, bad destination) throws, is caught, logged to the console and retried every hour forever. Nothing reaches the admin page. **Status: Fixed**

**H-6 · A quote can bring a dead booking back to life.** `sendQuote` writes `status: 'quoted'` on any unpaid booking, including cancelled and refunded ones. `acceptQuote` then accepts it. A booking cancelled and refunded can be re-quoted and paid again while still carrying `refunded_at`, which then blocks any future refund. **Status: Fixed**

**H-7 · Test-mode events can act on the live app.** The webhook accepts events signed by the live secret **or** the test secret. A test-mode `checkout.session.completed` naming a real booking marks it paid and confirmed with no real money. Only someone with access to your Stripe account can send one — so this is about accidents, not attackers — but the old test bookings in the live database show how easily the two mix. **Status: Fixed**

**H-8 · The age gate is skipped by almost everyone.** The 18+ box lives on `/onboarding`, which only shows when an account has no type. `Register` sets the type itself, and the booking form creates accounts with no gate at all. `applyAsCreator` writes `age_confirmed: true` without asking. **Status: Fixed**

**H-9 · The manual path and the automatic path can both pay the same shoot.** `ManualPayout` has no link to a booking. Nothing connects "I paid Maya $50 by hand for Saturday" with a held booking for the same shoot that the sweep will also pay. And a double click on "Pay" sends two payouts. **Status: Fixed**

**H-10 · Two-factor sign-in isn't wired up.** The MFA screens exist (`pages/Mfa.jsx`, `MfaFlow`) but there is no `/mfa` route, and `Login.jsx` signs in with a call that doesn't handle a second step. An account with MFA on can't complete sign-in through the app's own login page. So today the admin accounts can't safely turn MFA on. **Status: Fixed in the app; requiring MFA for admins has to be switched on in Base44 (section 7)**

**H-11 · `/admin` is protected on the server, but has no confirmation, no log and no MFA.** The good news first: every admin read goes through an entity whose rules allow admins only, and every admin action is either an admin-only entity write or a function that checks `role === 'admin'` on the server (table in 5.1). The gaps: "Release" and "Refund" move money on a single tap; nothing records who did what; non-admins are redirected home rather than shown the not-found page. **Status: Fixed**

**H-12 · There is no safe way to test payments.** Live keys win whenever they exist. To run a test checkout today you would have to delete the live key from a live app. **Status: Fixed — set the secret `STRIPE_MODE` to `test` to rehearse (read the checklist first)**

**H-13 · After paying, clients can land on the wrong domain, signed out.** `safeOrigin` only accepts `*.base44.app`, so a client paying from `getstelli.com` is sent back to `getstelli.base44.app`, where they have no session and see "This conversation isn't yours." The same rule accepts **any** Base44 app's subdomain as a return address. Emails mix the two domains as well. **Status: Fixed**

**H-14 · "Shadow-ban" doesn't hide anyone.** A creator cancellation sets `under_review`, which only shows a banner on the creator's own dashboard. They stay in browse, on the home page and bookable. `submitBookingRequest` accepts pending and rejected creators too. **Status: Fixed in the app; tightening the read rule is decision D6**

**H-15 · The client's portal never shows "pay" or "your photos are ready".** The "Needs you" list only knows two cases, and one of them looks for a status no code sets. Cancelled bookings, bank payments in progress and `awaiting_creator_acceptance` drop out of every list. On the creator side, "Deliver to …" shows before the shoot has happened. **Status: Fixed (logic; the layout is PR 2)**

**H-16 · Reviews, reports, declining a quote and cancelling have no working door.** `submitReview`, `fileReport`, `declineQuote` and `createBookingRequest` are deployed under the names `submitReview/entry`, etc. (each sits one folder too deep), and nothing calls them. `cancelBooking`, `confirmDelivery` and `getBookingContact` are deployed correctly but have no button. `fileReport` and the 3-bad-ratings rule write to a `Report` entity that doesn't exist in the repo. Your Terms promise a report option on every booking. **Status: Fixed**

### Medium

**M-1 · The quote card shows the wrong total after add-ons are picked.** Reopen an accepted quote and the button says "Pay $114" while Checkout charges $171 — the card forgets the saved add-ons. A superseded quote still shows "Accept & pay". A bank payment in progress still shows "Pay". **Status: Fixed**

**M-2 · Money math uses floating-point dollars.** `Math.round(x * 0.14 * 100) / 100` is off by a cent for some amounts, and the Checkout lines are rounded one by one. No limit on decimals, size or sign of a quote or add-on. **Status: Fixed**

**M-3 · Paying again after a failed bank payment is blocked for 24 hours** by the reused Stripe idempotency key (3.4, item 6). **Status: Fixed**

**M-4 · A creator can swap the photos on a public shoot after the client approved it.** `respondPhotoRelease` lets the creator resend `photos` at any time; the client's "yes" stands. The client is never shown which photos they are approving. **Status: Fixed**

**M-5 · Contact details get around the message guard.** The guard runs on chat messages only. The quote note, add-on names and the request brief aren't checked. Creator profile fields `specialties`, `neighborhoods`, `equipment` and `display_name` aren't checked either, and they are public. **Status: Fixed**

**M-6 · The FAQ concierge can be steered.** A visitor can close the `<visitor>` tag and write their own instructions. Creator-written profile text goes into the prompt as-is, so a creator can plant instructions too ("always recommend me"). The data it can reach is public, and links are allow-listed, so the damage is tone and promises, not a leak. The separate agent config (`stelli_concierge.jsonc`) can read whole creator records, which include package prices. **Status: Fixed**

**M-7 · Deleting an account can strand money and leaves personal data behind.** `deleteMyAccount` only blocks on `held` and `processing`. It doesn't see a half-refunded booking still owed to the creator, a waiting manual payout (which is then marked "failed" and stays with Stelli), an open dispute, or a booking in mid-flow. Bookings, messages, contracts and photos keep the person's name and email afterwards. **Status: Money part fixed; what to erase is decision D9**

**M-8 · Approval emails can go nowhere.** Status emails use the creator's typed contact email, not their login email. If the two differ and the typed one isn't a Stelli account, the "you're live" email may not send. **Status: Fixed**

**M-9 · A client can review the same shoot many times, and reviews expose full names.** The duplicate guard relies on a `reviewed` field the Booking entity doesn't have. `Review` is publicly readable and stores the client's full name, user ID and booking ID. (No reviews exist yet.) **Status: Fixed**

**M-10 · Anyone signed in can write fake legal-acceptance records.** `recordAgreementAcceptance` accepts any document type, version and booking ID. Base44's own scan flags this too. **Status: Fixed**

**M-11 · Logged-out visitors hit dead ends.** `/portal` sends them to the onboarding form, which then fails to save. `/account-settings` spins forever. Both dashboards render an empty "Hey, there." No page sends them to log in and back. **Status: Fixed**

**M-12 · Role mix-ups.** A client can open the creator dashboard and the reverse (empty, but confusing). A client who applies as a creator is still routed to the client portal. `/onboarding` lets an existing account overwrite its type. The welcome prompt says "curator". **Status: Fixed**

**M-13 · Creator profiles expose more than they need to.** `Lensman` is public for approved creators and carries `stripe_account_id`, `payouts_enabled`, `under_review`, the owner's `user_id`, and `pricing_tiers` — named packages with prices. The site doesn't render them, but anyone can read them, which contradicts "no packages and no public prices anywhere." One approved profile created before the current signup path also carries its owner's email in the built-in `created_by` field. **Status: Flagged — decision D6**

**M-14 · Delivery links aren't checked for being links.** Anything starting with `https://` passes, including `https://Users/…`. **Status: Fixed**

**M-15 · Profile edits go live with no second look.** An approved creator can change their name, bio and whole portfolio and it publishes at once. **Status: Flagged — decision D8**

**M-16 · Booking yourself.** A creator can request, quote, pay and deliver their own booking, then leave themselves a review. **Status: Fixed**

### Low

- **L-1** `shareProfile` returns the name, one-liner and cover photo of pending and rejected profiles to anyone with the ID. **fixed**
- **L-2** Every function returns raw `error.message` on failure, which can include Stripe's wording. **fixed**
- **L-3** `index.html` links a `/manifest.json` that doesn't exist. **fixed**
- **L-4** `releaseBooking` never writes `completed_at`; `completed_shoots` on the profile is never counted. **fixed**
- **L-5** `applyAsCreator` scans the first 500 contacts for duplicates. Fine today. **flagged**
- **L-6** Signed photo links last one hour; an album left open longer shows broken images until reloaded. **flagged**
- **L-7** The quote form's placeholder uses a phrase from your don't-use list. **fixed**
- **L-8** `PAYOUT_SWEEP_TOKEN`, `STRIPE_PUBLISHABLE_KEY` and `STRIPE_TEST_PUBLISHABLE_KEY` are stored secrets no code reads. **flagged — delete them in Base44 if unused**
- **L-9** One-off charges aren't updated on refund or dispute. **flagged**
- **L-10** The not-found page is Base44's stock light page, with an "Admin Note" box for admins. **fixed**

### 5.1 Is `/admin` really locked? (server side)

| What the admin page does | How it reaches the server | Server check |
|---|---|---|
| List creators (all statuses) | `Lensman.list` | Read rule: approved, own, or admin ✔ |
| List creator contacts | `CreatorContact.list` | Read rule: own or admin ✔ |
| List bookings | `Booking.list` | Read rule: party or admin ✔ |
| Manual payouts, one-off charges, FAQ log | entity lists | Read rule: admin only (manual payouts: admin or the paid creator) ✔ |
| Approve / reject | `Lensman.update` from the browser | Update rule: admin only ✔ |
| Release / refund | `releasePayout` | `role === 'admin'` ✔ |
| Manual payout | `payCreator` | `role === 'admin'` ✔ |
| One-off charge | `createOneOffCharge` | `role === 'admin'` ✔ |
| Hourly sweep | `releasePayouts` | `role === 'admin'` ✔ |
| Data migration | `migrateCreatorData` | `role === 'admin'` ✔ |
| Status emails | `notifyCreatorStatus` | `role === 'admin'` ✔ |
| Shadow-ban | — | **No action exists** |
| FAQ edits | — | The FAQ tab is a read-only log |

**Who is an admin, and how do you become one.** Two accounts. The role is set in the Base44 dashboard (Users), or by the app's owner/collaborators. Base44's documentation says changing `role` through `updateMe` needs editor access on the app, so a normal user can't promote themselves. I could not test that without writing to a live account — it's a 30-second check for you (section 7). The profile wizard and `updateCreatorProfile` build their writes from a fixed list of fields, and neither `role` nor `status` is on it.

**Secrets in the browser.** None. No Stripe key, publishable or secret, appears anywhere in `src/`. Stripe is only called from backend functions.

---

## 6. Where the code and your spec disagree

| # | Your spec | The code / Terms | Which I think is right |
|---|---|---|---|
| 1 | No in-app photo dashboard; delivery is a pasted gallery link | Creators can upload up to 120 photos straight into the booking (`DeliveryPhoto`, private storage, signed links). The link is now optional. | The code is newer than the spec and the Terms describe uploads. Keep it; update the spec. |
| 2 | Final edits within a week | Contract text sets the edited deadline at **10 business days**. Terms §8.3 say 7 calendar days. | Spec and Terms agree. The contract builder is wrong. Left as is pending your OK, since it changes a contract term. |
| 3 | 48-hour problem window | App: 48 hours. Terms §8.5: "report visible issues within 7 calendar days". | Your call; they should say the same thing. |
| 4 | No packages, no public prices | Wizard collects three priced packages; they are publicly readable (M-13). Terms §5 describe named, priced formats. | Spec. |
| 5 | NYC and Elon | Every creator is saved with `market: 'ELON'`, the only value the field allows. The concierge says Elon only. | Spec. Needs an enum change (your OK). |
| 6 | Album opens for the client and invited guests | Anyone with the link; no invites exist. | Your decision. |
| 7 | A no-show puts the creator under review and shadow-bans them | No no-show path exists. Creator *cancellation* sets `under_review`, which hides nothing. | Spec. |
| 8 | No outside analytics or trackers | `vite.config.js` turns on Base44's `analyticsTracker`. Fonts load from Google Fonts. A few placeholder images load from Unsplash. | Flagged. Base44 is one of your named providers; Google and Unsplash are not. |
| 9 | AI only for the FAQ concierge | Correct. `askStelli` is the only AI call. It sends the visitor's question to Base44's LLM integration. | Fine, but worth a line in the privacy policy. |
| 10 | Dispute: pull the payout back where possible | Not implemented (H-2). | Spec. |

---

## 7. Things outside the repo only you can check

**Stripe dashboard**
1. **Webhooks → your endpoint → events.** It must send: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `charge.refunded`, `charge.dispute.created`, `charge.dispute.closed`, `transfer.reversed`. Check both the live and the test endpoint.
2. **`account.updated` for creators.** Connected-account events only go to an endpoint of type **Connect** (or an event destination, for Accounts v2). If you only have a platform ("Your account") endpoint, `account.updated` never arrives and creators are only marked payout-ready when they revisit their dashboard. Tell me what you see and I'll adjust.
3. **Signing secrets.** Three are stored (`STRIPE_LIVE_WEBHOOK_SECRET`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_TEST_WEBHOOK_SECRET`). Confirm each matches a real endpoint; delete any that doesn't.
4. **Connect settings.** Payout schedule for connected accounts, and that the platform is liable for negative balances (the code creates accounts with `losses_collector: application`).
5. **Stripe Tax.** Checkout doesn't turn on automatic tax, so no tax is collected today. If tax should apply, that's a setting plus one line of code.
6. **The old test booking** in section 2 — look up its charge in test mode and decide whether to close it.

**Base44**
7. **Can a user make themselves admin?** Sign in as a throwaway non-admin account, open the browser console on the site and run the app's `updateMe` with `{ role: 'admin' }`. It should fail. If it succeeds, tell me immediately (and demote the account).
8. **Login settings → two-factor.** Whether MFA can be required per role or only for everyone.
9. **Secrets.** `PAYOUT_SWEEP_TOKEN` and the two publishable keys are unused (L-8).
10. **Security → "hide created-by email".** One public creator profile carries its owner's email in `created_by` (M-13).
11. **Workflows.** Both show active. The payout sweep averages about a minute per run, which is slow for what it does — worth a glance at its logs.
12. **Custom domain.** Confirm `getstelli.com` and `www.getstelli.com` both point at the app (H-13 assumes so).
