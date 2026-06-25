import { describe, expect, it } from 'vitest';
import { buildEmbedSnippet } from '@/features/build-contact-form/lib/embed-snippet';

describe('buildEmbedSnippet', () => {
  it('falls back to plain /embed.js (no integrity) without a manifest', () => {
    const s = buildEmbedSnippet('https://contact.example.com', 'abc123', 'modal', null);
    expect(s).toContain('src="https://contact.example.com/embed.js"');
    expect(s).toContain('data-form="abc123"');
    expect(s).toContain('data-trigger="modal"');
    expect(s).not.toContain('integrity');
    expect(s).not.toContain('crossorigin');
  });

  it('uses the hashed filename + SRI + crossorigin when a manifest is present', () => {
    const s = buildEmbedSnippet('https://contact.example.com', 'abc123', 'chat', {
      file: 'embed/embed.281342b5743e.js',
      integrity: 'sha384-XYZ',
    });
    expect(s).toContain('src="https://contact.example.com/embed/embed.281342b5743e.js"');
    expect(s).toContain('integrity="sha384-XYZ"');
    expect(s).toContain('crossorigin="anonymous"');
    expect(s).toContain('data-trigger="chat"');
  });
});
