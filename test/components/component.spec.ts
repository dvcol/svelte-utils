import { describe, expect, it, vi } from 'vitest';

import {
  isLazyComponent,
  isSnippet,
  isSyncComponentOrSnippet,
  resolveAsyncComponent,
  resolveComponent,
  toLazyComponent,
} from '~/components/component.js';

describe('component', () => {
  describe('isLazyComponent', () => {
    it('detects components wrapped with toLazyComponent', () => {
      expect.assertions(1);
      const lazy = toLazyComponent(async () => ({ default: () => null }));
      expect(isLazyComponent(lazy)).toBe(true);
    });

    it('detects async functions', () => {
      expect.assertions(1);
      const fn = async () => ({ default: () => null });
      expect(isLazyComponent(fn as never)).toBe(true);
    });

    it('returns false for plain components', () => {
      expect.assertions(1);
      const plain = function MyComponent() {};
      expect(isLazyComponent(plain as never)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect.assertions(1);
      expect(isLazyComponent()).toBe(false);
    });
  });

  describe('isSnippet', () => {
    it('returns true for one-arg functions', () => {
      expect.assertions(1);
      const snippet = (_arg: unknown) => null;
      expect(isSnippet(snippet as never)).toBe(true);
    });

    it('returns false for zero-arg functions', () => {
      expect.assertions(1);
      const component = () => null;
      expect(isSnippet(component as never)).toBe(false);
    });
  });

  describe('toLazyComponent', () => {
    it('marks the function with _isLazyComponent', () => {
      expect.assertions(1);
      const lazy = toLazyComponent(async () => ({ default: () => null }));
      expect(lazy._isLazyComponent).toBe(true);
    });
  });

  describe('isSyncComponentOrSnippet', () => {
    it('returns true for a sync component', () => {
      expect.assertions(1);
      const sync = function () {};
      expect(isSyncComponentOrSnippet(sync as never)).toBe(true);
    });

    it('returns false for a lazy component', () => {
      expect.assertions(1);
      const lazy = toLazyComponent(async () => ({ default: () => null }));
      expect(isSyncComponentOrSnippet(lazy)).toBe(false);
    });
  });

  describe('resolveComponent', () => {
    it('returns the component synchronously when not lazy', async () => {
      expect.assertions(2);
      const sync = function () {};
      const onLoaded = vi.fn();
      const result = await resolveComponent(sync as never, { onLoaded });
      expect(result).toBe(sync);
      expect(onLoaded).toHaveBeenCalledOnce();
    });

    it('awaits lazy components and calls hooks in order', async () => {
      expect.assertions(4);
      const target = function () {};
      const lazy = toLazyComponent(async () => ({ default: target as never }));
      const onStart = vi.fn();
      const onLoading = vi.fn();
      const onLoaded = vi.fn();

      const result = await resolveComponent(lazy, { onStart, onLoading, onLoaded });

      expect(result).toBe(target);
      expect(onStart).toHaveBeenCalledOnce();
      expect(onLoading).toHaveBeenCalledOnce();
      expect(onLoaded).toHaveBeenCalledWith(target);
    });

    it('calls onError when the lazy import rejects', async () => {
      expect.assertions(2);
      const error = new Error('boom');
      const lazy = toLazyComponent(async () => Promise.reject(error));
      const onError = vi.fn();

      const result = await resolveAsyncComponent(lazy, { onError });

      expect(result).toBeUndefined();
      expect(onError).toHaveBeenCalledWith(error);
    });
  });
});
