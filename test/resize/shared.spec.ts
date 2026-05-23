import { describe, expect, it } from 'vitest';

import { getObserver, listeners } from '~/resize/shared.js';

describe('resize/shared', () => {
  it('returns the same observer instance across calls', () => {
    expect.assertions(1);
    const a = getObserver();
    const b = getObserver();
    expect(a).toBe(b);
  });

  it('exposes a WeakMap for listeners', () => {
    expect.assertions(1);
    expect(listeners).toBeInstanceOf(WeakMap);
  });
});
