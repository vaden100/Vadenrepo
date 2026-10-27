import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * A small Markdown subset for long-form content we write ourselves (legal drafts, guides):
 * ## and ### headings, paragraphs, "- " lists, **bold**, [links](/path). The page supplies the h1.
 * Raw HTML is never rendered.
 */
function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) out.push(<strong key={`${key}-${i++}`}>{m[1]}</strong>);
    else {
      const href = m[3]!;
      out.push(
        href.startsWith('/') ? (
          <Link key={`${key}-${i++}`} href={href}>
            {m[2]}
          </Link>
        ) : (
          <a key={`${key}-${i++}`} href={href}>
            {m[2]}
          </a>
        ),
      );
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ source }: { source: string }) {
  const blocks = source.trim().split(/\n\s*\n/);
  return (
    <div className="prose">
      {blocks.map((block, b) => {
        const lines = block.split('\n');
        const key = `b${b}`;
        if (block.startsWith('### ')) return <h3 key={key}>{inline(block.slice(4), key)}</h3>;
        if (block.startsWith('## ')) return <h2 key={key}>{inline(block.slice(3), key)}</h2>;
        if (lines.every((l) => l.startsWith('- ')))
          return (
            <ul key={key}>
              {lines.map((l, i) => (
                <li key={i}>{inline(l.slice(2), `${key}-${i}`)}</li>
              ))}
            </ul>
          );
        return <p key={key}>{inline(lines.join(' '), key)}</p>;
      })}
    </div>
  );
}
