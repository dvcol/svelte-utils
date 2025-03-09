import type { Action } from 'svelte/action';

export type HoveringOptions = {
  /**
   * Whether the element is hovered.
   * @default false
   */
  hovered?: boolean;
  /**
   * Event handler that fires when the hovered state changes.
   * @param value
   */
  onChange?: (value: boolean) => void;
};
export const hovering: Action<HTMLElement, HoveringOptions> = (node: HTMLElement, options: HoveringOptions) => {
  let params = options;

  const setState = (value: boolean) => {
    if (value === params.hovered) return;
    params.hovered = value;
    params.onChange?.(value);
  };

  const onPointerEnter = () => {
    if (params.hovered) return;
    setState(true);
  };

  const onPointerLeave = () => {
    if (!params.hovered) return;
    setState(false);
  };

  node.addEventListener('pointerenter', onPointerEnter, { passive: true });
  node.addEventListener('pointerleave', onPointerLeave, { passive: true });
  return {
    update: (_options: HoveringOptions) => {
      params = _options;
    },
    destroy: () => {
      node.removeEventListener('pointerenter', onPointerEnter);
      node.removeEventListener('pointerleave', onPointerLeave);
    },
  };
};
