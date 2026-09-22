import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const documentType = body.documentType;
    const documentVersion = body.documentVersion;
    const bookingId = body.bookingId || '';

    if (!documentType || !documentVersion) {
      return Response.json({ error: 'Document type and version are required' }, { status: 400 });
    }

    const acceptance = await base44.asServiceRole.entities.AgreementAcceptance.create({
      user_id: user.id,
      user_email: user.email,
      booking_id: bookingId,
      document_type: documentType,
      document_version: documentVersion,
      accepted_at: new Date().toISOString(),
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || '',
      user_agent: req.headers.get('user-agent') || '',
    });

    return Response.json({ acceptance });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}