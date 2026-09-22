import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import BookingSummary from '@/components/dashboard/BookingSummary';

const LIME = 'hsl(var(--neon-lime))';
const INK = 'hsl(var(--ink))';

const EMPTY_FORM = {
  event_date: '',
  event_time: '',
  location: '',
  event_type: '',
  client_name: '',
  client_email: '',
  client_phone: '',
  event_description: '',
};

// Drafts belong to the account that typed them, so a shared browser never
// restores one person's details into someone else's request.
function draftKey(lensmanId, viewerKey) {
  return `stelli_booking_draft_${lensmanId}_${viewerKey}`;
}

function getBookingDraft(lensmanId, viewerKey) {
  try {
    return JSON.parse(localStorage.getItem(draftKey(lensmanId, viewerKey)) || '{}');
  } catch {
    return {};
  }
}

const fieldClass =
  'w-full border border-white/10 bg-white/[0.03] px-4 py-3 font-body text-[14px] text-white outline-none transition-colors placeholder:text-white/25 focus:border-neon-lime focus:ring-1 focus:ring-neon-lime';

function Field({ label, optional, children }) {
  return (
    <label className="block">
      <span className="block label-mono text-[10px] text-white/40 mb-2.5">
        {label}
        {optional && <span className="text-white/20"> · optional</span>}
      </span>
      {children}
    </label>
  );
}

