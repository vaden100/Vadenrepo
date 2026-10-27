import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Markdown } from './markdown';

describe('Markdown', () => {
  it('renders the subset', () => {
    const html = renderToStaticMarkup(
      <Markdown source={'## Hi\n\nSome **bold** and [a link](/x).\n\n- one\n- two'} />,
    );
    expect(html).toContain('<h2>Hi</h2>');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('href="/x"');
    expect(html).toContain('<li>two</li>');
  });
  it('never renders raw HTML', () => {
    const html = renderToStaticMarkup(<Markdown source={'<script>alert(1)</script>'} />);
    expect(html).not.toContain('<script>');
  });
});
