import { flushSync, tick } from 'svelte';
import { describe, expect, it, vi } from 'vitest';

import { doubleBind, effect, useEffect, watch } from '~/watch/watch.svelte.js';

describe('watch utilities', () => {
  describe('useEffect', () => {
    it('skips runs while until() is true', () => {
      expect.assertions(1);
      const change = vi.fn();
      const isReady = false;
      const fn = useEffect(change, () => 0, { until: () => !isReady });

      const cleanup = $effect.root(() => {
        $effect(fn);
        flushSync();
      });

      expect(change).not.toHaveBeenCalled();
      cleanup();
    });

    it('runs next() on the following tick', async () => {
      expect.assertions(1);
      const next = vi.fn();
      const value = $state(0);
      const fn = useEffect(() => {}, () => value, { next });

      const cleanup = $effect.root(() => {
        $effect(fn);
        flushSync();
      });

      await tick();
      expect(next).toHaveBeenCalled();
      cleanup();
    });

    it('skips next() when the effect re-runs before tick resolves', async () => {
      expect.assertions(1);
      const next = vi.fn();
      const value = $state(0);
      const fn = useEffect(() => {}, () => value, { next });

      const cleanup = $effect.root(() => {
        $effect(fn);
        flushSync();
      });
      cleanup();

      await tick();
      expect(next).not.toHaveBeenCalled();
    });

    it('runs the change callback when sources change', () => {
      expect.assertions(1);
      const change = vi.fn();
      let value = $state(0);
      const fn = useEffect(change, () => value);

      const cleanup = $effect.root(() => {
        $effect(fn);
        flushSync();
        value = 1;
        flushSync();
      });

      expect(change).toHaveBeenCalled();
      cleanup();
    });
  });

  describe('watch / effect', () => {
    it('runs when sources change', () => {
      expect.assertions(1);
      const change = vi.fn();
      let value = $state(0);

      const cleanup = $effect.root(() => {
        watch(change, () => value);
        flushSync();
        value = 1;
        flushSync();
      });

      expect(change).toHaveBeenCalled();
      cleanup();
    });

    it('effect() runs in tracked scope by default', () => {
      expect.assertions(1);
      const change = vi.fn();

      const cleanup = $effect.root(() => {
        effect(change);
        flushSync();
      });

      expect(change).toHaveBeenCalled();
      cleanup();
    });
  });

  describe('doubleBind', () => {
    it('runs input/output only when values diverge', () => {
      expect.assertions(2);
      let outer = $state(1);
      let inner = $state(1);
      const input = vi.fn();
      const output = vi.fn();

      const cleanup = $effect.root(() => {
        doubleBind({
          outer: () => outer,
          inner: () => inner,
          input,
          output,
        });
        flushSync();

        outer = 2;
        flushSync();
        inner = 3;
        flushSync();
      });

      expect(input).toHaveBeenCalled();
      expect(output).toHaveBeenCalled();
      cleanup();
    });
  });
});
