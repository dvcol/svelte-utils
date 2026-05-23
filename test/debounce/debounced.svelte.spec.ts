import { flushSync } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { debounced } from '~/debounce/debounced.svelte.js';

describe('debounced', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('delays state updates by the configured delay', () => {
    expect.assertions(2);
    let source = $state(0);

    const cleanup = $effect.root(() => {
      const get = debounced(() => source, 100);
      flushSync();

      expect(get()).toBeUndefined();

      source = 1;
      flushSync();
      vi.advanceTimersByTime(100);
      flushSync();

      expect(get()).toBe(1);
    });
    cleanup();
  });

  it('coalesces rapid changes into the latest value', () => {
    expect.assertions(1);
    let source = $state(0);

    const cleanup = $effect.root(() => {
      const get = debounced(() => source, 50);
      flushSync();

      source = 1;
      flushSync();
      vi.advanceTimersByTime(20);
      source = 2;
      flushSync();
      vi.advanceTimersByTime(20);
      source = 3;
      flushSync();
      vi.advanceTimersByTime(60);
      flushSync();

      expect(get()).toBe(3);
    });
    cleanup();
  });
});