export default function BookingFlow() {
  const { lensmanId } = useParams();
  const [sent, setSent] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [draftReady, setDraftReady] = useState(false);

  const { data: creator } = useQuery({
    queryKey: ['booking-creator', lensmanId],
    queryFn: async () => {
      const list = await base44.entities.Lensman.filter({ id: lensmanId });
      return list[0] || null;
    },
  });

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['booking-user'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    },
    retry: false,
  });

  const viewerKey = user?.id || 'guest';

  useEffect(() => {
    if (userLoading) return;
    const saved = getBookingDraft(lensmanId, viewerKey).form || {};
    setForm({
      ...EMPTY_FORM,
      ...saved,
      client_name: saved.client_name || user?.profile_name || user?.full_name || '',
      client_email: saved.client_email || user?.email || '',
    });
    setDraftReady(true);
  }, [userLoading, viewerKey, lensmanId]);

  useEffect(() => {
    if (!draftReady) return;
    localStorage.setItem(draftKey(lensmanId, viewerKey), JSON.stringify({
      form,
      currentStep: 'request',
    }));
  }, [form, lensmanId, viewerKey, draftReady]);

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const sendRequest = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('submitBookingRequest', {
        lensmanId,
        eventDate: form.event_date,
        eventTime: form.event_time,
        location: form.location,
        eventType: form.event_type,
        clientName: form.client_name,
        clientEmail: form.client_email,
        clientPhone: form.client_phone,
        brief: form.event_description,
      });
      return response.data;
    },
    onSuccess: (data) => {
      localStorage.removeItem(draftKey(lensmanId, viewerKey));
      setSent(data?.booking || null);
    },
  });

  if (!creator) {
    return (
      <div className="min-h-screen bg-ink">
        <div className="max-w-[1400px] mx-auto px-5 md:px-10 pt-32 pb-24">
          <div className="h-[420px] border border-white/10" style={{ borderRadius: 4 }} />
        </div>
      </div>
    );
  }

  const firstName = (creator.display_name || creator.full_name || '').split(' ')[0];
  const heroImage = creator.portfolio_images?.[0] || creator.profile_image;
  const canSend = form.event_date && form.client_name && form.client_email && form.client_phone;

  return (
    <div className="min-h-screen bg-ink">
      <div className="max-w-[1400px] mx-auto px-5 md:px-10 pt-28 pb-24">
        <div className="grid lg:grid-cols-[1fr_1.05fr] gap-10 lg:gap-16 items-start">

          <aside className="lg:sticky lg:top-24">
            <Link
              to={`/creators/${creator.id}`}
              className="inline-flex items-center gap-2 label-mono text-[10px] text-white/35 hover:text-neon-lime transition-colors mb-6 lg:mb-8"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to profile
            </Link>

            {heroImage && (
              <div className="overflow-hidden h-[190px] lg:h-[520px] mb-6" style={{ borderRadius: 4 }}>
                <img src={heroImage} alt={creator.full_name} className="w-full h-full object-cover" />
              </div>
            )}

            <h1
              className="font-heading font-semibold text-white leading-[0.95] mb-4"
              style={{ fontSize: 'clamp(30px, 5vw, 58px)' }}
            >
              {creator.full_name}
            </h1>
            <p className="label-mono text-[10px]" style={{ color: 'hsl(var(--neon-cyan))' }}>
              {creator.market || 'NYC'} · {creator.specialties?.join(' / ') || 'Photography'}
            </p>
          </aside>

          <div>
            {sent ? (
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <h2
                  className="font-heading font-semibold text-white leading-[0.95] mb-5"
                  style={{ fontSize: 'clamp(36px, 5vw, 64px)' }}
                >
                  Sent.
                </h2>
                <p className="font-body text-[15px] leading-relaxed text-white/55 mb-7 max-w-md">
                  {firstName} will message you to work out the details, then send a quote.
                </p>
                <BookingSummary booking={sent} className="mb-8" />
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    to={`/messages/${sent.id}`}
                    className="label-mono text-[11px] font-semibold px-8 py-4 text-center transition-transform duration-300 hover:-translate-y-0.5"
                    style={{ background: LIME, color: INK, borderRadius: 4 }}
                  >
                    Open messages
                  </Link>
                  <Link
                    to="/creators"
                    className="label-mono text-[11px] px-8 py-4 text-center border transition-colors duration-300 hover:border-white/40"
                    style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', borderRadius: 4 }}
                  >
                    Keep browsing
                  </Link>
                </div>
              </motion.div>
            ) : (
              <div>
                <h2
                  className="font-heading font-semibold text-white leading-[0.95] mb-5"
                  style={{ fontSize: 'clamp(36px, 5vw, 64px)' }}
                >
                  Book {firstName}.
                </h2>
                <p className="font-body text-[15px] leading-relaxed text-white/55 mb-10 max-w-md">
                  Send a date. Work out the details together. Nothing is charged until you accept a quote.
                </p>

                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field label="Date">
                      <input
                        type="date"
                        value={form.event_date}
                        onChange={e => update('event_date', e.target.value)}
                        className={fieldClass}
                      />
                    </Field>
                    <Field label="Start time" optional>
                      <input
                        type="time"
                        value={form.event_time}
                        onChange={e => update('event_time', e.target.value)}
                        className={fieldClass}
                      />
                    </Field>
                  </div>

                  <Field label="Where" optional>
                    <input
                      type="text"
                      placeholder="Neighborhood or address"
                      value={form.location}
                      onChange={e => update('location', e.target.value)}
                      className={fieldClass}
                    />
                  </Field>

                  <Field label="Shoot type" optional>
                    <input
                      type="text"
                      placeholder="Portraits, birthday dinner, brand content"
                      value={form.event_type}
                      onChange={e => update('event_type', e.target.value)}
                      className={fieldClass}
                    />
                  </Field>

                  <Field label="Name">
                    <input
                      type="text"
                      value={form.client_name}
                      onChange={e => update('client_name', e.target.value)}
                      className={fieldClass}
                    />
                  </Field>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field label="Email">
                      <input
                        type="email"
                        value={form.client_email}
                        onChange={e => update('client_email', e.target.value)}
                        className={fieldClass}
                      />
                    </Field>
                    <Field label="Phone">
                      <input
                        type="tel"
                        value={form.client_phone}
                        onChange={e => update('client_phone', e.target.value)}
                        className={fieldClass}
                      />
                    </Field>
                  </div>

                  <Field label="Anything to know?" optional>
                    <input
                      type="text"
                      placeholder="Birthday dinner, 20 people, want some video too"
                      value={form.event_description}
                      onChange={e => update('event_description', e.target.value)}
                      className={fieldClass}
                    />
                  </Field>
                </div>

                <div className="sticky bottom-0 z-10 mt-9 pt-5 pb-3 bg-ink/95 backdrop-blur">
                  <button
                    onClick={() => sendRequest.mutate()}
                    disabled={!canSend || sendRequest.isPending}
                    className="w-full flex items-center justify-center gap-2.5 label-mono text-[11px] font-semibold px-8 py-4 transition-transform duration-300 hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
                    style={{ background: LIME, color: INK, borderRadius: 4 }}
                  >
                    {sendRequest.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    Send request
                  </button>
                  <p className="label-mono text-[10px] text-white/35 mt-3">Details can come later in messages.</p>
                </div>

                {sendRequest.isError && (
                  <p className="font-body text-[13px] mt-5" style={{ color: LIME }}>
                    {sendRequest.error?.response?.data?.error || 'We could not send your request. Please try again.'}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}