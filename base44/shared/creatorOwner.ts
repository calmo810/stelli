/**
 * Resolves which account owns a creator profile.
 *
 * Ownership is the account that applied to join Stelli (Lensman.user_id),
 * never a contact email typed on a profile — those are private now. Requests,
 * quotes, deliveries and notifications all run through this so a creator
 * always sees their own work.
 */
export async function resolveCreatorOwner(base44, lensman) {
  if (!lensman) return { ownerId: '', ownerEmail: '' };

  const ownerId = lensman.user_id || '';
  let ownerEmail = ownerId ? await lookupUserEmail(base44, ownerId) : '';

  // Profiles that have not been linked to an account yet fall back to the
  // private contact email so nothing is silently dropped.
  if (!ownerEmail) ownerEmail = await lookupContactEmail(base44, lensman.id);

  return { ownerId, ownerEmail };
}

/** The creator's private contact email, from the admin-only record. */
export async function lookupContactEmail(base44, lensmanId) {
  try {
    const contacts = await base44.asServiceRole.entities.CreatorContact.filter({
      lensman_id: lensmanId,
    });
    return contacts[0]?.email || '';
  } catch (error) {
    console.error('Contact lookup failed for', lensmanId, '-', error.message);
    return '';
  }
}

/** The creator's private contact record, with full name and contact details. */
export async function loadCreatorContact(base44, lensmanId) {
  try {
    const contacts = await base44.asServiceRole.entities.CreatorContact.filter({
      lensman_id: lensmanId,
    });
    return contacts[0] || null;
  } catch (error) {
    console.error('Contact record lookup failed for', lensmanId, '-', error.message);
    return null;
  }
}

async function lookupUserEmail(base44, userId) {
  try {
    const user = await base44.asServiceRole.entities.User.get(userId);
    if (user?.email) return user.email;
  } catch (error) {
    console.error('Owner lookup by id failed for', userId, '-', error.message);
  }
  try {
    const list = await base44.asServiceRole.entities.User.filter({ id: userId });
    return list[0]?.email || '';
  } catch (error) {
    console.error('Owner lookup by filter failed for', userId, '-', error.message);
    return '';
  }
}