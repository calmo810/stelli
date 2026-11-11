import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

/**
 * Retired. Booking requests go through submitBookingRequest, which checks
 * that the creator is approved and not on hold, that the person is 18 or
 * older, that the date is real, and that the note carries no contact details.
 *
 * Nothing in the app calls this one, but it was deployed (as
 * "createBookingRequest/entry") and anyone signed in could call it directly,
 * skipping all of those checks. It now refuses every call. It is kept, not
 * deleted, until you say so (REVIEW.md, decision D14).
 */
export default async function (req) {
  createClientFromRequest(req);
  return Response.json(
    { error: 'This has moved. Send your request from the creator’s page.' },
    { status: 410 }
  );
}
