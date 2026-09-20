import React from 'react';
import BackButton from '@/components/shared/BackButton';

export default function LegalPage({ title, type, content, lastUpdated }) {
  const handleDownloadPdf = () => window.print();
  const paragraphs = content.split('\n').filter(Boolean);

  return (
    <div className="min-h-screen bg-ink text-white">
      <BackButton />

      <section className="px-6 md:px-14 pt-28 pb-14 border-b border-white/10">
        <div className="max-w-4xl mx-auto">
          <p className="label-mono text-[9px] mb-6" style={{ color: 'hsl(var(--neon-lime))' }}>Stelli Legal · {type}</p>
          <h1 className="font-heading font-semibold leading-[0.95] mb-6" style={{ fontSize: 'clamp(40px, 7vw, 88px)' }}>{title}</h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 justify-between">
            <p className="label-mono text-[10px] text-white/40">Last updated: {lastUpdated}</p>
            <button
              onClick={handleDownloadPdf}
              className="label-mono text-[10px] font-semibold px-6 py-3 transition-transform duration-300 hover:-translate-y-0.5"
              style={{ background: 'hsl(var(--neon-lime))', color: 'hsl(var(--ink))', borderRadius: 4 }}
            >
              Download PDF
            </button>
          </div>
        </div>
      </section>

      <section className="px-6 md:px-14 py-16">
        <article className="max-w-3xl mx-auto space-y-5">
          {paragraphs.map((paragraph, index) => {
            const isHeading = index < 4 || /^\d+\./.test(paragraph);
            return isHeading ? (
              <h2 key={index} className="font-heading text-2xl md:text-3xl font-semibold pt-5 text-white">{paragraph}</h2>
            ) : (
              <p key={index} className="font-body text-[14px] md:text-[15px] leading-[1.9] text-white/60">{paragraph}</p>
            );
          })}
        </article>
      </section>
    </div>
  );
}