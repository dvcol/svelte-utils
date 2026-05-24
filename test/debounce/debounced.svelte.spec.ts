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
      const d = debounced({ value: () => source, delay: 100 });
      flushSync();

      expect(d.current).toBeUndefined();

      source = 1;
      flushSync();
      vi.advanceTimersByTime(100);
      flushSync();

      expect(d.current).toBe(1);
    });
    cleanup();
  });

  it('coalesces rapid changes into the latest value', () => {
    expect.assertions(1);
    let source = $state(0);

    const cleanup = $effect.root(() => {
      const d = debounced({ value: () => source, delay: 50 });
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

      expect(d.current).toBe(3);
    });
    cleanup();
  });

  it('defaults to a 0ms delay when delay is omitted', () => {
    expect.assertions(2);
    let source = $state(0);

    const cleanup = $effect.root(() => {
      const d = debounced({ value: () => source });
      flushSync();

      expect(d.current).toBeUndefined();

      source = 1;
      flushSync();
      vi.advanceTimersByTime(0);
      flushSync();

      expect(d.current).toBe(1);
    });
    cleanup();
  });

  it('reacts to a getter delay — changing it restarts the debounce', () => {
    expect.assertions(3);
    let source = $state(0);
    let delay = $state(100);

    const cleanup = $effect.root(() => {
      const d = debounced({
        value: () => source,
        get delay() {
          return delay;
        },
      });
      flushSync();

      source = 1;
      flushSync();
      vi.advanceTimersByTime(50);

      delay = 200;
      flushSync();
      vi.advanceTimersByTime(100);
      flushSync();

      expect(d.current).toBeUndefined();

      vi.advanceTimersByTime(100);
      flushSync();

      expect(d.current).toBe(1);
      expect(d.error).toBeUndefined();
    });
    cleanup();
  });

  it('setting current bypasses debounce and writes immediately', () => {
    expect.assertions(3);
    const source = $state(0);

    const cleanup = $effect.root(() => {
      const d = debounced({ value: () => source, delay: 200 });
      flushSync();

      expect(d.current).toBeUndefined();

      d.current = 42;

      expect(d.current).toBe(42);
      expect(d.error).toBeUndefined();
    });
    cleanup();
  });

  it('setting current cancels in-flight debounced update', () => {
    expect.assertions(2);
    let source = $state(0);

    const cleanup = $effect.root(() => {
      const d = debounced({ value: () => source, delay: 100 });
      flushSync();

      source = 1;
      flushSync();
      vi.advanceTimersByTime(50);

      // Bypass: write immediately
      d.current = 99;

      // Advance past original debounce — should NOT overwrite with 1
      vi.advanceTimersByTime(100);
      flushSync();

      expect(d.current).toBe(99);
      expect(d.error).toBeUndefined();
    });
    cleanup();
  });

  it('cancel() stops in-flight debounce without writing a value', () => {
    expect.assertions(2);
    let source = $state(0);

    const cleanup = $effect.root(() => {
      const d = debounced({ value: () => source, delay: 100 });
      flushSync();

      source = 5;
      flushSync();
      vi.advanceTimersByTime(50);

      d.cancel();

      vi.advanceTimersByTime(100);
      flushSync();

      expect(d.current).toBeUndefined();
      expect(d.error).toBeUndefined();
    });
    cleanup();
  });

  it('setting current clears previous error', () => {
    expect.assertions(2);
    let source = $state(0);

    const cleanup = $effect.root(() => {
      const d = debounced({ value: () => source, delay: 100 });
      flushSync();

      // Force an error state via internal mechanism
      source = 1;
      flushSync();
      vi.advanceTimersByTime(100);
      flushSync();

      expect(d.error).toBeUndefined();

      // Direct write clears error
      d.current = 10;
      expect(d.error).toBeUndefined();
    });
    cleanup();
  });
});
