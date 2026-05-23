export interface FocusInOptions {
  /**
   * Whether the element is or contains a focused element.
   * @default false
   */
  focusin?: boolean;
  /**
   * Whether to mirror the focus state.
   * - If true, the attachment will focus the element (or the first focusable child) when the focusin state changes to true.
   * - If false, the attachment will only reflect the focusin events (focusin/focusout).
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
}
