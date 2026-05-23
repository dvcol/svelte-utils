import type { UseMedia } from './types.js';

import { MediaQuery } from 'svelte/reactivity';

/**
 * Reactive media query.
 *
 * Thin wrapper over `svelte/reactivity`'s `MediaQuery`. Returns `{ current }`
 * — read inside an effect, derived, or template to subscribe to changes.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   const wide = useMedia('(min-width: 800px)');
 * </script>
 *
 * <h1>{wide.current ? 'large' : 'small'}</h1>
 * ```
 */
export function useMedia(query: string, fallback?: boolean): UseMedia {
  const media = new MediaQuery(query, fallback);
  return {
    get current() {
      return media.current;
    },
  };
}
