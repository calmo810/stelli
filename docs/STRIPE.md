# Stripe setup

How payments work in Stelli, and everything that has to be configured in
Stripe and Base44 for them to run.

## How the money moves

```
client pays (Checkout)          creator delivers         48h window closes
quote + add-ons + 14% fee  ──▶  final gallery link  ──▶  or client confirms
        │                                                      │
        ▼                                                      ▼
held on Stelli's balance  ─────────────────────────▶  Transfer to creator's
payment_status = held                                 Express account (86%)
```

- **Separate charges and transfers.** Clients pay Stelli's own account through
  Stripe Checkout (`createBookingCheckout`). The creator is paid later by a
  Transfer to their Connect **Express** account (`shared/payouts.ts →
  releaseBooking`), tied to the original charge with `source_transaction` and
  a shared `transfer_group` of `booking_<id>`.
- **Stelli's cut** is `SERVICE_FEE_RATE` (14%) from each side: the client pays
  price × 1.14 and the creator receives price × 0.86. The same rate is mirrored
  for display in `src/lib/threadPricing.js`, so change both together.
- **Hold and release.** `markDelivered` starts a 48-hour window. The hourly
  **Release Payouts** workflow (`releasePayouts`) pays out due bookings unless a
  problem was reported or the booking is flagged. `confirmDelivery` lets the
  client release it early.
- **Founder queue.** Anything unusual sets `flagged_for_review`: a reported
  problem, a card dispute, a creator cancelling, a payment for a replaced
  quote, a failed transfer reversal, or a refund made by hand in the Stripe
  Dashboard. Nothing flagged moves until a founder releases or refunds it from
  the admin dashboard (`releasePayout`).
- **No payout account yet.** The money stays held and `needs_payout_setup` is set.
  It goes out automatically when the creator finishes onboarding (the
  `account.updated` webhook, or the dashboard's status check).

Every write to Stripe that could be repeated (checkout, transfer, refund,
reversal) carries an idempotency key. So a retried request, a duplicate
webhook, or a double click can never charge, pay, or refund twice. Those
requests are also retried automatically on network errors, rate limits,
and Stripe 5xx errors.

## 1. Stripe account

1. In the Stripe Dashboard, **enable Connect** and choose the **Platform** model.
   Creators get **Express** accounts in the US with only the `transfers`
   capability.
2. Under **Connect → Settings → Branding**, set Stelli's name, icon and colour,
   because creators see these during onboarding.
3. Under **Settings → Payment methods**, turn on what Checkout should offer.
   Delayed methods such as ACH bank debits are already handled: the booking
   shows as `processing` until the money clears.

## 2. Secrets (Base44 → Settings → Secrets)

| Secret | Value |
| --- | --- |
| `STRIPE_TEST_SECRET_KEY` | `sk_test_…` (or a restricted `rk_test_…` key). **While this is set, the app runs in test mode.** |
| `STRIPE_SECRET_KEY` | `sk_live_…`, used once the test key is removed |
| `STRIPE_TEST_WEBHOOK_SECRET` | `whsec_…` of the test **platform** endpoint |
| `STRIPE_TEST_CONNECT_WEBHOOK_SECRET` | `whsec_…` of the test **connected accounts** endpoint |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` of the live platform endpoint |
| `STRIPE_CONNECT_WEBHOOK_SECRET` | `whsec_…` of the live connected accounts endpoint |

The webhook accepts a signature from any of these. It then ignores events
whose `livemode` doesn't match the active key. So test and live endpoints can
both stay configured without test events ever touching real bookings.

## 3. Webhook endpoints

Both endpoints point at the **`stripeWebhook`** function's URL, which you can copy
from Base44 → Code → Functions → stripeWebhook. Create both in test mode and
again in live mode.

**Endpoint A: "Your account"** (sign with `STRIPE_[TEST_]WEBHOOK_SECRET`)

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `charge.refunded`
- `charge.dispute.created`
- `charge.dispute.closed`

**Endpoint B: "Connected accounts"** (sign with `STRIPE_[TEST_]CONNECT_WEBHOOK_SECRET`)

- `account.updated`

## 4. Testing end to end (test mode)

1. As a creator, open the dashboard and **Set up payouts**. In Express
   onboarding, use the test values Stripe pre-fills: phone `000 000 0000`, SMS
   code `000000`, SSN `000-00-0000`, routing `110000000`, account `000123456789`.
2. As a client, request a booking. The creator quotes, and the client accepts
   and pays with card `4242 4242 4242 4242`, any future date, any CVC.
3. Check the booking for `payment_status: held`, `creator_payout`,
   `fee_amount`, and `stripe_charge_id`.
4. The creator marks final delivery, then the client confirms (or wait for the
   sweep). The booking should show `payment_status: released` and a
   `stripe_transfer_id`.

Other useful cards and scenarios:

| Scenario | How |
| --- | --- |
| Declined card | `4000 0000 0000 0002` |
| 3D Secure | `4000 0027 6000 3184` |
| Dispute | `4000 0000 0000 0259`, which opens a dispute right after payment |
| Bank payment (ACH) | Pick US bank account and use the "Success" or "Failure" test bank |
| Transfer while funds settle | `4000 0000 0000 0077` puts the charge straight into the available balance |

To replay webhooks locally, run
`stripe listen --forward-to <stripeWebhook URL>` and, for Connect,
`stripe listen --forward-connect-to <stripeWebhook URL>`. Put the printed
`whsec_…` into the matching test secret.

## 5. Going live checklist

- [ ] Stripe account activated, with Connect platform profile and branding done
- [ ] Both live webhook endpoints created with the event lists above
- [ ] `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` and
      `STRIPE_CONNECT_WEBHOOK_SECRET` set
- [ ] `STRIPE_TEST_SECRET_KEY` **removed** (this is the switch to live mode)
- [ ] The **Release Payouts** workflow is enabled (hourly)
- [ ] A small real booking run end to end, then refunded from the admin dashboard

## Where things live

| File | Role |
| --- | --- |
| `base44/shared/stripe.ts` | Keys, mode, fee maths, the Stripe request helper |
| `base44/shared/payouts.ts` | Record a payment, release a payout, refund (plus reversal) |
| `base44/functions/createBookingCheckout` | Builds the Checkout Session from the accepted quote |
| `base44/functions/stripeWebhook` | Verifies signatures and applies Stripe events |
| `base44/functions/startPayoutSetup` | Express onboarding, status check, and dashboard login link |
| `base44/functions/releasePayouts` | Hourly sweep of bookings past their hold |
| `base44/functions/releasePayout` | Founder decision: release or refund |
| `base44/functions/cancelBooking` | Cancellation policy (72h full, 48–72h half, under 48h none) |
