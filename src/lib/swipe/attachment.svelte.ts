// Pattern B: lazy reads inside event handlers; rebuilds handlers on option change via $effect.
import type { Attachment } from 'svelte/attachments';

import type { SwipeHandlers, SwipeHooks } from './rune.svelte.js';
import type { SwipeOptions } from './types.js';

import { useSwipe as useSwipeRune } from './rune.svelte.js';

/**
 * Detect swipe gestures on an element and dispatch the resolved direction.
 *
 * Pass either an `onSwipe` callback or a full options object with tolerances
 * and scroll state.
 *
 * ## Reactive options
 *
 * Option fields are read inside a `$effect`, so any `$state` field access or
 * enumerable getter is tracked. Mutating fields on a `$state` options object —
 * or passing `{ get tolerances(){…} }` — rebuilds the swipe handlers when the
 * source changes. Only own enumerable properties of `tolerances` are read.
 *
 * ## Hoisting
 *
 * Because the inner `$effect` reads `parameters` properties (not just the
 * reference), `const swipe = useSwipe(opts)` is safe when `opts` is a `$state`
 * object whose fields are mutated. Reassigning the outer variable
 * (`opts = {...}`) is not tracked through the closure — use the inline
 * `{@attach useSwipe(opts)}` form or expose the field via a getter for that
 * case.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   const swipe = useSwipe({ onSwipe: (direction) => console.log(direction), tolerances: { horizontal: 80 } });
 * </script>
 *
 * <div {@attach swipe}></div>
 * ```
 */
export function useSwipe(parameters: SwipeOptions | SwipeHooks['onSwipe']): Attachment<Element> {
  return (node) => {
    let handlers: SwipeHandlers | undefined;

    $effect(() => {
      const hooks = typeof parameters === 'function' ? { onSwipe: parameters } : parameters;
      handlers = useSwipeRune({ onSwipe: hooks?.onSwipe }, { container: node, ...hooks?.tolerances }, hooks?.scroll);
    });

    const onTouchStart: SwipeHandlers['ontouchstart'] = (e): void => {
      handlers?.ontouchstart?.(e);
    };
    const onTouchEnd: SwipeHandlers['ontouchend'] = (e): void => {
      handlers?.ontouchend?.(e);
    };

    node.addEventListener('touchstart', onTouchStart as EventListener, { passive: true });
    node.addEventListener('touchend', onTouchEnd as EventListener, { passive: true });

    return () => {
      node.removeEventListener('touchstart', onTouchStart as EventListener);
      node.removeEventListener('touchend', onTouchEnd as EventListener);
    };
  };
}
