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
   */
  readonly current: T | undefined;
  /**
   * Last error thrown by the debounced setter. Cleared on the next
   * successful update.
   */
  readonly error: unknown;
}

/**
 * Debounce a reactive source and expose the latest settled value.
 *
 * `delay` is read on every effect run, so passing it via `get delay()` makes
 * the debounce window itself reactive — changing the source delay cancels
 * the in-flight call and restarts with the new value.
 *
 * @example
 * ```ts
 * let query = $state('');
 * const search = debounced({ value: () => query, delay: 200 });
 * $effect(() => { if (search.current) fetch(search.current); });
 * ```
 */
export function debounced<T>(options: DebouncedOptions<T>): Debounced<T> {
  let current = $state<T>();
  let error = $state<unknown>();

  $effect(() => {
    const update = debounce((v: T) => {
      current = v;
      error = undefined;
    }, options.delay ?? 0);
    update(options.value()).catch((e) => {
      error = e;
    });
    return () => {
      void update.cancel();
    };
  });

  return {
    get current() {
      return current;
    },
    get error() {
      return error;
    },
  };
}
