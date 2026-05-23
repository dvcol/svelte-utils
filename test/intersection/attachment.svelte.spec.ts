import { flushSync } from 'svelte';
import { describe, expect, it } from 'vitest';

import { useIntersection } from '~/intersection/attachment.svelte.js';

import { mountAttachment } from '../helpers.svelte.js';

interface IntersectionObserverMock extends IntersectionObserver {
  observed: Set<Element>;
  init: IntersectionObserverInit;
  trigger: (entries: IntersectionObserverEntry[]) => void;
}

interface IntersectionObserverMockCtor {
  instances: IntersectionObserverMock[];
  new (cb: IntersectionObserverCallback, init?: IntersectionObserverInit): IntersectionObserverMock;
}

const Mock = (globalThis as unknown as { IntersectionObserverMock: IntersectionObserverMockCtor }).IntersectionObserverMock;

function entry(target: Element, isIntersecting: boolean): IntersectionObserverEntry {
  return { target, isIntersecting } as unknown as IntersectionObserverEntry;
}

describe('useIntersection', () => {
  it('exposes visible/entries/current as reactive state', () => {
    expect.assertions(3);
    const cleanup = $effect.root(() => {
      const intersection = useIntersection();
      const { unmount } = mountAttachment<HTMLElement>(intersection.observe);

      expect(intersection.visible.size).toBe(0);
      expect(intersection.entries.size).toBe(0);
      expect(intersection.current).toBeUndefined();
      unmount();
    });
    cleanup();
  });

  it('tracks multiple nodes via a single observer', () => {
    expect.assertions(3);
    const cleanup = $effect.root(() => {
      const intersection = useIntersection();
      const before = Mock.instances.length;
      const a = mountAttachment<HTMLElement>(intersection.observe);
      const b = mountAttachment<HTMLElement>(intersection.observe);

      expect(Mock.instances.length).toBe(before + 1);

      const instance = Mock.instances.at(-1)!;
      instance.trigger([entry(a.node, true), entry(b.node, true)]);

      expect(intersection.visible.has(a.node)).toBe(true);
      expect(intersection.visible.has(b.node)).toBe(true);

      a.unmount();
      b.unmount();
    });
    cleanup();
  });

  it('reflects intersection state via visible set; entries retain last record', () => {
    expect.assertions(3);
    const cleanup = $effect.root(() => {
      const intersection = useIntersection();
      const { node, unmount } = mountAttachment<HTMLElement>(intersection.observe);

      const instance = Mock.instances.at(-1)!;
      instance.trigger([entry(node, true)]);
      expect(intersection.visible.has(node)).toBe(true);

      instance.trigger([entry(node, false)]);
      expect(intersection.visible.has(node)).toBe(false);
      expect(intersection.entries.has(node)).toBe(true);

      unmount();
    });
    cleanup();
  });

  it('current is the most recent entry across batches', () => {
    expect.assertions(1);
    const cleanup = $effect.root(() => {
      const intersection = useIntersection();
      const { node, unmount } = mountAttachment<HTMLElement>(intersection.observe);

      const instance = Mock.instances.at(-1)!;
      const first = entry(node, true);
      const second = entry(node, false);
      instance.trigger([first]);
      instance.trigger([second]);

      expect(intersection.current).toStrictEqual(second);
      unmount();
    });
    cleanup();
  });

  it('re-creates the observer when an option getter changes', () => {
    expect.assertions(3);
    const cleanup = $effect.root(() => {
      let margin = $state('0px');
      const intersection = useIntersection({
        get rootMargin() {
          return margin;
        },
      });
      const { node, unmount } = mountAttachment<HTMLElement>(intersection.observe);

      const before = Mock.instances.at(-1)!;
      expect(before.init.rootMargin).toBe('0px');

      margin = '50%';
      flushSync();

      const after = Mock.instances.at(-1)!;
      expect(after).not.toBe(before);
      expect(after.observed.has(node)).toBe(true);

      unmount();
    });
    cleanup();
  });

  it('keeps current entry when batch is empty', () => {
    expect.assertions(2);
    const cleanup = $effect.root(() => {
      const intersection = useIntersection();
      const { node, unmount } = mountAttachment<HTMLElement>(intersection.observe);

      const instance = Mock.instances.at(-1)!;
      const first = entry(node, true);
      instance.trigger([first]);
      expect(intersection.current).toStrictEqual(first);

      instance.trigger([]);
      expect(intersection.current).toStrictEqual(first);

      unmount();
    });
    cleanup();
  });

  it('drops node visibility/entry on unmount', () => {
    expect.assertions(2);
    const cleanup = $effect.root(() => {
      const intersection = useIntersection();
      const { node, unmount } = mountAttachment<HTMLElement>(intersection.observe);

      const instance = Mock.instances.at(-1)!;
      instance.trigger([entry(node, true)]);
      unmount();

      expect(intersection.visible.has(node)).toBe(false);
      expect(intersection.entries.has(node)).toBe(false);
    });
    cleanup();
  });
});
