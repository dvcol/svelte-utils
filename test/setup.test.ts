import { vi } from 'vitest';

import '@testing-library/jest-dom/vitest';

class ResizeObserverMock implements ResizeObserver {
  static instances: ResizeObserverMock[] = [];
  callback: ResizeObserverCallback;
  observed = new Set<Element>();

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    ResizeObserverMock.instances.push(this);
  }

  observe(target: Element) {
    this.observed.add(target);
  }

  unobserve(target: Element) {
    this.observed.delete(target);
  }

  disconnect() {
    this.observed.clear();
  }

  trigger(entries: ResizeObserverEntry[]) {
    this.callback(entries, this);
  }
}

vi.stubGlobal('ResizeObserver', ResizeObserverMock);
(globalThis as unknown as { ResizeObserverMock: typeof ResizeObserverMock }).ResizeObserverMock = ResizeObserverMock;

class IntersectionObserverMock implements IntersectionObserver {
  static instances: IntersectionObserverMock[] = [];
  callback: IntersectionObserverCallback;
  init: IntersectionObserverInit;
  observed = new Set<Element>();
  root: Element | Document | null = null;
  rootMargin = '';
  scrollMargin = '';
  thresholds: ReadonlyArray<number> = [];

  constructor(callback: IntersectionObserverCallback, init: IntersectionObserverInit = {}) {
    this.callback = callback;
    this.init = init;
    this.root = (init.root ?? null);
    this.rootMargin = init.rootMargin ?? '';
    this.thresholds = Array.isArray(init.threshold)
      ? init.threshold
      : init.threshold !== undefined
        ? [init.threshold]
        : [];
    IntersectionObserverMock.instances.push(this);
  }

  observe(target: Element) {
    this.observed.add(target);
  }

  unobserve(target: Element) {
    this.observed.delete(target);
  }

  disconnect() {
    this.observed.clear();
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  trigger(entries: IntersectionObserverEntry[]) {
    this.callback(entries, this);
  }
}

vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);
(globalThis as unknown as { IntersectionObserverMock: typeof IntersectionObserverMock }).IntersectionObserverMock = IntersectionObserverMock;

if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = vi.fn((query: string) => ({
    media: query,
    matches: false,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => true,
  }));
}
