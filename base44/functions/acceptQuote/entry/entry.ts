import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';

const PUBLISHED_ORIGIN = 'https://stelli-moment-craft.base44.app';

function addBusinessDays(dateString, days) {
  const date = new Date(`${dateString}T12:00:00`);
  let added = 0;
  while (added < days) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) added += 1;
  }
  return date.toISOString().split('T')[0];
}

function latestVersion(docs, type) {
  return docs.find(item => item.type === type)?.version || '2026-09-10';
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });

    const { quoteId, origin } = await req.json();
    if (!quoteId) return Response.json({ error: 'Quote ID is required.' }, { status: 400 });

    const quote = await base44.asServiceRole.entities.Quote.get(quoteId);
    if (!quote) return Response.json({ error: 'Quote not found.' }, { status: 404 });
    if (quote.status !== 'sent') return Response.json({ error: 'This quote is no longer open.' }, { status: 400 });
    if (quote.expires_at && new Date(quote.expires_at) < new Date()) {
      await base44.asServiceRole.entities.Quote.update(quoteId, { status: 'expired' });
      return Response.json({ error: 'This quote has expired. Ask your creator for a new one.' }, { status: 400 });
    }

    const booking = await base44.asServiceRole.entities.Booking.get(quote.booking_id);
    if (!booking) return Response.json({ error: 'Booking not found.' }, { status: 404 });
    const isClient = booking.client_id === user.id || booking.client_email === user.email;
    if (!isClient) return Response.json({ error: 'Only the client can accept this quote.' }, { status: 403 });

    const now = new Date().toISOString();
    const docs = await base44.asServiceRole.entities.LegalDocument.list('-effective_date', 20);
    const termsVersion = latestVersion(docs, 'terms');
    const privacyVersion = latestVersion(docs, 'privacy');
    const contractVersion = latestVersion(docs, 'contract_template');

    let contract = (await base44.asServiceRole.entities.BookingContract.filter({ booking_id: booking.id }))[0];
    if (!contract) {
      const uneditedDeadline = addBusinessDays(booking.event_date, 3);
      const editedDeadline = addBusinessDays(booking.event_date, 10);
      const amount = quote.amount || 0;
      const contractText = [
        'Stelli Booking Confirmation',
        '',
        `Client: ${booking.client_name || booking.client_email}`,
        `Creator: ${booking.lensman_name || 'Creator'}`,
        `Shoot date: ${booking.event_date}`,
        `Shoot time: ${booking.event_time || 'To be coordinated'}`,
        `Shoot location: ${booking.location || 'To be coordinated'}`,
        `Agreed price: $${amount.toLocaleString()}`,
        `Included edited photos: ${quote.included_edited_photos || 30}`,
        `Unedited delivery deadline: ${uneditedDeadline}`,
        `Edited delivery deadline: ${editedDeadline}`,
        quote.message ? `\nWhat the quote covers: ${quote.message}` : '',
        '',
        "The Creator agrees to perform the booked shoot, and the Client agrees to pay the stated total through Stelli. Payment is held until the files are delivered. Unedited files are delivered for selection only. Edited files transfer to the Client once payment is released, under Stelli's Terms and Conditions.",
        '',
        "This Booking Confirmation, together with Stelli's Terms and Conditions (getstelli.com/terms), is the written agreement between the Client and the Creator for this booking.",
      ].join('\n');

      contract = await base44.asServiceRole.entities.BookingContract.create({
        booking_id: booking.id,
        client_id: booking.client_id || user.id,
        client_email: booking.client_email,
        client_name: booking.client_name || '',
        creator_id: booking.creator_id || '',
        creator_email: booking.creator_email || '',
        creator_name: booking.lensman_name || 'Creator',
        format_name: 'Stelli booking',
        shoot_date: booking.event_date,
        shoot_time: booking.event_time || '',
        shoot_location: booking.location || '',
        creator_fee: amount,
        total_paid: amount,
        included_edited_photos: quote.included_edited_photos || 30,
        unedited_delivery_deadline: uneditedDeadline,
        edited_delivery_deadline: editedDeadline,
        contract_text: contractText,
        terms_version: termsVersion,
        privacy_version: privacyVersion,
        version: contractVersion,
        client_accepted_at: now,
        creator_accepted_at: quote.sent_at,
        created_at: now,
      });
    }

    await base44.asServiceRole.entities.AgreementAcceptance.create({
      user_id: user.id,
      user_email: user.email,
      booking_id: booking.id,
      document_type: 'booking_contract',
      document_version: contract.version,
      accepted_at: now,
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || '',
      user_agent: req.headers.get('user-agent') || '',
    });

    await base44.asServiceRole.entities.Quote.update(quoteId, { status: 'accepted', responded_at: now });
    await base44.asServiceRole.entities.Booking.update(booking.id, {
      quote_id: quoteId,
      total_price: quote.amount,
      contract_id: contract.id,
      terms_version: termsVersion,
      privacy_version: privacyVersion,
      client_contract_accepted: true,
      client_contract_accepted_at: now,
      creator_contract_accepted: true,
      creator_contract_accepted_at: quote.sent_at,
    });

    const amountCents = Math.round((quote.amount || 0) * 100);
    if (amountCents <= 0) return Response.json({ error: 'This quote has no amount to pay.' }, { status: 400 });

    const base = (typeof origin === 'string' && origin.startsWith('https://') ? origin : PUBLISHED_ORIGIN).replace(/\/$/, '');
    const body = new URLSearchParams();
    body.set('mode', 'payment');
    body.set('success_url', `${base}/client-dashboard?payment=success&booking=${booking.id}`);
    body.set('cancel_url', `${base}/messages/${booking.id}?payment=cancelled`);
    body.set('customer_email', booking.client_email || '');
    body.set('line_items[0][quantity]', '1');
    body.set('line_items[0][price_data][currency]', 'usd');
    body.set('line_items[0][price_data][unit_amount]', String(amountCents));
    body.set('line_items[0][price_data][product_data][name]', 'Stelli booking');
    body.set('line_items[0][price_data][product_data][description]', `Shoot with ${booking.lensman_name || 'your creator'} on ${booking.event_date}`);
    body.set('metadata[base44_app_id]', secrets.get('BASE44_APP_ID') || '');
    body.set('metadata[booking_id]', booking.id);
    body.set('payment_intent_data[metadata][booking_id]', booking.id);

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secrets.get('STRIPE_SECRET_KEY')}`,
        'Stripe-Version': '2025-10-29.clover',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Idempotency-Key': `quote-checkout-${quoteId}`,
      },
      body,
    });
    const session = await response.json();
    if (!response.ok) {
      return Response.json({ error: session?.error?.message || 'Payment could not be started.' }, { status: 502 });
    }

    return Response.json({ url: session.url, contractId: contract.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
