export interface IntersectionOptions extends IntersectionObserverInit {}

export interface UseIntersection {
  /**
   * Attach the observer to a node — call on every node you want tracked.
   */
  observe: import('svelte/attachments').Attachment<Element>;
  /**
   * Currently-intersecting nodes. Plain `Set` — IO batches fire from a
   * browser-scheduled task and a reactive set would coarsely re-run any
   * `$effect` reading `.has(x)` on every other node's change. Read it from
   * imperative scopes (event handlers, attachment callbacks, animation
   * hooks). For per-node reactivity, bind a local `$state` inside an
   * attachment.
   */
  readonly visible: ReadonlySet<Element>;
  /**
   * The most recent `IntersectionObserverEntry` across all observed nodes.
   * Reactive — use this when you need a tracked entrypoint.
   */
  readonly current: IntersectionObserverEntry | undefined;
  /**
   * Latest `IntersectionObserverEntry` per observed node, keyed by target.
   * Plain `Map` — see {@link visible}.
   */
  readonly entries: ReadonlyMap<Element, IntersectionObserverEntry>;
}
