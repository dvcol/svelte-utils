import { describe, expect, it, vi } from 'vitest';

import { getObserver, listeners } from '~/resize/shared.js';

interface ResizeObserverMock extends ResizeObserver {
  trigger: (entries: ResizeObserverEntry[]) => void;
}

const Mock = (globalThis as unknown as { ResizeObserverMock: { instances: ResizeObserverMock[] } }).ResizeObserverMock;

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

  it('groups multiple entries per target before dispatching to the listener', () => {
    expect.assertions(2);
    getObserver();
    const instance = Mock.instances.at(-1)!;

    const node = document.createElement('div');
    const listener = vi.fn();
    listeners.set(node, listener);

    const a = { target: node } as unknown as ResizeObserverEntry;
    const b = { target: node } as unknown as ResizeObserverEntry;
    instance.trigger([a, b]);

    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith([a, b]);
  });
});
