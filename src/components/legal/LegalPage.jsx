import React from 'react';

export default function LegalPage({ title, type, content, lastUpdated }) {
  const handleDownloadPdf = () => window.print();
  const paragraphs = content.split('\n').filter(Boolean);

  return (
    <div className="min-h-screen bg-[#10182d] text-[#f0ede6]">
      <section className="px-6 md:px-14 pt-24 pb-16 border-b" style={{ borderColor: 'rgba(242,220,169,0.16)' }}>
        <div className="max-w-4xl mx-auto">
          <p className="text-[8px] font-body tracking-[0.45em] uppercase mb-6" style={{ color: 'rgba(242,220,169,0.55)' }}>Stelli Legal · {type}</p>
          <h1 className="font-display font-semibold leading-none mb-6" style={{ fontSize: 'clamp(44px, 7vw, 92px)' }}>{title}</h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 justify-between">
            <p className="text-[11px] font-body tracking-[0.18em] uppercase" style={{ color: 'rgba(240,237,230,0.42)' }}>Last updated: {lastUpdated}</p>
            <button onClick={handleDownloadPdf} className="px-6 py-3 text-[10px] font-body tracking-[0.18em] uppercase font-semibold rounded-full" style={{ background: '#F2DCA9', color: '#10182d' }}>Download PDF</button>
          </div>
        </div>
      </section>
      <section className="px-6 md:px-14 py-16">
        <article className="max-w-3xl mx-auto space-y-5 print:text-black">
          {paragraphs.map((paragraph, index) => {
            const isHeading = index < 4 || /^\d+\./.test(paragraph);
            return isHeading ? (
              <h2 key={index} className="font-display text-2xl md:text-3xl font-semibold pt-5" style={{ color: '#F2DCA9' }}>{paragraph}</h2>
            ) : (
              <p key={index} className="font-body text-[14px] md:text-[15px] leading-[1.9]" style={{ color: 'rgba(240,237,230,0.72)' }}>{paragraph}</p>
            );
          })}
        </article>
      </section>
    </div>
  );
}