import type { Attachment } from 'svelte/attachments';

import type { MutationOptions, UseMutation } from './types.js';

const defaultOptions: MutationObserverInit = { childList: true };

/**
 * Observe DOM mutations on an element via a `MutationObserver`.
 *
 * Returns `{ observe, current, records }`:
 * - `observe` is the `@attach`-able binding.
 * - `records` is the latest batch of `MutationRecord`s.
 * - `current` is `records[0]` (most recent record in the batch).
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   const mutation = useMutation({ attributes: true });
 * </script>
 *
 * <div {@attach mutation.observe} data-state={mutation.current?.attributeName}></div>
 * ```
 */
export function useMutation(options: MutationOptions = defaultOptions): UseMutation {
  let records = $state<MutationRecord[]>([]);

  const observe: Attachment<Element> = (node) => {
    const observer = new MutationObserver((mutations) => {
      records = mutations;
    });
    observer.observe(node, options);
    return () => observer.disconnect();
  };

  return {
    observe,
    get current() {
      return records[0];
    },
    get records() {
      return records;
    },
  };
}
