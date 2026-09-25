import React from 'react';
import PageShell from '@/components/shared/PageShell';
import SectionHeader from '@/components/shared/SectionHeader';

export default function LegalPage({ title, type, content, lastUpdated }) {
  const handleDownloadPdf = () => window.print();
  const paragraphs = content.split('\n').filter(Boolean);

  return (
    <PageShell width="reading">
      <SectionHeader
        eyebrow={`Stelli Legal · ${type}`}
        title={title}
        size="section"
        intro={`Last updated ${lastUpdated}.`}
        action={
          <button
            onClick={handleDownloadPdf}
            className="shrink-0 rounded-full border border-white/15 px-6 py-3 label-mono text-[10px] text-white/60 hover:text-white transition-colors"
          >
            Download PDF
          </button>
        }
      />

      <article className="mt-14 md:mt-16 border-t border-white/10 pt-10 space-y-5">
        {paragraphs.map((paragraph, index) => {
          const isHeading = index < 4 || /^\d+\./.test(paragraph);
          return isHeading ? (
            <h2 key={index} className="pt-5 text-[20px] md:text-[24px] font-semibold leading-snug text-white">
              {paragraph}
            </h2>
          ) : (
            <p key={index} className="text-[14px] md:text-[15px] leading-[1.9] text-white/55">
              {paragraph}
            </p>
          );
        })}
      </article>
    </PageShell>
  );
}