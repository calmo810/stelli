import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ConfirmAction from '@/components/shared/ConfirmAction';
import Pill from '@/components/shared/Pill';
import { fieldClass } from '@/lib/glassField';
import { effectiveStatus, isPast } from '@/lib/bookingNextStep';

const errorText = (e, fallback) => e?.response?.data?.error || e?.message || fallback;

/**
 * The quieter things either side can do on a booking, at the foot of the
 * thread: release the payment early, leave a review, cancel. Each one that
 * moves money says exactly what will happen before it does.
 */
export default function BookingActions({ booking, role, onChanged }) {
  const queryClient = useQueryClient();
  const status = effectiveStatus(booking);
  const underReview = Boolean(
    booking.flagged_for_review || booking.stray_payment_intent_id || booking.problem_reported_at
  );

  const canRelease =
    role === 'client' &&
    status === 'delivered' &&
    booking.payment_status === 'held' &&
    !underReview &&
    booking.release_due_at &&
    new Date(booking.release_due_at) > new Date();
  const canCancel = !isPast(booking) && status !== 'delivered' && !underReview && !booking.dispute_status;
  const canReview = role === 'client' && status === 'completed';

  return (
    <div className="space-y-3 pt-2">
      {canRelease && <EarlyRelease booking={booking} onChanged={onChanged} />}
      {canReview && <ReviewBox booking={booking} queryClient={queryClient} />}
      {canCancel && <CancelLink booking={booking} role={role} onChanged={onChanged} />}
    </div>
  );
}

function EarlyRelease({ booking, onChanged }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const creator = (booking.lensman_name || 'your creator').split(' ')[0];

  const run = async () => {
    setBusy(true);
    setError('');
    try {
      const response = await base44.functions.invoke('confirmDelivery', { bookingId: booking.id });
      if (response.data?.error) throw new Error(response.data.error);
      setOpen(false);
      setDone(
        response.data?.result?.released
          ? `Done. The payment is on its way to ${creator}.`
          : `Thanks. The payment goes to ${creator} as soon as it can.`
      );
      onChanged?.();
    } catch (e) {
      setError(errorText(e, 'That did not go through. Try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="glass rounded-[22px] px-[18px] py-4">
      <p className="text-[14px] leading-relaxed text-white/75">Happy with your photos? You can release the payment now instead of waiting.</p>
      {done ? (
        <p className="mt-3 text-[13px] font-medium" style={{ color: 'hsl(var(--neon-lime))' }}>{done}</p>
      ) : (
        <Pill as="button" type="button" tone="glass" onClick={() => setOpen(true)} className="mt-3">
          Release the payment now
        </Pill>
      )}
      <ConfirmAction
        open={open}
        title="Release the payment now?"
        message={`${creator} is paid now, and you can no longer report a problem through Stelli. This can’t be undone.`}
        confirmLabel="Yes, release it"
        busy={busy}
        error={error}
        onConfirm={run}
        onCancel={() => setOpen(false)}
      />
    </div>
  );
}

function ReviewBox({ booking, queryClient }) {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const { data: existing, isLoading } = useQuery({
    queryKey: ['booking-review', booking.id],
    queryFn: async () => (await base44.entities.Review.filter({ booking_id: booking.id }).catch(() => []))[0] || null,
  });

  if (isLoading) return null;
  if (existing) {
    return (
      <p className="glass rounded-[22px] px-[18px] py-4 text-[13px] text-white/55">
        You rated this shoot {existing.rating} out of 5. Thank you.
      </p>
    );
  }

  const send = async () => {
    if (!stars) {
      setError('Pick a rating first.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const response = await base44.functions.invoke('submitReview', { bookingId: booking.id, rating: stars, comment });
      if (response.data?.error) throw new Error(response.data.error);
      await queryClient.invalidateQueries({ queryKey: ['booking-review', booking.id] });
    } catch (e) {
      setError(errorText(e, 'Your review did not save. Try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="glass rounded-[22px] px-[18px] py-4">
      <p className="text-[14px] font-semibold text-white">How was your shoot with {(booking.lensman_name || 'your creator').split(' ')[0]}?</p>
      <div className="mt-3 flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={stars === n}
            aria-label={`${n} star${n === 1 ? '' : 's'}`}
            onClick={() => setStars(n)}
            className="grid h-11 w-11 place-items-center"
          >
            <Star
              className="h-6 w-6"
              style={{ color: 'hsl(var(--neon-magenta))', fill: n <= stars ? 'hsl(var(--neon-magenta))' : 'transparent' }}
            />
          </button>
        ))}
      </div>
      <textarea
        rows={3}
        value={comment}
        maxLength={2000}
        onChange={(e) => setComment(e.target.value)}
        placeholder="A few words for the next client (optional)"
        className={`${fieldClass} mt-3`}
      />
      <p className="mt-2 text-[12px] text-white/40">Shown on their page with your first name and last initial.</p>
      <Pill as="button" type="button" tone="lime" onClick={send} disabled={busy} className="mt-3 w-full py-3.5">
        {busy ? 'Saving…' : 'Post review'}
      </Pill>
      {error && <p className="mt-2 text-[13px]" style={{ color: 'hsl(var(--neon-magenta))' }}>{error}</p>}
    </div>
  );
}

function CancelLink({ booking, role, onChanged }) {
  const [preview, setPreview] = useState(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const ask = async () => {
    setBusy(true);
    setError('');
    try {
      const response = await base44.functions.invoke('cancelBooking', { bookingId: booking.id, preview: true });
      setPreview(response.data || { allowed: false, message: 'This booking can’t be cancelled right now.' });
    } catch (e) {
      setPreview({ allowed: false, message: errorText(e, 'This booking can’t be cancelled right now.') });
    } finally {
      setBusy(false);
    }
  };

  const run = async () => {
    setBusy(true);
    setError('');
    try {
      const response = await base44.functions.invoke('cancelBooking', { bookingId: booking.id, reason });
      if (response.data?.error) throw new Error(response.data.error);
      setPreview(null);
      onChanged?.();
    } catch (e) {
      setError(errorText(e, 'That did not go through. Nothing was changed.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="text-center">
      <button
        type="button"
        onClick={ask}
        disabled={busy}
        className="min-h-[44px] px-4 text-[13px] text-white/45 underline-offset-4 transition-colors hover:text-white hover:underline disabled:opacity-50"
      >
        Cancel this booking
      </button>
      <ConfirmAction
        open={Boolean(preview)}
        title={preview?.allowed ? 'Cancel this booking?' : 'This booking can’t be cancelled here'}
        message={preview?.message || ''}
        confirmLabel={preview?.allowed ? 'Yes, cancel it' : 'OK'}
        busy={busy}
        error={error}
        onConfirm={preview?.allowed ? run : () => setPreview(null)}
        onCancel={() => setPreview(null)}
      >
        {preview?.allowed && (
          <textarea
            rows={2}
            value={reason}
            maxLength={500}
            onChange={(e) => setReason(e.target.value)}
            placeholder={role === 'client' ? 'Why? (optional, your creator sees this)' : 'Why? (optional, your client sees this)'}
            className={`${fieldClass} mt-4`}
          />
        )}
      </ConfirmAction>
    </div>
  );
}
