import type { Attachment } from 'svelte/attachments';

import type { IntersectionOptions, UseIntersection } from './types.js';

/**
 * Observe viewport intersection on one or more elements via an
 * `IntersectionObserver`.
 *
 * Returns `{ observe, visible, current, entries }`:
 * - `observe` is the `@attach`-able binding — call it on every node you want
 *   tracked. All nodes share the single observer created by this call.
 * - `visible` is a plain `Set` of currently-intersecting nodes — read it
 *   from imperative scopes (see note below).
 * - `entries` is a plain `Map<Element, IntersectionObserverEntry>` keyed by
 *   target.
 * - `current` is the most recent entry across all observed nodes — reactive,
 *   use this when you need a tracked entrypoint.
 *
 * ## Reactive options
 *
 * Option fields are read via spread inside a `$effect`, so any enumerable
 * getter is tracked. Passing `{ get root(){…}, get rootMargin(){…} }`
 * re-creates the observer (and re-attaches every previously-observed node)
 * when the source changes. Only own enumerable properties are read — keep
 * options as a plain object literal.
 *
 * ## Sharp edge — `root`
 *
 * `IntersectionObserverInit.root` is typically a scroll container only
 * available after mount. Pass it via getter:
 *
 * ```ts
 * useIntersection({ get root() { return scrollRef; }, rootMargin: '50%' });
 * ```
 *
 * Plain `{ root: scrollRef }` reads `scrollRef` at call time (often
 * `undefined` before mount) and never retries.
 *
 * ## Why `visible` / `entries` are not reactive
 *
 * IO batches fire from a browser-scheduled task. A reactive `visible` would
 * coarsely re-run any `$effect` that reads `.has(x)` whenever *any other*
 * node's intersection changes — almost never the desired granularity, and
 * costly on large observed sets. Read `visible` / `entries` from imperative
 * scopes (event handlers, attachment callbacks, animation hooks). For
 * per-node reactivity, bind a local `$state` inside an attachment that
 * flips on intersection. For a single tracked entrypoint, read `current`.
 *
 * ## Design note — no `createSubscriber`
 *
 * Observer attachments are mount-driven, not read-driven — the observer must
 * run while nodes are attached, regardless of whether `.current` is being
 * read in a tracked scope. A subscriber-gated observer would risk teardown
 * / re-create on read flicker between renders, missing the IO's
 * once-on-observe initial fire.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   let scrollRef = $state<HTMLElement | undefined>();
 *   const intersection = useIntersection({
 *     get root() { return scrollRef; },
 *     rootMargin: '50%',
 *   });
 *
 *   function onClick(event: MouseEvent) {
 *     if (intersection.visible.has(event.currentTarget as Element)) {
 *       // act only on currently-visible targets
 *     }
 *   }
 * </script>
 *
 * <div bind:this={scrollRef}>
 *   {#each rows as row (row.id)}
 *     <div {@attach intersection.observe} onclick={onClick}>…</div>
 *   {/each}
 * </div>
 * ```
 */
export function useIntersection(options: IntersectionOptions = {}): UseIntersection {
  const visible = new Set<Element>();
  const entries = new Map<Element, IntersectionObserverEntry>();
  let last = $state<IntersectionObserverEntry | undefined>();

  let observer: IntersectionObserver | undefined;
  const tracked = new Set<Element>();

  $effect(() => {
    const init = { ...options };
    const next = new IntersectionObserver((batch) => {
      for (const entry of batch) {
        entries.set(entry.target, entry);
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      }
      last = batch.at(-1) ?? last;
    }, init);
    observer = next;

    for (const node of tracked) next.observe(node);

    return () => {
      next.disconnect();
      if (observer === next) observer = undefined;
    };
  });

  /*
   * Returning the cleanup directly (instead of wrapping in `$effect`) keeps
   * per-node attachment cost flat — wrapping would allocate one reactive
   * cell per observed node on mount/unmount, scaling poorly with large
   * observed sets. The shared observer effect above already handles
   * option-driven re-attach.
   */
  const observe: Attachment<Element> = (node) => {
    tracked.add(node);
    observer?.observe(node);
    return () => {
      tracked.delete(node);
      observer?.unobserve(node);
      entries.delete(node);
      visible.delete(node);
    };
  };

  return {
    observe,
    get visible() {
      return visible;
    },
    get current() {
      return last;
    },
    get entries() {
      return entries;
    },
  };
}
