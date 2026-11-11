# Stelli review — money, access, albums, admin

This is the review for PR 1 (`fable/money-and-access`). Sections 1–7 were written **before any fix**, from a full read of every backend function, shared module, entity file, workflow and the portal/thread/admin frontend, plus a read-only look at the live app's data and settings. Each finding's status line now says what happened to it. Sections 8–13 were written after the fixes.

**If you read one thing:** section 8 (what changed, in plain words), then section 10 (decisions only you can make), then section 11 (the checklist to run in Stripe test mode before merging).

Sections:

1. [What I could and could not check](#1-what-i-could-and-could-not-check)
2. [What the live data says](#2-what-the-live-data-says-read-only)
3. [State map of a booking (before the fixes)](#3-state-map-as-the-code-works-today)
4. [Verdicts on the six known issues](#4-verdicts-on-the-six-known-issues)
5. [New findings](#5-new-findings)
6. [Code vs. your spec](#6-where-the-code-and-your-spec-disagree)
7. [Things only you can check](#7-things-outside-the-repo-only-you-can-check)
8. [What changed, in plain words](#8-what-changed-in-plain-words)
9. [State map after the fixes](#9-state-map-after-the-fixes)
10. [Decisions for you](#10-decisions-for-you)
11. [Your Stripe test-mode checklist](#11-your-stripe-test-mode-checklist)
12. [What you still do by hand](#12-what-you-still-do-by-hand)
13. [Tests, and what is still untested](#13-tests-and-what-is-still-untested)

---

## 1. What I could and could not check

**Could:** read all the code; build and lint the frontend; read live records and app settings through the Base44 connection (read only — I changed nothing in the live app); and run the real backend function code in tests, against an in-memory stand-in for the Base44 database and for Stripe (section 13).

**Could not:** run the functions on Base44 itself, call Stripe (test or live), receive a real webhook, or click through the deployed app. So every fix is **tested against stand-ins, not against the real services**. The stand-ins are strict where it matters (idempotency keys, refund and reversal limits, conditional writes), but they are not Stripe. Section 11 is how you confirm the whole thing for real.

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

*Follow-up from your review (11 November):* the booking used to keep only one stray payment, so if two stale Checkout pages were both paid, the second overwrote the first and the first had no refund path. Each unmatched payment is now its own `StrayPayment` record, keyed by its Stripe PaymentIntent and readable by founders only. Each one is refunded, disputed or closed on its own, and the booking only carries a summary (how many are open, and the total). Tested in `tests/flow-stray-payments.test.mjs`.

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
**Status: Fixed after your OK (D5) — access by account ID only, emails and phones readable by founders only, the creator's legal name added to the agreement at payment, plus a one-time backfill (`migrateRecordOwners`).**

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

**H-14 · "Shadow-ban" doesn't hide anyone.** A creator cancellation sets `under_review`, which only shows a banner on the creator's own dashboard. They stay in browse, on the home page and bookable. `submitBookingRequest` accepts pending and rejected creators too. **Status: Fixed — in the app, and in the read rule after your OK (D6)**

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

**M-13 · Creator profiles expose more than they need to.** `Lensman` is public for approved creators and carries `stripe_account_id`, `payouts_enabled`, `under_review`, the owner's `user_id`, and `pricing_tiers` — named packages with prices. The site doesn't render them, but anyone can read them, which contradicts "no packages and no public prices anywhere." One approved profile created before the current signup path also carries its owner's email in the built-in `created_by` field. **Status: Fixed after your OK (D6) — payout, Stripe, hold and package fields readable by founders only; held creators unreadable**

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

---

## 8. What changed, in plain words

Everything below is on `fable/money-and-access`. Nothing is on `main`, and nothing in the live app was changed.

### Merged with what landed on `main` on 10–11 November

While this was open, `main` picked up seven builder commits: the new creator workspace (`/lensman-dashboard` with Requests, Bookings, Calendar, Earnings and Profile), album keys in the delivery emails, an "Email the album" button instead of an automatic email, budget and length on requests, profile views, and live profiles saving without a package. They're merged in and all kept. Where they met these fixes:

- The album email still waits for the creator to press send. It now also needs the shoot to be paid, goes at most once per 10 minutes, and doesn't hand the client's email address back to the creator.
- One album key per booking, even when two links are asked for at the same moment, so no email carries a dead link.
- Budget and length are capped and checked for phone numbers and emails, like the note.
- The new workspace finds quotes by account (emails are founder-only now), counts the old stuck bookings where they belong, and its "Needs your attention" list uses the same next-step rules as the rest of the app. Before, it missed agreements to accept and the unedited set. The on-hold and not-approved notices are back.

### Money

- **One price, worked out once.** The quote plus the add-ons the client picked is the subtotal. The client pays it plus 14%, the creator gets it minus 14%. Acceptance, Checkout, the stored fee and payout, and the agreement all come from the same calculation, done in whole cents. When the payment lands, the app checks that Stripe charged exactly that, and sends anything else to you. *(K1, M-2)*
- **An old checkout page can't confirm a booking.** A payment only counts if it came through the checkout page on record, for the quote the client accepted, at exactly the right amount. Anything else is real money, so it is kept apart as an "unmatched payment", the booking is not confirmed, and it lands in your queue with a button to send it back in full. Each unmatched payment is its own record with its own button, so two old pages paid on one booking are two refunds, and neither can be lost. A refund made by hand in Stripe, or a card dispute, closes or blocks only the payment it belongs to. *(K2, D3)*
- **A problem report always stops a payout.** The payout and the report now take turns on the booking: whichever starts second waits, then looks again. If the client reports a second after the creator was paid, the report still goes through and says so, so you're never told money is held when it isn't. *(K3)*
- **Refunds and pull-backs are separate steps.** The client's refund is recorded the moment it happens. Pulling the creator's payout back is its own step. If that fails (say they already withdrew it), the booking stays in your queue with a "try again" button, and retrying never refunds the client a second time. Refunds made straight in the Stripe dashboard are noticed too. *(K4)*
- **The agreement always matches what is paid.** A new accepted quote gets a new agreement; the old one is kept but marked replaced. Prices are itemised: shoot, each add-on, creator's price, Stelli's fee, total. Accepting an agreement can never move a booking backward again. *(K5)*
- **Cancellations follow your policy, in New York time.** 72 hours or more: full refund. 48 to 72: half back, creator gets half their payout. Under 48: creator is paid in full. Creator cancels: full refund. Once the shoot's start time has passed, "cancel" is closed; what's left is "report a problem", which freezes the money for you. A cancellation can't clear a freeze or a dispute. If the refund fails, the booking stays in your queue. *(C-1, C-2)*
- **Card disputes freeze the payout**, even against a founder's release. If the dispute is lost after the creator was paid, their payout is pulled back automatically. If it's won, the booking carries on. *(H-1, H-2)*
- **Stripe events arriving twice or out of order change nothing.** *(H-3)* Test-mode events can't touch live bookings. *(H-7)* You can rehearse in test mode without deleting the live key. *(H-12)*
- **Failed payouts show up.** If Stripe refuses a transfer three times, the booking goes to your queue and you're emailed. *(H-5)*
- **The admin "refund" says what happened** and only changes the booking when money moved. *(C-3)*

### The manual $50 path and the automatic path: how it's guaranteed they never both pay

You asked to see this, so here it is in full. When you pay a creator by hand, the admin page now asks, if that creator has a booking Stelli is holding money for: **is this payout for that booking, or separate money on top?**

- **For the booking:** the manual payout and the automatic payout use the same lock on that booking, so they can't run at the same moment. Whichever goes first marks the booking paid, with its Stripe transfer on it, and the other one sees "already paid" and stops. Both also send their transfer under the booking's own Stripe "transfer group", and each one asks Stripe whether that group already has a transfer before sending. So even if the app's own record were lost, Stripe's record stops a second payment. The creator receives what you paid them ($50), and the rest of the client's money stays with Stelli.
- **Separate:** it's sent as its own money, and the booking still pays out on its own.
- **No held booking:** it just pays.
- **A double click on "Pay"** sends one payout: each confirmation carries an ID, and the server recognises a repeat.

Tested: the two paths started against each other at 11 different timings, always exactly one transfer. *(H-9)*

### How a creator cancelling or not showing up is handled

- **Creator cancels** (before the shoot): the client is refunded in full, the booking goes to your queue, it's noted on the creator's private record, and you're emailed. You can put them on hold with one tap. They are **not** hidden automatically (decision D12).
- **Creator doesn't show:** the client taps "Report a problem", which now appears once the shoot time has passed, not only after delivery. That freezes the payment and puts it in your queue as "may be a no-show", with refund, release and **"Put on hold"**. On hold means hidden from browse, page hidden, no new requests, until you lift it; their other bookings carry on. *(H-14)* The reports function also has a "no-show" reason that holds the creator automatically; its button is part of PR 2.
- "On hold" used to be a banner only the creator could see. It now really hides them.

### Who can see and change what

- `/admin` was already protected on the server (section 5.1). It now also shows non-admins the ordinary "page not found", asks search engines not to index it, confirms every money action in a sentence with the amounts, and records every action in an **Activity** log (who, what, which booking or creator, amount, outcome). *(H-11)*
- Two-factor sign-in now works (it couldn't build before), and the login page handles the second step. Requiring it for admins is a Base44 setting (section 7). *(H-10)*
- Approving, rejecting and holding creators goes through the server and is logged. Approving from the admin page or from the Base44 dashboard both email the creator exactly once.
- Every function was checked for who may call it and in what state, and tested as the client, the creator, a stranger and a founder (section 13). The ones that were too loose are fixed: contact details (only once paid), legal-acceptance records (no forging), photo releases (the client approves specific photos; changing them needs a new yes), profile saves (every public field is checked and can't carry a phone, email, handle or link), reviews (one per completed booking, first name and initial only), reports (only about your own booking), account deletion (blocked while anything is still open). *(M-4, M-5, M-9, M-10, M-7, H-16)*
- After your OK (D5 and D6), the raw data no longer shows contact details early either: access matches on account IDs only, every email and phone field on shared records is readable by founders only, the agreement names the creator by their Stelli name until payment, and a creator's payout, Stripe, hold and package fields are founders-only.

### Albums

- Final delivery happens once. After it, the 48 hours can't restart and the creator can't add or remove photos. *(K6)*
- The client can **reset the album link**; the old link stops working for everyone. Founders can too.
- Album tokens are longer and compared safely; emails carry the working link.
- Albums open for anyone with the link (your decision, D1); the client can reset it.

### Accounts and portals (logic only — the layout is PR 2)

- The 18+ question is asked at signup (email and Google) and in the booking form, and enforced on the server before a first request. *(H-8)*
- Signed out on a private page: you're sent to log in and brought back. *(M-11)*
- Someone with a creator profile lands in the creator portal; each portal has a one-line way across for people who are both. *(M-12)*
- Each portal's "to do" list now shows the real next step: answer a quote, **pay**, **see your photos**; quote a request, accept the agreement, post the unedited set, deliver the final edits (only after the shoot). Nothing falls out of the lists. Status lines are written for the person reading them ("Booked. Your payment is held safely until your photos arrive."). *(H-15)*
- In the booking thread: cancel (with the outcome stated first), decline a quote, leave a review, release the payment early. The quote card shows the right total after add-ons. *(M-1, H-16)*

### Also

- The FAQ concierge says New York City and Elon, no longer promises invite-only albums, can't be steered by visitors or by creators' profile text, and its replies are checked before a visitor sees them. *(M-6)*
- Clients who pay from getstelli.com come back to getstelli.com, signed in. *(H-13)*

---

## 9. State map after the fixes

### 9.1 `Booking.status`

| Status | Set by | Who | Way out |
|---|---|---|---|
| `requested` | `submitBookingRequest`; `declineQuote` (only from `quoted`, unpaid) | client | quote → `quoted`; cancel |
| `quoted` | `sendQuote` (only open, unpaid bookings) | creator, admin | accept → `quote_accepted`; decline; cancel |
| `quote_accepted` | `acceptQuote` (only a live quote on an open, unpaid booking) | client | pay → `confirmed`; requote → `quoted`; cancel |
| `confirmed` | `markBookingPaid` **only** — a clean payment for the accepted quote | Stripe webhook | final delivery → `delivered`; cancel (until the shoot starts); report |
| `delivered` | `markDelivered` final step, **once** | creator, admin | payout → `completed`; report → your queue |
| `completed` | a payout | sweep, founder, client's early release | — |
| `cancelled` | `cancelBooking`; a full founder refund | either party; admin | — (a quote can't reopen it) |
| `pending`, `awaiting_creator_acceptance` | **nothing sets them any more** | — | Old records are read as `confirmed` (paid) or `quote_accepted`/`quoted` (unpaid). No data change. |
| `in_progress`, `awaiting_delivery`, `disputed` | never set | — | Defined but unused; kept so nothing breaks. Safe to remove later. |

### 9.2 `Booking.payment_status`

| Status | Set by | Notes |
|---|---|---|
| `pending` | request; a failed bank payment (only the one in progress) | |
| `processing` | bank payment started (only from `pending`, only for a clean session) | Not confirmed; no second checkout while clearing |
| `held` | `markBookingPaid` (clean payment only) | |
| `released` | a payout (automatic, founder, or a manual payout for this booking) | |
| `partially_refunded` | a partial refund | Creator's payout shrinks in step if not yet paid |
| `refunded` | a full refund, or a lost dispute | |

### 9.3 New fields that carry the state the old ones couldn't

| Field | What it means |
|---|---|
| `StrayPayment` records (`stray_payment_*` on the booking is their summary) | Money that arrived but doesn't belong to the booking as it stands. One record per Stripe payment: open → refunded, or disputed → open again / dispute lost. Your queue; one button per payment. |
| `reversal_status` (`needed` / `done` / `failed`) and amounts | Pulling a paid creator back, tracked apart from the client's refund. |
| `payout_lock` | Who is moving this booking's money right now. One at a time. Expires after 10 minutes if a run dies. |
| `payout_error`, `payout_attempts` | A transfer Stripe refused. Your queue after three. |
| `cancellation_payout_due` | A late client cancellation still owes the creator their share. The sweep pays it. |
| `stripe_livemode` | Test-mode payments are never paid out with real money. |
| `manual_payout_id` | You paid this booking's creator by hand. The automatic payout won't. |
| `BookingContract.status` / `quote_id` | Which accepted quote an agreement belongs to; older ones are marked replaced. |

All are optional; existing records work without them. Added after your decisions: `BookingContract.creator_user_id` (who may read an agreement) and `BookingContract.legal_names_added_at`.

### 9.4 Stuck states from section 3.4, now

1. **`awaiting_creator_acceptance`** — no longer set; old paid ones are read as confirmed and get their delivery controls back.
2. **Paid, never delivered** — appears in your queue ten days after the shoot date. The client can report a no-show once the shoot time has passed.
3. **`processing` forever** — out-of-order events can't cause it. A bank payment that never resolves still needs Stripe to send an event; if one is lost, it shows as "Payment clearing" and you'd see it in Stripe.
4. **Flagged forever** — a founder release clears the flag; a won dispute clears it when it was the only reason; "Mark as reviewed" for the rest (refused while money is still undecided).
5. **Late cancellation, creator without payouts** — the hourly sweep now pays it once they finish setup.
6. **Dead checkout page** — the next attempt opens a fresh one.

### 9.5 Moves that could happen twice, now

Final delivery, payout, manual payout, refund, pull-back, review, booking request, checkout session, contract, approval email: each is now once-only, by a lock, a conditional write, a Stripe idempotency key, a lookup for an existing record, or several of these. Each has a test.

---

## 10. Decisions for you

Each of these is a place where your policy and the code disagree, or where the policy doesn't cover a case. I did not decide them in code. One recommendation each.

**Decided (you answered on 11 November):** D1 yes — anyone with the link. D5 yes — done. D6 yes — done. D12 yes — keep as built. The rest are still open.

**D1 · Who can open an album: anyone with the link, or only invited emails?** — **Decided: anyone with the link.** No change needed; the album-after-refund question below is still open.
Today: anyone with the link. No screen collects invited emails (`album_access_emails` is never filled in), so "invited guests" don't exist yet.
**Recommendation: keep "anyone with the link"**, now that the client can reset a leaked link in one tap. Making guests sign in to see party photos adds friction most clients won't want. If you want invite-only later, it's a small change: guests sign in with an email on the list. The concierge now says only what's true either way; say which you want and I'll match its wording.
Related: **what happens to the album after a full refund?** Today it stays open. Your Terms (10.4) say copyright goes back to the creator after a full refund. Recommendation: close the album when a booking is fully refunded after delivery.

**D2 · Do the 14% fees apply to add-ons?**
Implemented as **yes**, on both sides, which matches your assumption and Terms 6.2. Nothing to do unless you want otherwise.

**D3 · What happens to money from an old or stale checkout that gets paid anyway?**
Implemented: it's kept apart as an "unmatched payment", the booking is **not** confirmed, you and the client are emailed, and your queue offers "Send $X back". **Recommendation: always send it back in full** and let the client pay the current quote. Don't try to apply it to the new price: different amounts and add-ons make that error-prone, and the Stripe receipt would be wrong.

**D4 · Three different delivery and complaint deadlines.**
The app gives 48 hours to report a problem; Terms 8.5 says "report visible issues within 7 calendar days". The agreement text sets the edited deadline at 10 business days; Terms 8.3 and your spec say 7 calendar days. **Recommendation:** change the agreement to 7 calendar days (a one-line change, I can do it on your OK), and have whoever drafted the Terms make 8.5 match the 48 hours. These are legal terms, so I left them alone.

**D5 · Contact details in the raw data before a booking is paid (C-4).** — **Decided: yes. Done** (see the note at the end of this item).
The app no longer *shows* contact details early, but the records each side can read still include the other side's login email from the moment a request is made, and the agreement (created when a quote is accepted, before payment) includes the creator's real name. Someone opening the browser's developer tools can see them. And because access matches on email, a new account made later with a deleted user's email address could read that user's old bookings and messages.
**Recommendation:** match access on account IDs only, and stop copying emails onto records the other side can read. Plan: (1) a migration fills `client_id` and `creator_id` on every Booking, Quote, Message, Contract and Photo release (most already have them); (2) change the read rules to IDs only; (3) clear the email fields on those records, keeping emails only on admin-only records; (4) write the creator's legal name into the agreement at payment, not at acceptance. This changes read rules and existing records, so it needs your OK. Time: about a day, then your checklist again.
*Done as:* read rules on Booking, Quote, Message, BookingContract, PhotoRelease and DeliveryPhoto match account IDs only; every email and phone field on them is readable by founders only (a field-level rule), rather than cleared, because the backend still needs them to send emails; the browser looks bookings up by ID; the agreement gets the legal name at payment; and `migrateRecordOwners` fills in the IDs older records are missing. **Run it right after merging** (checklist, "Right after you merge").

**D6 · What a public creator record exposes.** — **Decided: yes. Done.**
Anyone can read an approved creator's full record, including `stripe_account_id`, `payouts_enabled`, `under_review`, the owner's user ID and the **priced packages** from the profile wizard (your spec says no public prices). A creator on hold is hidden by the app, but their record can still be read by ID.
**Recommendation:** field-level read rules so those fields are visible only to the creator and admins, a read rule of "approved and not on hold", and either drop the price step from the wizard or keep packages private. Read-rule changes need your OK.
*Done as:* the creator read rule is "approved and not on hold, or your own, or a founder"; `stripe_account_id`, `payouts_enabled`, `payouts_onboarded_at`, `under_review` and `pricing_tiers` are readable by founders only, and so are the founders' notes on a creator's own contact record. The creator gets their own full record through a new function, `getMyCreatorProfile`, so their dashboard and the profile editor still work. The packages stay in the wizard but are private.

**D7 · New York.**
Every creator is saved with `market: 'ELON'`, the only value the field allows. **Recommendation:** add `NYC` as a value (existing records unaffected) and let creators pick in the wizard. It's a schema change, so I've asked first.

**D8 · Profile edits go live with no second look (M-15).**
An approved creator can change their name, photo and portfolio and it's public at once. **Recommendation:** leave it, now that profile text can't carry contact details. Add a re-review only if you see abuse.

**D9 · What account deletion erases.**
Deletion now refuses while anything is open. Once allowed, it removes the account, creator profile and private contact record, but past bookings, messages and agreements keep the person's name and email. **Recommendation:** replace name, email and phone on past records with "Deleted user", and keep agreements and payment records (you'll want them for tax and disputes). Your privacy policy should say how long those are kept.

**D10 · The old test-mode booking in the live data.**
One booking is "delivered, held, waiting on payout setup" from a test card. It can no longer be paid out (test payments are blocked). **Recommendation:** mark it cancelled in the Base44 dashboard. I didn't change live records.

**D11 · Outside services the site talks to.**
Your privacy page lists Stripe, Base44 and the email service. The site also loads **Google Fonts** (each visitor's browser contacts Google), a few fallback images from **Unsplash**, and Base44's own **analytics tracker** is switched on in `vite.config.js`. **Recommendation:** host the four fonts from Stelli's own files (no visible change), replace the Unsplash fallbacks with your own images, and decide whether Base44's analytics counts as "outside analytics" (it is your host, but your page says no analytics). Not changed here because it touches the public site.

**D12 · Should a creator who cancels be hidden automatically?** — **Decided: no, keep as built.**
Before this PR, a creator cancelling set a flag that only showed them a banner. That flag now really hides a creator, so I stopped setting it on cancellation: a creator cancelling goes to your queue with a one-tap "Put on hold". A no-show report still holds automatically. **Recommendation:** keep it this way, a cancellation two weeks out is often fine. If you want automatic holds for cancellations inside 72 hours, it's one line.

**D13 · A manual payout for a booking replaces the automatic one.**
If you pay a creator $50 by hand *for* a booking that came through checkout, they get the $50, not 86% of the booking, and the rest stays with Stelli. That matches "I pay some photographers a flat $50 per shoot", but please confirm it's what you want for bookings that came through checkout, not only ones you brought in yourself.

**D14 · Functions and secrets to delete.** `createBookingRequest` is an older copy of `submitBookingRequest` that nothing in the app calls, but it is deployed (as `createBookingRequest/entry`) and anyone signed in could call it directly, skipping the creator, age and contact-detail checks. I made it refuse every call rather than delete it. The secrets `PAYOUT_SWEEP_TOKEN`, `STRIPE_PUBLISHABLE_KEY` and `STRIPE_TEST_PUBLISHABLE_KEY` aren't read by any code. **Recommendation:** delete the function and the three secrets. You asked me not to delete functions without asking.

**D15 · Three low ratings.** Implemented as: the third rating of two stars or fewer files one report and emails you. It doesn't hold the creator automatically. Confirm that's what you meant.

---

## 11. Your Stripe test-mode checklist

Run this before you trust the money path with real clients. It takes about an hour. Nothing here moves real money.

### Before you start

1. **Stripe, test mode** (toggle top right). Under *Developers → Webhooks*, make sure there is an endpoint pointing at the same Stelli URL as your live one, sending these events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `charge.refunded`, `charge.dispute.created`, `charge.dispute.closed`, `transfer.reversed`. Add a second endpoint of type **Connect** with `account.updated`. Copy the signing secret into the Base44 secret `STRIPE_TEST_WEBHOOK_SECRET`.
2. **Base44 → Secrets:** add `STRIPE_MODE` with the value `test`. From that moment the whole live app uses your test keys. **Read this before you do it:**
   - A real client who tries to pay while it's set sees a Stripe *test* page and can't pay. Pick a quiet hour and keep it short.
   - Live Stripe events that arrive meanwhile are refused with a "try again later", and Stripe retries them for up to three days, so nothing real is lost once you switch back.
   - Because `main` is the live app, the only way to run this against the new code is to merge first. Set `STRIPE_MODE=test` **before** you merge PR 1, so no real money can move while you check it.
   - Want zero risk to real clients? Remix the app in Base44 and run the checklist on the copy instead (it gets its own database and URL; point a test webhook at it).
3. Make three test accounts with fresh emails (for example `you+client@…`, `you+creator@…`). Name anything you create "TEST" so it's easy to clean up.

### Right after you merge

4. **Run the one-time data fix.** On `/admin` → Activity, press **Check** on the "One-time data fix" card. It changes nothing and lists how many records it would fill in. Then press **Run it** and confirm. It's logged in the activity list. Until it has run, a few old records (two old requests, one message, three old quotes, every agreement) are invisible to their own client or creator. It's safe to run twice.
5. **Quick checks that the new read rules took:**
   - `/creators` still lists your approved creators. (If it's empty, the new creator read rule wasn't accepted by Base44: tell me at once, it's a one-line fallback.)
   - As the test creator, the dashboard shows the right payout state, and "Edit profile" opens with their packages filled in.
   - As the test client, your bookings and messages all appear.
   - In Base44 → Security, run a scan: it should report no exposed fields.

Test cards (any future expiry, any CVC, any ZIP):

| Card | What it does |
|---|---|
| `4242 4242 4242 4242` | Pays normally |
| `4000 0000 0000 0077` | Pays, and the money is available in your test balance at once (use this when you want payouts to go through straight away) |
| `4000 0000 0000 0259` | Pays, then the "customer" disputes it |
| `4000 0000 0000 9995` | Declined: insufficient funds |

### A. Accounts and the admin page

| Step | You should see |
|---|---|
| A1. Open `/admin` signed out, then as the test client. | "Nothing here." Same as `/admin-typo`. No redirect. |
| A2. Sign up as the test client. Try without ticking "I'm 18 or older". | You can't continue until both boxes are ticked. |
| A3. Sign up as the test creator, apply. In `/admin → Applications`, approve them. | A confirmation first. One "You're live" email. A line in the **Activity** tab. |
| A4. As the creator, set up payouts. Stripe's test onboarding accepts test details (in test mode it offers test values for the phone code, ID and bank). | Back on Stelli: "Payouts are on." (This also proves the creator's own payout fields still reach their dashboard.) |
| A4b. Put the test creator on hold from `/admin`, then open their page signed out. | "Creator not found", and they're gone from `/creators`. Lift the hold: they're back. |
| A5. Section 7, item 7: check that a normal account can't give itself the admin role. | It can't. |

### B. A normal booking, start to finish

| Step | You should see |
|---|---|
| B1. As the client, request the creator for a date about a week out. Try a note with a phone number first. | The phone number is refused. Then the request goes through; the creator gets one email. |
| B2. As the creator, open the thread and send a $100 quote with an add-on "Rush delivery" at $50. | The client's to-do list says "Maya sent a quote". |
| B3. As the client, tick Rush delivery. | Card total reads **$171**. |
| B4. Tap "Accept & pay $171". | Stripe Checkout shows three lines: $100, $50, **$21** service fee. |
| B5. Pay with `4000 0000 0000 0077`. | Back in the thread. Within a minute: "Booked. Your payment is held safely until your photos arrive." Stripe: a $171 payment. In Base44 data (Booking): `fee_amount` 21, `creator_payout` 129, `amount_charged` 171, `stripe_livemode` false. |
| B5b. Before paying (in B4), the client opens the agreement link under the pay button. | It names the creator by their Stelli name only, with a note that the legal name is added once paid. After B5 it shows the legal name. |
| B6. As the creator, open the agreement from the to-do list and accept it. | The booking **stays confirmed**. The agreement lists Shoot $100, Rush delivery $50, Creator's price $150, fee $21, total $171, creator receives $129. Both sides get a copy by email. |
| B6b. As the creator, upload three photos in the thread, then tap "Email Jordan the album". Tap it again. | Uploading sends nothing. The button sends one email whose link opens signed out; the second tap doesn't send another. |
| B7. As the creator, post the unedited set, then the final edits with a gallery link (try a link like `https://Users/me/x.html` first). | The fake link is refused. After final delivery, the delivery controls disappear and the album is locked. The client gets an email with an album link that opens signed out. |
| B8. Try to post final edits again. | Refused. The 48-hour clock doesn't restart. |
| B9. As the client, tap "Release the payment now" and confirm. | Stripe: a **$129** transfer to the creator's test account. App: "All done." The creator gets "You got paid." |
| B10. As the client, leave a 5-star review. Try again. | It appears on the creator's page as "Jordan L." (or your test name). A second review is refused. |

### C. A reported problem

| Step | You should see |
|---|---|
| C1. New booking, pay with `4242…`, deliver. As the client, "Report a problem". | Payment stays held. Your queue: "Jordan reported a problem", with release and refund. You're emailed. |
| C2. In Base44 → Workflows → Release Payouts, run it now. | No transfer in Stripe. |
| C3. In your queue, tap "Refund [client] $114.00". | A sentence with the amount first. Then Stripe shows a $114 refund, the booking reads cancelled and refunded, and the item leaves the queue. The Activity tab has a line. |
| C4. Double-click the refund button on another test booking. | One refund in Stripe. |

### D. Refund after the creator was paid

| Step | You should see |
|---|---|
| D1. New booking, pay with `4000 0000 0000 0077`, deliver, release early. Then refund the payment in full **in the Stripe dashboard**. | Your queue: "$129.00 still has to come back from Maya". |
| D2. Tap "Try again: pull $129.00 back". | Stripe shows a reversal on the transfer. The item leaves the queue. The client is not refunded twice. |

### E. Cancellations (the 72 and 48 hour lines)

Make three paid bookings: one about 4 days out, one about 60 hours out, one about 20 hours out (times are New York time).

| Step | You should see |
|---|---|
| E1. As the client, "Cancel this booking" on the 4-day one. | The dialog says you get $114 back in full. Confirm: a $114 refund in Stripe. |
| E2. Same on the 60-hour one. | It says you get $57 back and Maya keeps half. Confirm: a $57 refund and a **$43** transfer to the creator. |
| E3. Same on the 20-hour one. | It says there's no refund. Confirm: no refund, an **$86** transfer. |
| E4. A fourth booking: cancel it as the **creator**. | Client refunded in full. Your queue: "Maya cancelled on Jordan", with "Put on hold". The creator stays listed until you tap it. |
| E5. A paid booking whose date has passed (set a past date on a test booking in the Base44 dashboard). Try to cancel. | Refused, pointing to "Report a problem". The creator is not paid. |

### F. A card dispute

| Step | You should see |
|---|---|
| F1. New booking, pay with `4000 0000 0000 0259`, deliver. | Within a minute or two Stripe opens a dispute. Your queue: "Jordan disputed the charge". You're emailed. |
| F2. Try "Release" on it (from any path). | Refused: a dispute is open. |
| F3. In Stripe, respond to the dispute with the evidence text `losing_evidence`. | Dispute lost. The booking reads refunded. If the creator had been paid, their payout is pulled back. Repeat with `winning_evidence` on another: the freeze lifts and the booking pays out normally. |

### G. An old checkout page

| Step | You should see |
|---|---|
| G1. Client accepts a quote and opens Checkout but doesn't pay; copy the Checkout URL. Creator sends a new quote. Open the copied URL. | Stripe says the page has expired. |
| G2. (The case where Stripe can't expire it, including two old pages both paid on one booking, is covered by the automated tests.) | — |
| G3. In the Base44 dashboard → Data → StrayPayment, open its access rules. | Read, create, update and delete are all "admin" only. |

### H. Manual payouts

| Step | You should see |
|---|---|
| H1. `/admin → Pay creators`: pay the test creator $50 while they have a held booking. | You're asked: for that booking, or separate? Nothing is sent until you choose. |
| H2. Choose the booking, confirm. Then run Release Payouts. | One $50 transfer. The booking reads paid. The sweep sends nothing more. |
| H3. Double-click "Pay" on another payout. | One transfer. |

### I. The album

| Step | You should see |
|---|---|
| I1. Open the album link in a private window. | Photos and gallery link only: no price, no email, no status. |
| I2. As the client, "Reset this link". Open the old link. | "This link is missing its key". The new link works. |
| I3. As the creator, open `/lensman-dashboard`. | "Needs your attention" lists the agreement to accept and, once the shoot date has passed, the unedited set. Earnings shows the held $129. |

### When you're done

1. **Delete the `STRIPE_MODE` secret.** The app is back on live keys at once.
2. In Stripe (live), *Developers → Webhooks*: refused events from the test window should show as retried and succeeded.
3. Cancel the TEST bookings in the Base44 dashboard.
4. If anything above didn't match, tell me the step number and what you saw.

---

## 12. What you still do by hand

| Task | Where | Made quick by this PR? |
|---|---|---|
| Approve or reject creator applications | `/admin → Applications` | Yes: one tap and a confirmation; the email goes once; logged. (The Base44 dashboard still works too — both are real, and they can't double-email.) |
| Decide reported problems, no-shows, failed cancellation refunds | `/admin → Needs you` | Yes: each item has the two or three actions that settle it, with the amounts. |
| Respond to card disputes | **Stripe dashboard** (evidence lives there) | Partly: the app freezes the money, emails you and handles the outcome. The evidence is still yours to submit. |
| Send back unmatched payments | `/admin → Needs you` | Yes: one button per payment. |
| Retry a payout pull-back that failed | `/admin → Needs you` | Yes: one button. |
| Fix a payout Stripe keeps refusing | Usually the creator fixes their Stripe account; then "Release" | Yes: it's in the queue with Stripe's reason. |
| Manual $50 payouts | `/admin → Pay creators` | Yes, and it can no longer double-pay. |
| One-off charges | `/admin → One-off payments` | Unchanged, now logged. |
| Put a creator on hold, lift it | `/admin` creators list, or from a queue item | Yes: new. |
| Read user reports and low-rating reports | **Base44 dashboard → Data → Report** for now | No: there's no screen for them yet. It's in the PR 2 plan. |
| Check that the hourly sweep ran | **Base44 → Workflows** | No: a whole run failing isn't shown in the app. Individual payout failures are. |
| Clear the old test booking (D10) | Base44 dashboard | — |

---

## 13. Tests, and what is still untested

`npm test` runs 224 tests in under 20 seconds. Every one passes on this branch.

- **Pure rules:** money and rounding (`money.test.mjs`), cancellation tiers and New York time including daylight saving (`cancellation.test.mjs`), booking states and what each move needs (`bookingRules.test.mjs`), the portals' next steps and status lines and their agreement with the server (`bookingNextStep.test.mjs`), the founder queue (`founderQueue.test.mjs`), the contact guard (`contactGuard.test.mjs`).
- **Real function code, end to end:** `flow-*.test.mjs` load the actual backend functions and run them against an in-memory Base44 database and a fake Stripe (`tests/helpers`). Covered: the whole payment path, every known issue as a "how it happens" scenario, races (report vs payout at 41 timings, manual vs automatic payout at 11, refund vs sweep, double delivery, double reviews, double clicks), refunds and pull-backs, cancellations, disputes, contracts, albums, the concierge, and who may call each function.
- **Every function bundles** (`functions-build.test.mjs`), so a broken import fails here, not after a deploy.

**Not tested, because it needs the real services:**

- That Stripe's real responses look like the fake's in every field used (`amount_subtotal`, `latest_charge`, `amount_reversed`, dispute statuses). They follow Stripe's documented API; checklist sections B–F confirm them.
- That Base44 applies `updateMany` with a filter as one step per record. The booking lock depends on it, as MongoDB does. If Base44 did not, two payouts could in rare cases both claim the lock — and Stripe's idempotency key and the transfer-group check would still stop a second transfer. A fallback also stops payouts from stalling if Base44 doesn't treat a missing field as empty.
- That `asServiceRole.entities.User.update` can set `age_confirmed` (used once, for the 18+ answer on a first request).
- The new buttons in the thread and on the admin page were built and linted, not clicked in a browser: the app needs the real Base44 backend to load anything.
- Two-factor sign-in end to end (it depends on your Base44 login settings).
- How Base44 applies the new read rules: that the nested "approved and not on hold" creator rule is accepted; that a field-level rule hides a field without hiding the whole record; and that backend functions, which run with the service role, still see founder-only fields (payouts and emails depend on it). Steps 4–5 and A4 of the checklist confirm all three within minutes of merging.

### Also check in Base44 after merging

- **Functions list:** the old `submitReview/entry`, `fileReport/entry` and `declineQuote/entry` may still be listed alongside the new `submitReview`, `fileReport` and `declineQuote`. Delete the `…/entry` ones if they are.
- **Entities:** `AdminAuditLog` and `Report` should appear, both admin-only.
- **Login settings → two-factor:** if Base44 lets you require it for admins (or for everyone), turn it on. The app can't enforce it from code: a user record has no "has two-factor" field a function could check.

## 14. The older PR #1, closed as superseded

[calmo810/stelli#1](https://github.com/calmo810/stelli/pull/1) (branch `claude/cool-carson-x93bdg`) was an earlier pass at the same payment code. It's closed so it can't be merged next to this stack, and the branch is still there. What it had, and where each piece stands:

| In #1 | Here |
|---|---|
| Stripe calls retried automatically (network errors, rate limits, 5xx) with backoff | **Not carried over.** Here a failed call fails cleanly and is retried by the next sweep or the next button press, under the same idempotency key, so nothing is lost or doubled. Automatic retries inside a single call are a nice-to-have. |
| Test events can't touch live bookings | Covered (`sameStripeMode`, `stripe_livemode`). |
| Partial refunds, refund keys that allow a second partial refund, reversal failures flagged | Covered, with a per-booking lock and separate retryable pull-backs. |
| Refunds made by hand in the Stripe dashboard noticed | Covered (`syncRefundFromStripe`, and now per stray payment). |
| **Re-accepting a quote with different add-ons before paying** | **Different here.** Accepting the same quote again never changes the add-ons: the agreement is written for one accepted quote and one set of add-ons. To change them, the creator sends a new quote. If you want clients to re-pick add-ons themselves before paying, that's a small follow-up (a new agreement each time). Your call. |
| Reusing an open Checkout page, expiring stale ones | Covered. |
| Shoot times in New York time | Covered (`shootTime.ts`). |
| Cancelling expires an unpaid Checkout page | Covered. |
| `docs/STRIPE.md`, a Stripe setup guide | Not carried over. §7 and §11 cover setup and testing. |
| **A new homepage section, "Why we shoot" (`BornTo.jsx` with a typewriter effect)** | **Not on `main` and not here.** Closing #1 drops it. It's a public-site change, so it's outside this review. If you want it, it should be its own small PR. |
