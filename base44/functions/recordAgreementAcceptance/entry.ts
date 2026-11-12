import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

/**
 * Records that the signed-in user accepted the Terms or the Privacy Policy.
 *
 * This is a legal record, so the caller doesn't get to write whatever they
 * like into it. It used to accept any document type, any version string and
 * any booking ID, which let anyone signed in fill the acceptance trail with
 * made-up entries. Now:
 *
 *  - only "terms" and "privacy" can be recorded here. Accepting a booking
 *    agreement is recorded by the functions that actually do it (acceptQuote,
 *    acceptBookingContract), never from a bare request;
 *  - the version has to look like a version (a date, e.g. 2026-10-22);
 *  - it is always recorded against the caller, never against a booking;
 *  - recording the same acceptance twice returns the first record.
 */
const DOCUMENT_TYPES = ['terms', 'privacy'];
const VERSION_SHAPE = /^\d{4}-\d{2}-\d{2}$/;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const documentType = String(body.documentType || '');
    const documentVersion = String(body.documentVersion || '').trim();

    if (!DOCUMENT_TYPES.includes(documentType) || !VERSION_SHAPE.test(documentVersion)) {
      return Response.json({ error: 'A document type and version are required.' }, { status: 400 });
    }

    const AgreementAcceptance = base44.asServiceRole.entities.AgreementAcceptance;
    const earlier = await AgreementAcceptance.filter({
      user_id: user.id,
      document_type: documentType,
      document_version: documentVersion,
    });
    if (earlier.length) return Response.json({ acceptance: earlier[0], alreadyRecorded: true });

    const acceptance = await AgreementAcceptance.create({
      user_id: user.id,
      user_email: user.email,
      booking_id: '',
      document_type: documentType,
      document_version: documentVersion,
      accepted_at: new Date().toISOString(),
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || '',
      user_agent: req.headers.get('user-agent') || '',
    });

    return Response.json({ acceptance });
  } catch (error) {
    console.error('recordAgreementAcceptance error:', error.message);
    return Response.json({ error: 'That could not be saved. Try again.' }, { status: 500 });
  }
}
