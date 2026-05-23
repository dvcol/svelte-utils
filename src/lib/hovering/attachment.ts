// Pattern B: lazy reads inside event handlers. No imperative param-reactive work.
import type { Attachment } from 'svelte/attachments';

import type { HoveringOptions } from './types.js';

/**
 * Track the hover state of an element.
 *
 * Use property getters for fields that should react to changes.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   let hovered = $state(false);
 *   const hovering = useHovering({ get hovered() { return hovered; }, onChange: v => hovered = v });
 * </script>
 *
 * <div {@attach hovering}></div>
 * ```
 */
export function useHovering(options: HoveringOptions = {}): Attachment<HTMLElement> {
  return (node) => {
    const setState = (value: boolean, e: PointerEvent) => {
      if (value === options.hovered) return;
      options.hovered = value;
      options.onChange?.(value, e);
    };

    const onPointerEnter = (e: PointerEvent) => {
      if (options.hovered) return;
      setState(true, e);
    };

    const onPointerLeave = (e: PointerEvent) => {
      if (!options.hovered) return;
      setState(false, e);
    };

    node.addEventListener('pointerenter', onPointerEnter, { passive: true });
    node.addEventListener('pointerleave', onPointerLeave, { passive: true });

    return () => {
      node.removeEventListener('pointerenter', onPointerEnter);
      node.removeEventListener('pointerleave', onPointerLeave);
    };
  };
}
