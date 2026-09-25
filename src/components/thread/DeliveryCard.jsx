import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { format, formatDistanceToNow } from 'date-fns';
import { Loader2, Link2, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import { safeHref } from '@/lib/safeHref';

const fieldClass =
  'w-full border border-white/10 bg-white/[0.03] px-4 py-3 font-body text-[14px] text-white outline-none transition-colors placeholder:text-white/25 focus:border-neon-lime focus:ring-1 focus:ring-neon-lime';

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
    <div className="border border-white/10 bg-surface p-5 sm:p-6" style={{ borderRadius: 4 }}>
      <p className="label-mono text-[9px] text-white/35 mb-4">Delivery</p>

      <div className="space-y-4 mb-5">
        <div className="flex items-start gap-3">
          <ImageIcon className="w-4 h-4 shrink-0 mt-0.5 text-white/30" />
          <div className="min-w-0">
            <p className="label-mono text-[9px] text-white/40 mb-1.5">UNEDITED SET</p>
            {booking.unedited_link ? (
              <a href={safeHref(booking.unedited_link)} target="_blank" rel="noreferrer" className="font-body text-[13px] break-all" style={{ color: 'hsl(var(--neon-cyan))' }}>
                {booking.unedited_link}
              </a>
            ) : (
              <p className="font-body text-[13px] text-white/35">Not posted yet</p>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Link2 className="w-4 h-4 shrink-0 mt-0.5 text-white/30" />
          <div className="min-w-0">
            <p className="label-mono text-[9px] text-white/40 mb-1.5">FINAL EDITS</p>
            {booking.delivery_link ? (
              <a href={safeHref(booking.delivery_link)} target="_blank" rel="noreferrer" className="font-body text-[13px] break-all" style={{ color: 'hsl(var(--neon-lime))' }}>
                {booking.delivery_link}
              </a>
            ) : (
              <p className="font-body text-[13px] text-white/35">Not posted yet</p>
            )}
          </div>
        </div>
      </div>

      {delivered && windowOpen && !booking.problem_reported_at && (
        <p className="label-mono text-[9px] text-white/40 mb-4">
          PAYMENT RELEASES {formatDistanceToNow(new Date(booking.release_due_at), { addSuffix: false }).toUpperCase()} FROM NOW
        </p>
      )}

      {booking.problem_reported_at && (
        <div className="border px-4 py-3 mb-4" style={{ borderColor: 'hsl(var(--neon-magenta) / 0.4)', background: 'hsl(var(--neon-magenta) / 0.06)', borderRadius: 4 }}>
          <p className="label-mono text-[9px] mb-2" style={{ color: 'hsl(var(--neon-magenta))' }}>PROBLEM REPORTED</p>
          <p className="font-body text-[13px] text-white/70 leading-relaxed">{booking.problem_note}</p>
          <p className="font-body text-[12px] text-white/40 mt-2">
            The payment stays held while a founder reviews it.
          </p>
        </div>
      )}

      {role === 'lensman' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            {[
              { value: 'unedited', label: 'Unedited set' },
              { value: 'final', label: 'Final edits' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setStep(option.value)}
                className="label-mono text-[9px] px-3 py-2 border"
                style={{
                  borderRadius: 3,
                  borderColor: step === option.value ? 'hsl(var(--neon-lime))' : 'rgba(255,255,255,0.12)',
                  color: step === option.value ? 'hsl(var(--neon-lime))' : 'rgba(255,255,255,0.45)',
                }}
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
          <button
            onClick={post}
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 py-3.5 label-mono text-[10px] font-semibold disabled:opacity-50"
            style={{ background: 'hsl(var(--neon-lime))', color: 'hsl(var(--ink))', borderRadius: 4 }}
          >
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {step === 'unedited' ? 'Post unedited set' : 'Post final edits'}
          </button>
        </div>
      )}

      {role === 'client' && delivered && booking.payment_status === 'held' && !booking.problem_reported_at && (
        <>
          {reporting ? (
            <div className="space-y-3">
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What went wrong?"
                className={fieldClass}
              />
              <div className="flex gap-2">
                <button onClick={report} disabled={busy} className="flex-1 flex items-center justify-center gap-2 py-3 label-mono text-[10px] font-semibold disabled:opacity-50" style={{ background: 'hsl(var(--neon-magenta))', color: 'hsl(var(--ink))', borderRadius: 4 }}>
                  {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Send report
                </button>
                <button onClick={() => setReporting(false)} className="px-5 label-mono text-[10px] text-white/40 border border-white/12" style={{ borderRadius: 4 }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setReporting(true)}
              className="flex items-center gap-2 label-mono text-[10px] text-white/45 hover:text-white border border-white/12 px-4 py-3"
              style={{ borderRadius: 4 }}
            >
              <AlertTriangle className="w-3.5 h-3.5" /> Report a problem
            </button>
          )}
        </>
      )}

      {error && (
        <p className="font-body text-[12px] mt-3" style={{ color: 'hsl(var(--neon-magenta))' }}>
          {error}
        </p>
      )}
    </div>
  );
}