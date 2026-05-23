export interface IntersectionOptions extends IntersectionObserverInit {}

export interface UseIntersection {
  /**
   * Attach the observer to a node — call on every node you want tracked.
   */
  observe: import('svelte/attachments').Attachment<Element>;
  /**
   * Reactive set of currently-intersecting nodes.
   */
  readonly visible: ReadonlySet<Element>;
  /**
   * The most recent `IntersectionObserverEntry` across all observed nodes.
   */
  readonly current: IntersectionObserverEntry | undefined;
  /**
   * Latest `IntersectionObserverEntry` per observed node, keyed by target.
   */
  readonly entries: ReadonlyMap<Element, IntersectionObserverEntry>;
}
