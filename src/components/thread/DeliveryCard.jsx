import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, Link2, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import { safeHref } from '@/lib/safeHref';
import Pill from '@/components/shared/Pill';
import DeliveryPhotos from '@/components/thread/DeliveryPhotos';
import { fieldClass } from '@/lib/glassField';
import { effectiveStatus, shootPassed } from '@/lib/bookingNextStep';

const stepPill = (active) => ({
  borderRadius: 980,
  borderColor: active ? 'var(--fg)' : 'var(--line-2)',
  background: active ? 'var(--fill-2)' : 'transparent',
  color: active ? 'var(--fg)' : 'var(--fg-2)',
});

/** Two delivery steps, the 48 hour window, and reporting a problem. */
export default function DeliveryCard({ booking, role, onChanged }) {
  const [link, setLink] = useState('');
  const [step, setStep] = useState('unedited');
  const [note, setNote] = useState('');
  const [reporting, setReporting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const paid = ['held', 'released', 'partially_refunded'].includes(booking?.payment_status);
  const active =
    paid && ['confirmed', 'in_progress', 'awaiting_delivery', 'delivered', 'completed'].includes(effectiveStatus(booking));
  if (!active) return null;

  const delivered = Boolean(booking.delivered_at);
  const windowOpen = delivered && booking.release_due_at && new Date(booking.release_due_at) > new Date();

  const post = async () => {
    setBusy(true);
    setError('');
    try {
      const response = await base44.functions.invoke('markDelivered', {
        bookingId: booking.id,
        deliveryLink: link,
        step,
      });
      if (response.data?.error) {
        setError(response.data.error);
        return;
      }
      setLink('');
      onChanged?.();
    } catch (e) {
      setError(e?.response?.data?.error || 'That link did not save.');
    } finally {
      setBusy(false);
    }
  };

  const report = async () => {
    if (!note.trim()) {
      setError('Tell us what went wrong.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const response = await base44.functions.invoke('reportBookingProblem', {
        bookingId: booking.id,
        note,
      });
      if (response.data?.error) {
        setError(response.data.error);
        return;
      }
      setReporting(false);
      setNote('');
      onChanged?.();
    } catch (e) {
      setError(e?.response?.data?.error || 'That report did not send.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="st-card rounded-[26px] p-5 sm:p-6">
      <p className="text-[11px] font-semibold text-fg-3">DELIVERY</p>

      <div className="mt-4 space-y-3">
        <div className="flex items-start gap-3">
          <ImageIcon className="mt-0.5 h-4 w-4 shrink-0 text-fg-3" />
          <div className="min-w-0">
            <p className="text-[12px] text-fg-3">Unedited set</p>
            {booking.unedited_link ? (
              <a
                href={safeHref(booking.unedited_link)}
                target="_blank"
                rel="noreferrer"
                className="text-[14px] break-all"
                style={{ color: 'var(--st-accent)' }}
              >
                {booking.unedited_link}
              </a>
            ) : (
              <p className="text-[14px] text-fg-3">Not posted yet</p>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-fg-3" />
          <div className="min-w-0">
            <p className="text-[12px] text-fg-3">Final edits</p>
            {booking.delivery_link ? (
              <a
                href={safeHref(booking.delivery_link)}
                target="_blank"
                rel="noreferrer"
                className="text-[14px] break-all"
                style={{ color: 'var(--st-accent)' }}
              >
                {booking.delivery_link}
              </a>
            ) : (
              <p className="text-[14px] text-fg-3">Not posted yet</p>
            )}
          </div>
        </div>
      </div>

      <DeliveryPhotos booking={booking} role={role} onChanged={onChanged} />

      {delivered && windowOpen && !booking.problem_reported_at && (
        <p className="mt-4 text-[12px] text-fg-3">
          {role === 'client'
            ? `You have ${formatDistanceToNow(new Date(booking.release_due_at))} to report a problem. After that the payment goes to your creator.`
            : `Your payment is released in ${formatDistanceToNow(new Date(booking.release_due_at))}.`}
        </p>
      )}

      {booking.problem_reported_at && (
        <div
          className="mt-4 rounded-2xl px-4 py-3"
          style={{ background: 'var(--chip-magenta-bg)', border: '1px solid var(--chip-magenta-fg)' }}
        >
          <p className="text-[11px] font-semibold" style={{ color: 'var(--danger)' }}>
            PROBLEM REPORTED
          </p>
          <p className="mt-2 text-[14px] leading-relaxed text-fg-2">{booking.problem_note}</p>
          <p className="mt-2 text-[13px] text-fg-3">
            The payment stays held while a founder reviews it.
          </p>
        </div>
      )}

      {role === 'lensman' && !delivered && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'unedited', label: 'Unedited set' },
              { value: 'final', label: 'Final edits' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setStep(option.value)}
                aria-pressed={step === option.value}
                className="rounded-[980px] border px-4 py-2.5 text-[14px] transition-colors"
                style={stepPill(step === option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>

          <input
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="Gallery link (optional)"
            className={fieldClass}
          />
          <p className="text-[12px] leading-relaxed text-fg-3">
            {step === 'unedited'
              ? 'Photos you add above reach your client on their own. A link is optional.'
              : 'Photos you add above are delivered to your client. A link is optional.'}
          </p>

          <Pill as="button" type="button" tone="lime" onClick={post} disabled={busy} className="w-full py-4">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {step === 'unedited' ? 'Post unedited set' : 'Post final edits'}
          </Pill>
        </div>
      )}

      {role === 'client' &&
        (delivered || shootPassed(booking)) &&
        booking.payment_status === 'held' &&
        !booking.problem_reported_at && (
        <>
          {reporting ? (
            <div className="mt-4 space-y-3">
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={delivered ? 'What went wrong?' : 'What happened? If your creator didn’t show, say so.'}
                className={fieldClass}
              />
              <div className="flex gap-2">
                <Pill as="button" type="button" tone="lime" onClick={report} disabled={busy} className="flex-1 py-3.5">
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  Send report
                </Pill>
                <Pill as="button" type="button" tone="soft" onClick={() => setReporting(false)}>
                  Cancel
                </Pill>
              </div>
            </div>
          ) : (
            <Pill
              as="button"
              type="button"
              tone="soft"
              onClick={() => setReporting(true)}
              className="mt-4"
            >
              <AlertTriangle className="h-4 w-4" /> Report a problem
            </Pill>
          )}
        </>
      )}

      {error && (
        <p className="mt-3 text-[13px]" style={{ color: 'var(--danger)' }}>
          {error}
        </p>
      )}
    </div>
  );
}