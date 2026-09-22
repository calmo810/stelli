/**
 * Resolves which account owns a creator profile.
 *
 * Ownership is the account that applied to join Stelli (Lensman.user_id),
 * never the contact email typed on the public profile — that field is
 * display-only. Requests, quotes, deliveries and notifications all run
 * through this so a creator always sees their own work.
 */
export async function resolveCreatorOwner(base44, lensman) {
  if (!lensman) return { ownerId: '', ownerEmail: '' };

  const ownerId = lensman.user_id || '';
  let ownerEmail = ownerId ? await lookupUserEmail(base44, ownerId) : '';

  // Profiles that have not been linked to an account yet fall back to the
  // contact email so nothing is silently dropped.
  if (!ownerEmail) ownerEmail = lensman.email || '';

  return { ownerId, ownerEmail };
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