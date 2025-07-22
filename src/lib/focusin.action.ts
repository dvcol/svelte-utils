import { debounce } from '@dvcol/common-utils/common/debounce';
import { getFocusableElement } from '@dvcol/common-utils/common/element';

import type { Action } from 'svelte/action';

export type FocusInOptions = {
  /**
   * Whether the element is or contains a focused element.
   * @default false
   */
  focusin?: boolean;
  /**
   * Whether to mirror the focus state.
   * - If true, the action will focus the element (or the first focusable child) when the focusin state changes to true.
   * - If false, the action will only reflect the focusin events (focusin/focusout).
   * @default true
   */
  mirror?: boolean;
  /**
   * Event handler that fires when the focusin state changes.
   * @param value - New focusin state
   * @param e - FocusEvent that triggered the change
   */
  onChange?: (value: boolean, e: FocusEvent) => void;
  /**
   * Onblur debounce time in milliseconds.
   *
   * @default 0
   */
  debounce?: number;
};
export const focusin: Action<HTMLElement, FocusInOptions> = (node: HTMLElement, options: FocusInOptions) => {
  let params = options;

  const setState = (value: boolean, e: FocusEvent) => {
    if (value === params.focusin) return;
    params.focusin = value;
    params.onChange?.(value, e);
  };

  const onFocus = (e: FocusEvent) => {
    if (params.focusin) return;
    setState(true, e);
  };

  const onBlur = debounce((e: FocusEvent) => {
    if (!params.focusin) return;
    if (node.contains(document.activeElement)) return;
    setState(false, e);
  }, options.debounce ?? 0);

  node.addEventListener('focusin', onFocus, { passive: true });
  node.addEventListener('focusout', onBlur, { passive: true });
  return {
    update: (_options: FocusInOptions) => {
      params = _options;
      if (params.mirror === false) return;
      const isFocused = node.contains(document.activeElement);
      if (isFocused === params.focusin) return;
      if (params.focusin) {
        node.focus();
        if (node.contains(document.activeElement)) return;
        return getFocusableElement(node)?.focus();
      }
      if (!(document.activeElement instanceof HTMLElement)) return;
      return document.activeElement.blur();
    },
    destroy: () => {
      node.removeEventListener('focusin', onFocus);
      node.removeEventListener('focusout', onBlur);
    },
  };
};
