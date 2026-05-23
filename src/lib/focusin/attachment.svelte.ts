import type { Attachment } from 'svelte/attachments';

import type { FocusInOptions } from './types.js';

// Pattern C: $effect-driven param reactivity with property-getter options.
// Listener identity is stable; mirror logic re-runs only when read fields change.
import { debounce } from '@dvcol/common-utils/common/debounce';
import { getFocusableElement } from '@dvcol/common-utils/common/element';

/**
 * Track and mirror the focus state of an element.
 *
 * Use property getters for fields that should react to changes — plain reads
 * are tracked at `@attach` evaluation time and re-create the attachment.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   let focused = $state(false);
 *   const focusin = useFocusin({ get focusin() { return focused; }, mirror: true });
 * </script>
 *
 * <div {@attach focusin}></div>
 * ```
 */
export function useFocusin(options: FocusInOptions = {}): Attachment<HTMLElement> {
  return (node) => {
    const setState = (value: boolean, e: FocusEvent) => {
      if (value === options.focusin) return;
      options.focusin = value;
      options.onChange?.(value, e);
    };

    const onFocus = (e: FocusEvent) => {
      if (options.focusin) return;
      setState(true, e);
    };

    let onBlur: (e: FocusEvent) => void = () => {};
    $effect(() => {
      onBlur = debounce((e: FocusEvent) => {
        if (!options.focusin) return;
        if (node.contains(document.activeElement)) return;
        setState(false, e);
      }, options.debounce ?? 0);
    });
    const onBlurDispatch = (e: FocusEvent) => onBlur(e);

    node.addEventListener('focusin', onFocus, { passive: true });
    node.addEventListener('focusout', onBlurDispatch, { passive: true });

    $effect(() => {
      if (options.mirror === false) return;
      const want = options.focusin;
      const isFocused = node.contains(document.activeElement);
      if (isFocused === want) return;
      if (want) {
        node.focus();
        if (node.contains(document.activeElement)) return;
        getFocusableElement(node)?.focus();
        return;
      }
      if (!(document.activeElement instanceof HTMLElement)) return;
      document.activeElement.blur();
    });

    return () => {
      node.removeEventListener('focusin', onFocus);
      node.removeEventListener('focusout', onBlurDispatch);
    };
  };
}
