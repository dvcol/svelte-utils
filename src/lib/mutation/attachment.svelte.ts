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
 * ## Reactive options
 *
 * Option fields are read via spread inside the `$effect`, so any enumerable
 * getter is tracked. Passing `{ get attributes(){…} }` disconnects and
 * re-creates the observer with the new options when the source changes.
 * Only own enumerable properties are read — keep options as a plain object
 * literal.
 *
 * ## Design note — no `createSubscriber`
 *
 * Observer attachments are mount-driven, not read-driven — the observer
 * must run while the node is attached, regardless of whether `.records` is
 * currently being read in a tracked scope. A subscriber-gated observer
 * would risk teardown / re-create on read flicker between renders.
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
    $effect(() => {
      const init = { ...options };
      const observer = new MutationObserver((mutations) => {
        records = mutations;
      });
      observer.observe(node, init);
      return () => observer.disconnect();
    });
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
