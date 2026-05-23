export interface ResizeOptions extends ResizeObserverOptions {}

export interface UseResize {
  /**
   * Attach the shared `ResizeObserver` to a node.
   */
  observe: import('svelte/attachments').Attachment<Element>;
  /**
   * The most recent `ResizeObserverEntry` for the observed node, if any.
   */
  readonly current: ResizeObserverEntry | undefined;
  /**
   * The latest batch of `ResizeObserverEntry` delivered to this consumer.
   */
  readonly entries: ResizeObserverEntry[];
}
