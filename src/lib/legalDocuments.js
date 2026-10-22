import { TERMS_CONTENT } from './termsText';

export { TERMS_CONTENT };

// Each document carries its own version, so updating one doesn't make every
// user re-accept the other.
export const TERMS_VERSION = '2026-10-22';
export const PRIVACY_VERSION = '2026-09-10';

export const TERMS_LAST_UPDATED = 'October 22, 2026';
export const PRIVACY_LAST_UPDATED = 'September 10, 2026';

export const PRIVACY_CONTENT = `STELLI

Privacy Policy

Last updated: September 10, 2026   |   getstelli.com

The short version

What we collect, what we don't, and what we do with it. The full policy below is what legally applies, and nothing in it contradicts this page.

Full policy

This Privacy Policy explains how Stelli [LLC/Inc.] ("Stelli," "we," "us") collects, uses, and protects information when you use getstelli.com and the Stelli platform (the "Platform"). By using Stelli, you agree to this policy. "Client" means anyone booking a creator; "Creator" means a photographer or videographer in the Constellation Collective.

1. Information we collect

Account information: name, email address, phone number, and password. Creators also provide a bio, portfolio links, social media handles, the formats they offer, and their prices.

Booking information: the date, time, shoot location address, price, add-ons, and any notes you enter when booking. A shoot address is something you type in — we never collect it from your device.

Messages and communications: messages sent between Clients and Creators through the Platform, and any emails you send to Stelli.

Content: photos and video uploaded by Creators as booking deliverables, profile images, ratings, and written reviews.

Reports: if you report another user, we collect what you tell us and any screenshots or evidence you attach.

Technical information: basic server logs such as IP address, browser type, and pages visited, collected automatically by our hosting provider to keep the Platform running and secure. We do not use this for tracking or advertising.

2. Information we do not collect

Location data. Stelli does not access your device's location, GPS, or Bluetooth, and does not track where you are before, during, or after a shoot.

Payment, identity, and tax data. Card numbers, bank account details, government ID, date of birth, Social Security or tax ID numbers, and W-9 information are collected and stored directly by Stripe, Inc. under Stripe's Privacy Policy (stripe.com/privacy). Stelli never receives or stores this information. We see only whether a payment succeeded and the amounts involved.

Third-party analytics or advertising data. Stelli does not currently use Google Analytics, Meta Pixel, TikTok Pixel, session recording tools, or any advertising trackers. If that changes, we will update this policy and tell you first.

Biometric data. We do not run face detection, facial recognition, or any biometric processing on any photo or video.

3. How we use your information

To create and manage your account, match Clients with Creators, and process bookings.

To generate the written booking contract and deliver copies to both parties.

To release contact details between a Client and Creator after a booking is confirmed, so they can coordinate the shoot.

To store and deliver booking photos and video.

To send you transactional emails and text messages about your account, bookings, deliveries, and disputes.

To send occasional Stelli updates or offers by email, which you can opt out of at any time.

To review reports, handle disputes, enforce our Terms and Conditions, and keep the community safe.

To comply with legal obligations, including tax reporting and the NYC Freelance Isn't Free Act.

4. Photos, video, and AI

Deliverables are stored on the Platform for at least 90 days after delivery so Clients can download them.

Stelli does not use artificial intelligence or machine learning of any kind on Client photos or video. No AI editing, enhancement, tagging, sorting, face detection, or generation is applied to deliverables, and no deliverables are used to train any AI model.

Stelli may use AI tools for internal administrative work — for example organizing documents or drafting internal notes. These tools are never given access to Client photos or video and are never involved in what is delivered to a Client.

Deliverables are displayed on a Creator's Stelli profile or in Stelli marketing only where the Client has given approval through the Platform, as described in the Terms and Conditions.

5. Who can see your information

Stelli's team. Stelli's founders and curators can access account, booking, message, and deliverable data to run the Platform, review reports, and resolve disputes.

The other party to a booking. After a booking is confirmed, the Client and Creator see each other's name, phone number, and email. Before confirmation, only names and profile content are visible.

Base44. The Platform is built and hosted on Base44, which stores Platform data on Stelli's behalf under its own security and privacy commitments.

Stripe. Handles payments, payouts, identity verification, and tax reporting as described in Section 2.

Email and SMS delivery. Transactional emails and texts are sent through Base44's built-in services or a comparable delivery provider that processes your email address or phone number solely to deliver the message.

Legal requirements. We may disclose information if required by law, subpoena, or court order, or to protect the safety of users or the public.

No one else. Stelli does not sell personal information and does not share your email, phone number, or any other data with advertisers, data brokers, or anyone outside the Stelli community for their own purposes.

6. Cookies

Stelli uses only the essential cookies needed to keep you logged in and keep the Platform secure. We do not use advertising, tracking, or third-party analytics cookies.

7. How long we keep your information

Your account and its data remain active until you ask us to delete them.

To delete your account, email [SUPPORT EMAIL] from the address on your account. We will remove your profile, messages, and personal details within 30 days, provided you have no open bookings or disputes.

Booking confirmations, contracts, payment records, and dispute records are retained after deletion for as long as required by tax law and the NYC Freelance Isn't Free Act, and then deleted.

Deliverables are kept for at least 90 days after delivery, after which they may be removed from the Platform.

8. Your choices and rights

You can view and update your profile information at any time in your account settings.

You can request a copy of the personal information we hold about you, or ask us to correct or delete it, by emailing [SUPPORT EMAIL].

You can unsubscribe from marketing emails using the link in any such email. You will still receive transactional messages about your bookings.

Depending on where you live, you may have additional rights under state privacy laws (such as the California Consumer Privacy Act). We honor those requests for all users regardless of location. We will not discriminate against you for exercising any privacy right.

9. Security

Stelli uses industry-standard measures, including encrypted connections and access controls, to protect your information. No system is perfectly secure, and we cannot guarantee absolute security. If we become aware of a breach affecting your personal information, we will notify you as required by law.

10. Children

Stelli is for users 18 and older. We do not knowingly collect information from anyone under 18. If we learn we have, we will delete it.

11. Changes to this policy

We may update this policy from time to time. Material changes — including any decision to add analytics tools, location features, or AI processing of photos — will be announced by email or in-app notice before they take effect. Continued use of Stelli after changes means you accept them.

12. Contact

Questions or requests about this policy: Stelli [LLC/Inc.], [ADDRESS], [SUPPORT EMAIL].

Working draft for founder review — not legal advice. Have a licensed attorney review before publishing.`;

export const CONTRACT_TEMPLATE_CONTENT = `Stelli Booking Confirmation

This agreement confirms the booking between the Client and Creator named below. The Creator agrees to perform the booked shoot, and the Client agrees to pay the stated total through Stelli.

Client: {{client_name}}
Creator: {{creator_name}}
Format: {{format_name}}
Shoot date: {{shoot_date}}
Shoot time: {{shoot_time}}
Shoot location: {{shoot_location}}
Creator fee: {{creator_fee}}
Add-ons: {{add_ons}}
Total paid: {{total_paid}}
Included edited photos: {{included_edited_photos}}
Unedited delivery deadline: {{unedited_delivery_deadline}}
Edited delivery deadline: {{edited_delivery_deadline}}

This Booking Confirmation, together with Stelli's Terms and Conditions (getstelli.com/terms), constitutes the written agreement between the Client and the Creator for this booking.`;