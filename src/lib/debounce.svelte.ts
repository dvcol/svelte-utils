import { debounce } from '@dvcol/common-utils/common/debounce';

/**
 * Debounce a state and return a getter.
 *
 * @param getter a function that contains dependencies
 * @param delay debounce delay
 * @param cb error callback
 *
 * return a getter function to be derived
 */
export function debounced<T>(getter: () => T, delay = 0, cb?: (error: unknown) => void): () => T | undefined {
  let current = $state<T>();
  const update = debounce((v: T) => {
    current = v;
  }, delay);
  $effect(() => {
    update(getter()).catch(cb);
  });
  return () => current;
}
