import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

/**
 * The 18+ confirmation for creators whose application predates the age check.
 *
 * The browser used to write straight to the creator record, which let a
 * signed-in creator write any field on it. This function writes with the
 * service role and can only ever set the two age fields, on the caller's own
 * profile, found by user_id.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });

    const profiles = await base44.asServiceRole.entities.Lensman.filter({ user_id: user.id });
    const lensman = profiles[0];
    if (!lensman) return Response.json({ error: 'No creator profile found.' }, { status: 404 });

    const updated = await base44.asServiceRole.entities.Lensman.update(lensman.id, {
      age_confirmed: true,
      age_confirmed_at: new Date().toISOString(),
    });

    return Response.json({ lensman: updated });
  } catch (error) {
    console.error('confirmAge error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}