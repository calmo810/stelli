import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { format, formatDistanceToNow } from 'date-fns';
import { Loader2, Link2, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import { safeHref } from '@/lib/safeHref';
import Pill from '@/components/shared/Pill';
import { fieldClass } from '@/lib/glassField';

const stepPill = (active) => ({
  borderRadius: 980,
  borderColor: active ? 'hsl(var(--neon-lime))' : 'rgba(255,255,255,0.14)',
  background: active ? 'hsl(var(--neon-lime) / 0.12)' : 'transparent',
  color: active ? 'hsl(var(--neon-lime))' : 'rgba(255,255,255,0.6)',
});

/** Two delivery steps, the 48 hour window, and reporting a problem. */
export default function DeliveryCard({ booking, role, onChanged }) {
  const [link, setLink] = useState('');
  const [step, setStep] = useState('unedited');
  const [note, setNote] = useState('');
  const [reporting, setReporting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const paid = ['held', 'released'].includes(booking?.payment_status);
  const active = paid && ['confirmed', 'in_progress', 'awaiting_delivery', 'delivered'].includes(booking?.status);
  if (!active) return null;

  const delivered = Boolean(booking.delivered_at);
  const windowOpen = delivered && booking.release_due_at && new Date(booking.release_due_at) > new Date();

  const post = async () => {
    if (!link.trim()) {
      setError('Paste a link first.');
      return;
    }
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
    <div className="glass rounded-[26px] p-5 sm:p-6">
      <p className="text-[11px] font-semibold text-white/40">DELIVERY</p>

      <div className="mt-4 space-y-3">
        <div className="flex items-start gap-3">
          <ImageIcon className="mt-0.5 h-4 w-4 shrink-0 text-white/35" />
          <div className="min-w-0">
            <p className="text-[12px] text-white/45">Unedited set</p>
            {booking.unedited_link ? (
              <a
                href={safeHref(booking.unedited_link)}
                target="_blank"
                rel="noreferrer"
                className="text-[14px] break-all"
                style={{ color: 'hsl(var(--neon-cyan))' }}
              >
                {booking.unedited_link}
              </a>
            ) : (
              <p className="text-[14px] text-white/35">Not posted yet</p>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-white/35" />
          <div className="min-w-0">
            <p className="text-[12px] text-white/45">Final edits</p>
            {booking.delivery_link ? (
              <a
                href={safeHref(booking.delivery_link)}
                target="_blank"
                rel="noreferrer"
                className="text-[14px] break-all"
                style={{ color: 'hsl(var(--neon-lime))' }}
              >
                {booking.delivery_link}
              </a>
            ) : (
              <p className="text-[14px] text-white/35">Not posted yet</p>
            )}
          </div>
        </div>
      </div>

      {delivered && windowOpen && !booking.problem_reported_at && (
        <p className="mt-4 text-[12px] text-white/45">
          Payment releases {formatDistanceToNow(new Date(booking.release_due_at), { addSuffix: false })} from now
        </p>
      )}

      {booking.problem_reported_at && (
        <div
          className="mt-4 rounded-2xl px-4 py-3"
          style={{ background: 'hsl(var(--neon-magenta) / 0.08)', border: '1px solid hsl(var(--neon-magenta) / 0.4)' }}
        >
          <p className="text-[11px] font-semibold" style={{ color: 'hsl(var(--neon-magenta))' }}>
            PROBLEM REPORTED
          </p>
          <p className="mt-2 text-[14px] leading-relaxed text-white/75">{booking.problem_note}</p>
          <p className="mt-2 text-[13px] text-white/45">
            The payment stays held while a founder reviews it.
          </p>
        </div>
      )}

      {role === 'lensman' && (
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
            placeholder={step === 'unedited' ? 'Paste the unedited gallery link' : 'Paste the final edits link'}
            className={fieldClass}
          />

          <Pill as="button" type="button" tone="lime" onClick={post} disabled={busy} className="w-full py-4">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {step === 'unedited' ? 'Post unedited set' : 'Post final edits'}
          </Pill>
        </div>
      )}

      {role === 'client' && delivered && booking.payment_status === 'held' && !booking.problem_reported_at && (
        <>
          {reporting ? (
            <div className="mt-4 space-y-3">
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What went wrong?"
                className={fieldClass}
              />
              <div className="flex gap-2">
                <Pill as="button" type="button" tone="lime" onClick={report} disabled={busy} className="flex-1 py-3.5">
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  Send report
                </Pill>
                <Pill as="button" type="button" tone="glass" onClick={() => setReporting(false)}>
                  Cancel
                </Pill>
              </div>
            </div>
          ) : (
            <Pill
              as="button"
              type="button"
              tone="glass"
              onClick={() => setReporting(true)}
              className="mt-4"
            >
              <AlertTriangle className="h-4 w-4" /> Report a problem
            </Pill>
          )}
        </>
      )}

      {error && (
        <p className="mt-3 text-[13px]" style={{ color: 'hsl(var(--neon-magenta))' }}>
          {error}
        </p>
      )}
    </div>
  );
}