import { describe, expect, it } from 'vitest';

import { useResize } from '~/resize/attachment.svelte.js';
import { listeners } from '~/resize/shared.js';

import { mountAttachment } from '../helpers.svelte.js';

interface ResizeObserverMock extends ResizeObserver {
  observed: Set<Element>;
  trigger: (entries: ResizeObserverEntry[]) => void;
}

interface ResizeObserverMockCtor {
  instances: ResizeObserverMock[];
  new (cb: ResizeObserverCallback): ResizeObserverMock;
}

const Mock = (globalThis as unknown as { ResizeObserverMock: ResizeObserverMockCtor }).ResizeObserverMock;

describe('useResize', () => {
  it('exposes current and entries as reactive state', () => {
    expect.assertions(2);
    const cleanup = $effect.root(() => {
      const resize = useResize();
      const { node, unmount } = mountAttachment<HTMLElement>(resize.observe);

      expect(resize.entries).toEqual([]);
      expect(resize.current).toBeUndefined();
      void node;
      unmount();
    });
    cleanup();
  });

  it('updates entries/current when the observer dispatches a batch', () => {
    expect.assertions(2);
    const cleanup = $effect.root(() => {
      const resize = useResize();
      const { node, unmount } = mountAttachment<HTMLElement>(resize.observe);

      const instance = Mock.instances.at(-1)!;
      const entry = { target: node } as unknown as ResizeObserverEntry;
      instance.trigger([entry]);

      expect(resize.entries).toStrictEqual([entry]);
      expect(resize.current).toStrictEqual(entry);
      unmount();
    });
    cleanup();
  });

  it('clears the listener and unobserves on unmount', () => {
    expect.assertions(2);
    const cleanup = $effect.root(() => {
      const resize = useResize();
      const { node, unmount } = mountAttachment<HTMLElement>(resize.observe);

      const instance = Mock.instances.at(-1)!;
      unmount();

      expect(instance.observed.has(node)).toBe(false);
      expect(listeners.get(node)).toBeUndefined();
    });
    cleanup();
  });

  it('shares one observer instance across multiple mounts', () => {
    expect.assertions(1);
    const cleanup = $effect.root(() => {
      const a = useResize();
      const b = useResize();
      const ma = mountAttachment<HTMLElement>(a.observe);
      const before = Mock.instances.length;
      const mb = mountAttachment<HTMLElement>(b.observe);

      expect(Mock.instances.length).toBe(before);

      ma.unmount();
      mb.unmount();
    });
    cleanup();
  });
});
