import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, FileText, History, Loader2 } from 'lucide-react';
import CanvasGlow from '@/components/shared/CanvasGlow';
import GlassRows from '@/components/shared/GlassRows';
import Pill from '@/components/shared/Pill';
import StelliCheck from '@/components/shared/StelliCheck';

/** "Shoot date: 2026-11-20" reads as a label and a value; prose stays prose. */
const LABELLED_LINE = /^([^:.]{1,40}):\s+(.+)$/;

/**
 * The agreement text, laid out to read like a receipt. The words are the
 * stored text exactly, line for line: blocks split on blank lines, labelled
 * lines shown as label/value rows, every other line as a paragraph.
 */
function AgreementText({ text }) {
  const blocks = String(text || '')
    .split(/\n\s*\n/)
    .map((block) => block.split('\n').map((line) => line.trim()).filter(Boolean))
    .filter((block) => block.length);

  // A one-line opening block with no label is the document's own title.
  const first = blocks[0];
  const hasTitle = first && first.length === 1 && !LABELLED_LINE.test(first[0]) && first[0].length < 80;
  const title = hasTitle ? first[0] : null;
  const body = hasTitle ? blocks.slice(1) : blocks;

  return (
    <article className="glass rounded-[28px] px-5 py-6 sm:px-8 sm:py-8">
      {title && (
        <h2 className="font-display text-[22px] font-medium leading-tight text-white sm:text-[24px]">{title}</h2>
      )}
      {body.map((block, b) => (
        <div key={b} className={b || title ? 'mt-6' : ''}>
          {block.map((line, i) => {
            const match = line.match(LABELLED_LINE);
            if (match) {
              return (
                <div
                  key={i}
                  className={`flex items-baseline justify-between gap-4 py-2.5${i ? ' border-t border-white/[0.08]' : ''}`}
                >
                  <span className="shrink-0 text-[14px] text-white/50">{match[1]}</span>
                  <span className="text-right text-[15px] font-medium text-white">{match[2]}</span>
                </div>
              );
            }
            // A bracketed aside, like the note about the legal name, reads as a footnote.
            const aside = line.startsWith('(');
            return (
              <p
                key={i}
                className={`${aside ? 'pb-1 text-[13px] leading-snug text-white/45' : 'text-[15px] leading-[1.75] text-white/70'}${i ? ' mt-3' : ''}`}
              >
                {line}
              </p>
            );
          })}
        </div>
      ))}
    </article>
  );
}

export default function AgreementDetail() {
  const { contractId } = useParams();
  const [agreed, setAgreed] = useState(false);
  const queryClient = useQueryClient();

  const { data: contract, isLoading } = useQuery({
    queryKey: ['booking-contract', contractId],
    queryFn: () => base44.entities.BookingContract.get(contractId),
  });

  const acceptContract = useMutation({
    // Which side you are is decided on the server, from the booking.
    mutationFn: () => base44.functions.invoke('acceptBookingContract', { bookingId: contract.booking_id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['booking-contract', contractId] }),
  });

  const superseded = contract?.status === 'superseded';
  const needsCreatorAcceptance = contract && !superseded && !contract.creator_accepted_at;
  // The server says why an acceptance was refused (cancelled booking, not a party to it).
  const failure = /** @type {any} */ (acceptContract.error);
  const acceptError = acceptContract.isError
    ? failure?.response?.data?.error || 'That did not save. Try again.'
    : '';
  const parties = [contract?.creator_name, contract?.client_name].filter(Boolean).join(' and ');

  return (
    <div className="relative min-h-screen bg-ink">
      <CanvasGlow />
      <div className="relative mx-auto max-w-[720px] px-4 pb-24 pt-6 sm:px-5 md:pt-10">
        <h1
          className="font-display font-medium text-white"
          style={{ fontSize: 'clamp(36px, 5vw, 52px)', letterSpacing: '-0.025em', lineHeight: 1.02 }}
        >
          Booking agreement
        </h1>
        {contract && (parties || contract.shoot_date) && (
          <p className="mt-2.5 text-[15px] text-white/55">
            {[parties, contract.shoot_date].filter(Boolean).join(' · ')}
          </p>
        )}

        <div className="mt-7">
          {isLoading ? (
            <div className="glass h-96 animate-pulse rounded-[28px]" />
          ) : contract ? (
            <>
              <AgreementText text={contract.contract_text} />

              {needsCreatorAcceptance ? (
                <div className="glass mt-4 rounded-3xl p-4 sm:p-5">
                  <StelliCheck checked={agreed} onChange={setAgreed}>
                    I agree to this booking agreement and Stelli's{' '}
                    <Link to="/terms" className="text-white underline underline-offset-2 hover:text-neon-lime">
                      Terms and Conditions
                    </Link>
                    .
                  </StelliCheck>
                  {acceptError && (
                    <p role="alert" className="mt-3 text-[14px] leading-snug" style={{ color: 'hsl(var(--neon-magenta))' }}>
                      {acceptError}
                    </p>
                  )}
                  <Pill
                    as="button"
                    type="button"
                    tone="lime"
                    onClick={() => acceptContract.mutate()}
                    disabled={!agreed || acceptContract.isPending}
                    className="mt-5 h-12 w-full sm:w-auto sm:px-8"
                  >
                    {acceptContract.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Accept agreement
                  </Pill>
                </div>
              ) : (
                <p className="mt-4 flex items-start gap-2.5 pl-1.5 text-[14px] leading-snug text-white/60">
                  {superseded ? (
                    <History className="mt-px h-4 w-4 shrink-0 text-white/45" />
                  ) : (
                    <CheckCircle2 className="mt-px h-4 w-4 shrink-0 text-neon-lime" />
                  )}
                  {superseded
                    ? 'A newer quote replaced this agreement. It is kept here for the record.'
                    : 'This agreement has been accepted and is read-only.'}
                </p>
              )}
            </>
          ) : (
            <div className="glass flex min-h-[240px] flex-col items-center justify-center rounded-[28px] px-5 py-7 text-center">
              <span className="grid h-[52px] w-[52px] place-items-center rounded-2xl bg-white/[0.08] text-white/70">
                <FileText className="h-6 w-6" strokeWidth={1.7} />
              </span>
              <h2 className="mt-3.5 font-display text-[24px] font-medium text-white">Agreement not found.</h2>
              <p className="mt-1.5 max-w-[320px] text-[15px] leading-snug text-white/60">
                Your agreements are listed in your portal.
              </p>
            </div>
          )}
        </div>

        <GlassRows className="mt-8" rows={[{ label: 'Back to your portal', to: '/portal' }]} />
      </div>
    </div>
  );
}
