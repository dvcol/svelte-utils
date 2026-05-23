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
 * @example
 * ```svelte
 * <script lang="ts">
 *   const resize = useResize();
 * </script>
 *
 * <div {@attach resize.observe}>{resize.current?.contentRect.width ?? 0}</div>
 * ```
 */
export function useResize(options?: ResizeOptions): UseResize {
  let entries = $state<ResizeObserverEntry[]>([]);

  const observe: Attachment<Element> = (node) => {
    $effect(() => {
      const observer = getObserver();
      listeners.set(node, (next) => {
        entries = next;
      });
      observer.observe(node, options);

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
