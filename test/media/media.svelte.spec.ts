import { describe, expect, it } from 'vitest';

import { useMedia } from '~/media/media.svelte.js';

describe('useMedia', () => {
  it('exposes a current boolean', () => {
    expect.assertions(1);
    const cleanup = $effect.root(() => {
      const media = useMedia('(min-width: 1px)');
      expect(typeof media.current).toBe('boolean');
    });
    cleanup();
  });

  it('honors the SSR fallback before subscription', () => {
    expect.assertions(1);
    const cleanup = $effect.root(() => {
      const media = useMedia('(min-width: 1px)', false);
      expect(typeof media.current).toBe('boolean');
    });
    cleanup();
  });
});
