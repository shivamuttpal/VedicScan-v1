import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Legal documents are bundled as raw strings (see craco.config.js `.md` rule) so they
// render on any host with no runtime fetch or static-file dependency.
import privacyMd from '../legal/privacy.md';
import termsMd from '../legal/terms.md';
import refundMd from '../legal/refund.md';
import dataDeletionMd from '../legal/data-deletion.md';
import cookiesMd from '../legal/cookies.md';
import disclaimerMd from '../legal/disclaimer.md';

const DOCS = {
  privacy: privacyMd,
  terms: termsMd,
  refund: refundMd,
  'data-deletion': dataDeletionMd,
  cookies: cookiesMd,
  disclaimer: disclaimerMd,
};

/**
 * Renders a bundled legal document by slug.
 *
 * A small, dependency-free Markdown renderer handles the subset of Markdown used
 * in our legal docs: headings, bold, links, unordered lists, GFM tables,
 * blockquotes, horizontal rules, and paragraphs.
 */

// ── Inline formatting: **bold**, [text](url), `code` ────────────────────────
function renderInline(text, keyPrefix) {
  const nodes = [];
  let remaining = text;
  let i = 0;
  // Ordered by scan; regex finds the earliest of the three token types.
  const tokenRe = /(\*\*([^*]+)\*\*)|(\[([^\]]+)\]\(([^)]+)\))|(`([^`]+)`)/;
  let match;
  while ((match = tokenRe.exec(remaining))) {
    const before = remaining.slice(0, match.index);
    if (before) nodes.push(<React.Fragment key={`${keyPrefix}-t${i++}`}>{before}</React.Fragment>);

    if (match[1]) {
      nodes.push(<strong key={`${keyPrefix}-b${i++}`} className="font-semibold text-maroon-700">{match[2]}</strong>);
    } else if (match[3]) {
      const url = match[5];
      const internal = url.startsWith('/');
      nodes.push(
        <a
          key={`${keyPrefix}-a${i++}`}
          href={url}
          {...(internal ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
          className="text-gold underline decoration-gold/40 hover:decoration-gold"
        >
          {match[4]}
        </a>
      );
    } else if (match[6]) {
      nodes.push(
        <code key={`${keyPrefix}-c${i++}`} className="px-1 py-0.5 rounded bg-amber-50 text-maroon-700 text-[0.9em]">
          {match[7]}
        </code>
      );
    }
    remaining = remaining.slice(match.index + match[0].length);
  }
  if (remaining) nodes.push(<React.Fragment key={`${keyPrefix}-t${i++}`}>{remaining}</React.Fragment>);
  return nodes;
}

// ── Block-level parser ──────────────────────────────────────────────────────
function renderMarkdown(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let idx = 0;

  const isTableSep = (s) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(s);
  const splitRow = (s) =>
    s.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());

  let key = 0;
  while (idx < lines.length) {
    let line = lines[idx];

    // Blank
    if (!line.trim()) { idx++; continue; }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      blocks.push(<hr key={key++} className="my-8 border-t border-amber-200" />);
      idx++;
      continue;
    }

    // Headings
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      const content = renderInline(h[2], `h${key}`);
      if (level === 1) blocks.push(<h1 key={key++} className="text-3xl sm:text-4xl font-bold font-playfair text-maroon-700 mt-2 mb-4">{content}</h1>);
      else if (level === 2) blocks.push(<h2 key={key++} className="text-2xl font-bold font-playfair text-maroon-700 mt-10 mb-3">{content}</h2>);
      else if (level === 3) blocks.push(<h3 key={key++} className="text-xl font-semibold text-maroon-600 mt-6 mb-2">{content}</h3>);
      else blocks.push(<h4 key={key++} className="text-lg font-semibold text-maroon-600 mt-4 mb-2">{content}</h4>);
      idx++;
      continue;
    }

    // Blockquote (collect consecutive)
    if (line.trim().startsWith('>')) {
      const quote = [];
      while (idx < lines.length && lines[idx].trim().startsWith('>')) {
        quote.push(lines[idx].replace(/^\s*>\s?/, ''));
        idx++;
      }
      blocks.push(
        <blockquote key={key++} className="my-4 border-l-4 border-gold bg-amber-50/60 px-4 py-3 rounded-r-lg text-sm text-gray-600">
          {quote.map((q, qi) => <p key={qi} className="mb-1 last:mb-0">{renderInline(q, `bq${key}-${qi}`)}</p>)}
        </blockquote>
      );
      continue;
    }

    // Table (header row followed by separator)
    if (line.trim().startsWith('|') && idx + 1 < lines.length && isTableSep(lines[idx + 1])) {
      const header = splitRow(line);
      idx += 2; // skip header + separator
      const rows = [];
      while (idx < lines.length && lines[idx].trim().startsWith('|')) {
        rows.push(splitRow(lines[idx]));
        idx++;
      }
      blocks.push(
        <div key={key++} className="my-5 overflow-x-auto">
          <table className="w-full text-sm border border-amber-200 rounded-lg overflow-hidden">
            <thead className="bg-maroon-700 text-white">
              <tr>{header.map((c, ci) => <th key={ci} className="text-left px-3 py-2 font-semibold">{renderInline(c, `th${key}-${ci}`)}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri} className={ri % 2 ? 'bg-amber-50/40' : 'bg-white'}>
                  {r.map((c, ci) => <td key={ci} className="px-3 py-2 align-top border-t border-amber-100 text-gray-700">{renderInline(c, `td${key}-${ri}-${ci}`)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Unordered list (collect consecutive `- ` items)
    if (/^\s*[-*]\s+/.test(line)) {
      const items = [];
      while (idx < lines.length && /^\s*[-*]\s+/.test(lines[idx])) {
        items.push(lines[idx].replace(/^\s*[-*]\s+/, ''));
        idx++;
      }
      blocks.push(
        <ul key={key++} className="my-4 ml-5 list-disc space-y-1.5 text-gray-700">
          {items.map((it, ii) => <li key={ii} className="leading-relaxed">{renderInline(it, `li${key}-${ii}`)}</li>)}
        </ul>
      );
      continue;
    }

    // Paragraph (collect consecutive non-blank, non-special lines)
    const para = [];
    while (
      idx < lines.length &&
      lines[idx].trim() &&
      !/^(#{1,4})\s+/.test(lines[idx]) &&
      !/^---+$/.test(lines[idx].trim()) &&
      !lines[idx].trim().startsWith('>') &&
      !lines[idx].trim().startsWith('|') &&
      !/^\s*[-*]\s+/.test(lines[idx])
    ) {
      para.push(lines[idx]);
      idx++;
    }
    blocks.push(
      <p key={key++} className="my-3 leading-relaxed text-gray-700">{renderInline(para.join(' '), `p${key}`)}</p>
    );
  }

  return blocks;
}

const LegalPage = ({ slug, title }) => {
  const content = DOCS[slug];

  useEffect(() => {
    document.title = `${title} · VedicScan`;
  }, [title]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/40 to-white flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {!content ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg">This document could not be found.</p>
            <a href="/" className="text-gold underline mt-3 inline-block">Return home</a>
          </div>
        ) : (
          <article className="legal-prose">{renderMarkdown(content)}</article>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default LegalPage;
