/**
 * The record of what founders do on the admin page.
 *
 * Every admin action that moves money, changes a creator's standing or
 * touches a client's album writes one line here: who, what, which booking or
 * creator, how much, and how it ended. The lines are written by the backend
 * functions themselves — never by the browser — so there is no way to act
 * from the admin page without leaving one. Only admins can read the log.
 *
 * Never throws: a logging problem must not undo or block the action itself.
 */
export async function logAdminAction(base44, actor, entry) {
  try {
    await base44.asServiceRole.entities.AdminAuditLog.create({
      actor_id: actor?.id || '',
      actor_email: actor?.email || 'system',
      action: String(entry.action || 'unknown'),
      summary: String(entry.summary || '').slice(0, 500),
      outcome: entry.outcome || 'ok',
      booking_id: entry.bookingId || '',
      lensman_id: entry.lensmanId || '',
      amount: Number.isFinite(Number(entry.amount)) ? Number(entry.amount) : 0,
      details: entry.details ? JSON.stringify(entry.details).slice(0, 2000) : '',
      at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Admin action could not be logged -', error.message, '-', entry?.action, entry?.summary);
  }
}

/** The shared gate: the signed-in user, or null unless they are an admin. */
export async function requireAdmin(base44) {
  let user = null;
  try {
    user = await base44.auth.me();
  } catch {
    user = null;
  }
  return user && user.role === 'admin' ? user : null;
}
