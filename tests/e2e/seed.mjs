/**
 * The people and bookings the mock backend starts with: enough of Stelli to
 * see every screen in a real state.
 *
 *   jordan@example.com   u_client    a client with shoots at every stage
 *   maya@example.com     u_creator   an approved creator with a full page
 *   sam@example.com      u_new       signed up as a creator, no page yet
 *   priya@example.com    u_pending   a creator whose page is in review
 *   founder@example.com  u_admin     a founder
 *   riley@example.com    u_fresh     has not picked client or creator yet
 */
const DAY = 86_400_000;
const iso = (offsetDays) => new Date(Date.now() + offsetDays * DAY).toISOString();
const day = (offsetDays) => iso(offsetDays).slice(0, 10);

const TERMS = '2026-10-22';
const PRIVACY = '2026-09-10';

export async function seed(db, filesOrigin) {
  const { entities } = db;
  const photo = (n, w = 900, h = 1200) => `${filesOrigin}/photo-${n}-${w}x${h}.svg`;
  const face = (n) => `${filesOrigin}/face-${n}.svg`;

  const users = [
    { id: 'u_client', email: 'jordan@example.com', full_name: 'Jordan Lee', role: 'user', account_type: 'client', age_confirmed: true },
    { id: 'u_creator', email: 'maya@example.com', full_name: 'Maya Ortiz', role: 'user', account_type: 'creator', age_confirmed: true },
    { id: 'u_new', email: 'sam@example.com', full_name: 'Sam Rivera', role: 'user', account_type: 'creator', age_confirmed: true },
    { id: 'u_pending', email: 'priya@example.com', full_name: 'Priya Shah', role: 'user', account_type: 'creator', age_confirmed: true },
    { id: 'u_admin', email: 'founder@example.com', full_name: 'Stelli Founder', role: 'admin', account_type: 'client', age_confirmed: true },
    { id: 'u_fresh', email: 'riley@example.com', full_name: 'Riley Chen', role: 'user' },
  ];
  for (const user of users) {
    await entities.User.create({ ...user, created_date: iso(-60) });
    if (user.id === 'u_fresh') continue;
    for (const [type, version] of [['terms', TERMS], ['privacy', PRIVACY]]) {
      await entities.AgreementAcceptance.create({
        user_id: user.id, user_email: user.email, booking_id: '', document_type: type, document_version: version, accepted_at: iso(-30),
      });
    }
  }
  await entities.LegalDocument.create({ type: 'terms', version: TERMS, effective_date: TERMS });
  await entities.LegalDocument.create({ type: 'privacy', version: PRIVACY, effective_date: PRIVACY });

  const creator = (data) => ({
    market: 'ELON',
    profile_theme: 'night_flash',
    accent_color: 'lime',
    gallery_style: 'hero_grid',
    wall_layout: 'wall',
    wall_curve: 'soft',
    print_frame: 'mat',
    print_mat: 'mixed',
    show_captions: true,
    booking_cta: 'Request a date',
    avg_rating: 0,
    review_count: 0,
    completed_shoots: 0,
    status: 'approved',
    age_confirmed: true,
    created_date: iso(-45),
    updated_date: iso(-2),
    ...data,
    profile_headline: `Book ${data.display_name} safely through Stelli.`,
    profile_tagline: (data.specialties || []).slice(0, 3).join(' · '),
    pinned_images: (data.portfolio_images || []).slice(0, 3),
    cover_image: data.cover_image || (data.portfolio_images || [])[0] || '',
  });

  await entities.Lensman.create(creator({
    id: 'aaaaaaaaaaaaaaaaaaaaaa01',
    user_id: 'u_creator',
    display_name: 'Maya',
    slug: 'maya',
    profile_image: face(1),
    portfolio_images: [photo(1), photo(2, 1200, 900), photo(3), photo(4, 1000, 1000), photo(5), photo(6, 1200, 800), photo(7)],
    one_liner: 'Golden hour believer. Your mom will cry (good tears).',
    style_tags: ['golden hour', 'candid', 'film'],
    neighborhoods: ['Fonville Fountain', 'Under the Oaks', 'Lake Mary Nell', 'Anywhere on campus'],
    specialties: ['Graduation', 'Portraits', 'Couples'],
    bio: 'Warm, easy sessions built around real moments. I direct just enough that you never feel stiff, and I shoot a roll of film at every session.',
    equipment: 'Sony A7IV, 35mm and 85mm, one flash, Pentax K1000',
    years_experience: 4,
    prompt_question: 'Clients always tell me…',
    prompt_answer: 'the photos felt like us, not a photoshoot.',
    dont_shoot: 'No weddings or newborns. Ask me about your dog though.',
    pricing_tiers: [
      { tier: 'low', name: 'Quick Session', price: 60, duration: '30 min', includes: '10 edited photos, 1 location' },
      { tier: 'mid', name: 'Standard', price: 120, duration: '1 hr', includes: '25 edited photos, 2 locations' },
      { tier: 'high', name: 'Full Shoot', price: 220, duration: '2 hr', includes: '50 edited photos, film roll' },
    ],
    avg_rating: 4.9,
    review_count: 7,
    completed_shoots: 12,
    profile_views: 248,
    response_median_minutes: 38,
    payouts_enabled: true,
    stripe_account_id: 'acct_maya',
    blackout_dates: [day(9), day(10)],
  }));
  await entities.CreatorContact.create({
    lensman_id: 'aaaaaaaaaaaaaaaaaaaaaa01', user_id: 'u_creator', full_name: 'Maya Ortiz', email: 'maya@example.com', phone: '336 555 0100', instagram: 'mayashoots',
  });

  await entities.Lensman.create(creator({
    id: 'aaaaaaaaaaaaaaaaaaaaaa02',
    user_id: 'u_pending',
    display_name: 'Priya',
    slug: 'priya',
    status: 'pending',
    profile_image: face(2),
    portfolio_images: [photo(11), photo(12), photo(13, 1200, 900)],
    one_liner: 'Flash on, hands up.',
    style_tags: ['direct flash', 'nightlife'],
    neighborhoods: ['Off campus'],
    specialties: ['Nightlife', 'Events'],
    bio: 'I shoot mostly at night and keep it relaxed.',
    pricing_tiers: [{ tier: 'low', name: 'Quick Session', price: 45, duration: '30 min', includes: '' }],
  }));
  await entities.CreatorContact.create({
    lensman_id: 'aaaaaaaaaaaaaaaaaaaaaa02', user_id: 'u_pending', full_name: 'Priya Shah', email: 'priya@example.com', phone: '', instagram: '',
  });

  const others = [
    ['Theo', ['Editorial', 'Music Videos', 'Commercial'], ['film', 'editorial', 'moody'], 'Film first. Digital when the brief calls for it.', 'magenta', 'strip', 4.8, 5, 9],
    ['Lena', ['Couples', 'Family', 'Portraits'], ['bright & airy', 'candid'], 'Soft light, loud laughs.', 'cyan', 'wall', 5, 3, 4],
    ['Dev', ['Sports', 'Events', 'Headshots'], ['documentary'], 'I never miss the moment.', 'lime', 'grid', 0, 0, 0],
    ['Noor', ['Headshots', 'Product', 'Commercial'], ['clean', 'editorial'], 'Career-fair ready in twenty minutes.', 'cyan', 'wall', 4.7, 11, 20],
    ['Jules', ['Nightlife', 'Events'], ['direct flash', 'nightlife', 'candid'], "Flash on, hands up, we'll fix it in the blur.", 'lime', 'wall', 0, 0, 1],
  ];
  let n = 20;
  for (const [i, [name, specialties, tags, line, accent, layout, rating, reviews, shoots]] of others.entries()) {
    const id = `aaaaaaaaaaaaaaaaaaaaaa1${i}`;
    await entities.User.create({ id: `u_c${i}`, email: `${name.toLowerCase()}@example.com`, full_name: `${name} Creator`, role: 'user', account_type: 'creator', age_confirmed: true });
    await entities.Lensman.create(creator({
      id,
      user_id: `u_c${i}`,
      display_name: name,
      slug: name.toLowerCase(),
      profile_image: face(i + 3),
      portfolio_images: [photo(n++), photo(n++, 1200, 900), photo(n++), photo(n++, 1000, 1000), photo(n++)],
      one_liner: line,
      style_tags: tags,
      neighborhoods: ['Scott Plaza', 'Young Commons', 'Off campus'].slice(0, 1 + (i % 3)),
      specialties,
      bio: `${name} keeps sessions relaxed and plans the shot list so your shoot day is easy.`,
      accent_color: accent,
      wall_layout: layout,
      avg_rating: rating,
      review_count: reviews,
      completed_shoots: shoots,
      pricing_tiers: [{ tier: 'low', name: 'Quick Session', price: 50 + i * 15, duration: '30 min', includes: '' }],
      updated_date: iso(-i),
    }));
  }

  /* ---------- bookings between Jordan and Maya, one at every stage ---------- */
  const booking = (data) => ({
    lensman_id: 'aaaaaaaaaaaaaaaaaaaaaa01',
    lensman_name: 'Maya',
    lensman_email: 'maya@example.com',
    creator_id: 'u_creator',
    creator_email: 'maya@example.com',
    client_id: 'u_client',
    client_name: 'Jordan Lee',
    client_email: 'jordan@example.com',
    event_time: '16:30',
    location: 'Fonville Fountain',
    shoot_setting: 'outdoor',
    attendees: 2,
    duration: '1 hr',
    status: 'requested',
    payment_status: 'pending',
    created_date: iso(-3),
    updated_date: iso(-1),
    ...data,
  });
  const paid = (amount) => ({
    total_price: amount,
    fee_amount: Math.round(amount * 0.14 * 100) / 100,
    creator_payout: Math.round(amount * 0.86 * 100) / 100,
    amount_charged: Math.round(amount * 1.14 * 100) / 100,
    paid_at: iso(-6),
    stripe_payment_intent_id: 'pi_mock',
    client_contract_accepted: true,
  });

  await entities.Booking.create(booking({
    id: 'b_requested', event_type: 'Graduation', event_date: day(21), event_description: 'Cap and gown photos with two friends before commencement.', budget: '$100–150', created_date: iso(-0.4),
  }));
  await entities.Booking.create(booking({
    id: 'b_quoted', event_type: 'Couples', event_date: day(14), event_description: 'Anniversary photos around campus at sunset.', status: 'quoted', location: 'Lake Mary Nell',
  }));
  await entities.Quote.create({
    id: 'q_sent', booking_id: 'b_quoted', creator_id: 'u_creator', client_id: 'u_client', amount: 140,
    message: 'One hour at golden hour, 25 edited photos.', included_edits: 25, add_ons: [{ name: 'Extra 10 edits', price: 30 }],
    expires_at: iso(5), status: 'sent', created_date: iso(-1),
  });
  await entities.Booking.create(booking({
    id: 'b_topay', event_type: 'Headshots', event_date: day(10), status: 'quote_accepted', quote_id: 'q_accepted', total_price: 80, location: 'Belk Library',
    event_description: 'LinkedIn headshots before the career fair.', client_contract_accepted: true, contract_id: 'c_topay',
  }));
  await entities.Quote.create({
    id: 'q_accepted', booking_id: 'b_topay', creator_id: 'u_creator', client_id: 'u_client', amount: 80, message: 'Thirty minutes, 8 edited headshots.',
    included_edits: 8, add_ons: [], status: 'accepted', created_date: iso(-2),
  });
  await entities.Booking.create(booking({
    id: 'b_confirmed', event_type: 'Portraits', event_date: day(5), status: 'confirmed', payment_status: 'held', ...paid(120),
    event_description: 'Senior portraits, relaxed and outdoors.', contract_id: 'c_confirmed', creator_contract_accepted: true, client_phone: '336 555 0188',
  }));
  await entities.Booking.create(booking({
    id: 'b_today', event_type: 'Events', event_date: day(0), event_time: '18:00', status: 'confirmed', payment_status: 'held', ...paid(200),
    client_id: 'u_admin', client_name: 'Avery Stone', client_email: 'founder@example.com', location: 'Scott Plaza',
    event_description: 'Club showcase, about forty people.', creator_contract_accepted: true,
  }));
  await entities.Booking.create(booking({
    id: 'b_todeliver', event_type: 'Family', event_date: day(-2), status: 'confirmed', payment_status: 'held', ...paid(160),
    event_description: 'Family weekend photos.', creator_contract_accepted: true, location: 'Under the Oaks',
  }));
  await entities.Booking.create(booking({
    id: 'b_delivered', event_type: 'Portraits', event_date: day(-6), status: 'delivered', payment_status: 'held', ...paid(120),
    delivered_at: iso(-0.5), release_due_at: iso(1.5), delivery_link: 'https://gallery.example/jordan-portraits', album_token: 'tok_delivered',
    unedited_delivered_at: iso(-4), creator_contract_accepted: true, delivery_notes: 'Favourites are starred. Thank you!',
  }));
  await entities.Booking.create(booking({
    id: 'b_completed', event_type: 'Graduation', event_date: day(-40), status: 'completed', payment_status: 'released', ...paid(220),
    delivered_at: iso(-36), released_at: iso(-34), completed_at: iso(-34), delivery_link: 'https://gallery.example/jordan-grad', album_token: 'tok_completed',
    stripe_transfer_id: 'tr_mock', creator_contract_accepted: true,
  }));
  await entities.Booking.create(booking({
    id: 'b_cancelled', event_type: 'Nightlife', event_date: day(-12), status: 'cancelled', payment_status: 'refunded', ...paid(90),
    cancelled_at: iso(-15), cancelled_by: 'client', refund_amount: 102.6, refunded_at: iso(-15),
  }));

  const contract = (id, bookingId, fee, date) => ({
    id, booking_id: bookingId, client_id: 'u_client', client_name: 'Jordan Lee', creator_id: 'u_creator', creator_user_id: 'u_creator', creator_name: 'Maya',
    format_name: 'Portrait session', shoot_date: date, shoot_time: '16:30', shoot_location: 'Fonville Fountain', creator_fee: fee, base_price: fee,
    service_fee: Math.round(fee * 0.14 * 100) / 100, total_paid: Math.round(fee * 1.14 * 100) / 100, creator_net: Math.round(fee * 0.86 * 100) / 100,
    included_edited_photos: 25, add_ons: [], add_on_lines: [], terms_version: TERMS, privacy_version: PRIVACY, version: 1, status: 'active',
    contract_text: 'This Booking Agreement is between the Client and the Creator named above, arranged through Stelli.\n\n1. The shoot\nThe Creator will photograph the session described above.\n\n2. Payment\nThe Client pays through Stelli. Payment is held until the photos are delivered.\n\n3. Delivery\nUnedited photos within 48 hours; final edits within 14 days.',
    client_accepted_at: iso(-6), creator_accepted_at: iso(-6), created_at: iso(-6), created_date: iso(-6),
  });
  await entities.BookingContract.create(contract('c_confirmed', 'b_confirmed', 120, day(5)));
  await entities.BookingContract.create({ ...contract('c_topay', 'b_topay', 80, day(10)), creator_accepted_at: null });

  const message = (bookingId, role, content, ago, extra = {}) => ({
    booking_id: bookingId, client_id: 'u_client', creator_id: 'u_creator', sender_role: role,
    sender_name: role === 'client' ? 'Jordan Lee' : 'Maya', content, kind: 'text', created_date: iso(-ago), ...extra,
  });
  for (const m of [
    message('b_requested', 'client', 'Hi Maya! Three of us graduating in May. Could we do Fonville and Under the Oaks?', 0.4),
    message('b_quoted', 'client', 'Hoping for golden hour if you have it free.', 2.2),
    message('b_quoted', 'lensman', 'Golden hour is my favourite. Sending a quote now.', 1.1),
    message('b_quoted', 'lensman', 'Maya sent a quote for $140.', 1, { kind: 'system' }),
    message('b_topay', 'lensman', 'All set on my side. Pay whenever you are ready and the date is yours.', 1.6),
    message('b_confirmed', 'client', 'Paid! See you Friday.', 5.5),
    message('b_confirmed', 'lensman', 'Can\'t wait. Wear something you feel like yourself in.', 5.2),
    message('b_delivered', 'lensman', 'Your photos are up. The starred ones are my favourites.', 0.5),
    message('b_completed', 'client', 'These are perfect, thank you so much!', 35),
  ]) {
    await entities.Message.create(m);
  }

  await entities.Review.create({
    id: 'r_grad', booking_id: 'b_completed', client_id: 'u_client', lensman_id: 'aaaaaaaaaaaaaaaaaaaaaa01', client_name: 'Jordan',
    rating: 5, comment: 'Maya made three awkward seniors look like a magazine cover. Worth every dollar.', event_type: 'Graduation', created_date: iso(-33),
  });
  await entities.PhotoRelease.create({
    id: 'pr_grad', booking_id: 'b_completed', lensman_id: 'aaaaaaaaaaaaaaaaaaaaaa01', lensman_name: 'Maya', creator_id: 'u_creator', client_id: 'u_client',
    client_name: 'Jordan Lee', event_type: 'Graduation', event_date: day(-40), photos: [photo(41), photo(42, 1200, 900), photo(43)],
    client_decision: 'approved', client_decided_at: iso(-30), creator_decision: 'approved', creator_decided_at: iso(-31), review_id: 'r_grad', shared_at: iso(-10),
    created_date: iso(-34),
  });
  await entities.PhotoRelease.create({
    id: 'pr_portraits', booking_id: 'b_delivered', lensman_id: 'aaaaaaaaaaaaaaaaaaaaaa01', lensman_name: 'Maya', creator_id: 'u_creator', client_id: 'u_client',
    client_name: 'Jordan Lee', event_type: 'Portraits', event_date: day(-6), photos: [photo(44), photo(45)],
    client_decision: 'pending', creator_decision: 'approved', creator_decided_at: iso(-0.4), created_date: iso(-0.5),
  });
}
