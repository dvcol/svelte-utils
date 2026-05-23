import type { Attachment } from 'svelte/attachments';

import type { ResizeOptions, UseResize } from './types.js';

import { getObserver, listeners } from './shared.js';

/**
 * Observe size changes on an element via a shared `ResizeObserver` singleton.
 *
 * Returns `{ observe, current, entries }`:
 * - `observe` is the `@attach`-able binding.
 * - `entries` is the latest batch of `ResizeObserverEntry` for the node.
 * - `current` is `entries[0]` (convenience for single-box observation).
 *
 * ## Reactive options
 *
 * Option fields are read via spread inside the `$effect`, so any enumerable
 * getter is tracked. Passing `{ get box(){…} }` re-`observe`s the node with
 * the new options when the source changes. Only own enumerable properties
 * are read — keep options as a plain object literal.
 *
 * ## Design note — no `createSubscriber`
 *
 * Observer attachments are mount-driven, not read-driven — the observer
 * must run while the node is attached, regardless of whether `.entries` is
 * currently being read in a tracked scope. A subscriber-gated observer
 * would risk teardown / re-create on read flicker between renders.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   const resize = useResize();
 * </script>
 *
 * <div {@attach resize.observe}>{resize.current?.contentRect.width ?? 0}</div>
 * ```
 */
export function useResize(options: ResizeOptions = {}): UseResize {
  let entries = $state<ResizeObserverEntry[]>([]);

  const observe: Attachment<Element> = (node) => {
    $effect(() => {
      const init = { ...options };
      const observer = getObserver();
      listeners.set(node, (next) => {
        entries = next;
      });
      observer.observe(node, init);

      return () => {
        observer.unobserve(node);
        listeners.delete(node);
      };
    });
  };

  return {
    observe,
    get current() {
      return entries[0];
    },
    get entries() {
      return entries;
    },
  };
}
