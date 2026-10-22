import React from 'react';
import PageShell from '@/components/shared/PageShell';
import SectionHeader from '@/components/shared/SectionHeader';

/** A paragraph written as "a | b | c" is a table row; consecutive ones form one table. */
function toBlocks(paragraphs) {
  const blocks = [];
  for (const text of paragraphs) {
    if (text.includes(' | ')) {
      const row = text.split(' | ').map((cell) => cell.trim());
      const last = blocks[blocks.length - 1];
      if (last && last.rows) last.rows.push(row);
      else blocks.push({ rows: [row] });
    } else {
      blocks.push({ text });
    }
  }
  // A lone "a | b" line is prose, not a table — only runs of two or more rows are.
  return blocks.map((block) =>
    block.rows && block.rows.length > 1
      ? block
      : { text: block.rows ? block.rows[0].join(' | ') : block.text }
  );
}

export default function LegalPage({ title, type, content, lastUpdated }) {
  const handleDownloadPdf = () => window.print();
  const blocks = toBlocks(content.split('\n').filter(Boolean));

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
        {blocks.map((block, index) => {
          if (block.rows) {
            const [header, ...body] = block.rows;
            return (
              <div key={index} className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-[13px] md:text-[14px]">
                  <thead>
                    <tr>
                      {header.map((cell, column) => (
                        <th
                          key={column}
                          className="border-b border-white/15 py-3 pr-4 font-semibold text-white"
                        >
                          {cell}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {body.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((cell, column) => (
                          <td
                            key={column}
                            className="border-b border-white/10 py-3 pr-4 align-top leading-relaxed text-white/55"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }

          // The document's own header lines are short. Numbered sections ("1. ")
          // are headings; numbered clauses ("1.1 ") are body text.
          const isHeading = (index < 4 && block.text.length < 80) || /^\d+\.\s/.test(block.text);
          return isHeading ? (
            <h2
              key={index}
              className="pt-5 text-[20px] md:text-[24px] font-semibold leading-snug text-white"
            >
              {block.text}
            </h2>
          ) : (
            <p key={index} className="text-[14px] md:text-[15px] leading-[1.9] text-white/55">
              {block.text}
            </p>
          );
        })}
      </article>
    </PageShell>
  );
}