import type { DebouncedFunction } from '@dvcol/common-utils/common/debounce';

import { debounce } from '@dvcol/common-utils/common/debounce';

export interface DebouncedOptions<T> {
  /**
   * Reactive source — read inside an `$effect`, so any tracked dependency
   * triggers a debounced update.
   */
  value: () => T;
  /**
   * Debounce delay in ms. Pass via `get delay()` to make it reactive —
   * changing the delay cancels the in-flight call and restarts with the new
   * value.
   *
   * @default 0
   */
  delay?: number;
}

export interface Debounced<T> {
  /**
   * Latest debounced value. `undefined` until the first update settles.
   * Setting this value cancels any in-flight debounce and updates immediately.
   */
  current: T | undefined;
  /**
   * Last error thrown by the debounced setter. Cleared on the next
   * successful update.
   */
  readonly error: unknown;
  /** Cancel the in-flight debounced update without writing a value. */
  cancel: () => void;
}

/**
 * Debounce a reactive source and expose the latest settled value.
 *
 * `delay` is read on every effect run, so passing it via `get delay()` makes
 * the debounce window itself reactive — changing the source delay cancels
 * the in-flight call and restarts with the new value.
 *
 * Writing to `current` cancels any pending debounce and sets the value
 * immediately (useful for bypassing debounce on truthy states).
 *
 * @example
 * ```ts
 * let query = $state('');
 * const search = debounced({ value: () => query, delay: 200 });
 * $effect(() => { if (search.current) fetch(search.current); });
 * // Immediate override:
 * search.current = 'now';
 * ```
 */
export function debounced<T>(options: DebouncedOptions<T>): Debounced<T> {
  let current = $state<T>();
  let error = $state<unknown>();
  let debouncedFn: DebouncedFunction<void> | undefined;

  $effect(() => {
    debouncedFn = debounce((v: T) => {
      current = v;
      error = undefined;
    }, options.delay ?? 0);
    debouncedFn(options.value()).catch((e: unknown) => {
      error = e;
    });
    return () => {
      void debouncedFn?.cancel();
    };
  });

  return {
    get current() {
      return current;
    },
    set current(v: T | undefined) {
      void debouncedFn?.cancel();
      current = v;
      error = undefined;
    },
    get error() {
      return error;
    },
    cancel() {
      void debouncedFn?.cancel();
    },
  };
}
