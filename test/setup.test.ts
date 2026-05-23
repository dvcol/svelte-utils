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
