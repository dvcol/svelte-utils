export interface HoveringOptions {
  /**
   * Whether the element is hovered.
   * @default false
   */
  hovered?: boolean;
  /**
   * Event handler that fires when the hovered state changes.
   * @param value - New hovered state
   * @param e - PointerEvent that triggered the change
   */
  onChange?: (value: boolean, e: PointerEvent) => void;
}
