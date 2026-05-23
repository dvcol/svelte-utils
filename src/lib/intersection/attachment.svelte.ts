import type { Attachment } from 'svelte/attachments';

import type { IntersectionOptions, UseIntersection } from './types.js';

import { SvelteMap, SvelteSet } from 'svelte/reactivity';

/**
 * Observe viewport intersection on one or more elements via an
 * `IntersectionObserver`.
 *
 * Returns `{ observe, visible, current, entries }`:
 * - `observe` is the `@attach`-able binding — call it on every node you want
 *   tracked. All nodes share the single observer created by this call.
 * - `visible` is a reactive `SvelteSet` of currently-intersecting nodes —
 *   use `visible.has(node)` for per-node lookups.
 * - `entries` is a `SvelteMap<Element, IntersectionObserverEntry>` keyed by
 *   target.
 * - `current` is the most recent entry across all observed nodes.
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
 * ## Design note — no `createSubscriber`
 *
 * Observer attachments are mount-driven, not read-driven — the observer must
 * run while nodes are attached, regardless of whether `.visible` /
 * `.entries` are currently being read in a tracked scope. A subscriber-gated
 * observer would risk teardown / re-create on read flicker between renders,
 * missing the IO's once-on-observe initial fire. `MediaQuery` (which uses
 * `createSubscriber`) is shapeless — no node, no attachment — hence its
 * different choice.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   let scrollRef = $state<HTMLElement | undefined>();
 *   const intersection = useIntersection({
 *     get root() { return scrollRef; },
 *     rootMargin: '50%',
 *   });
 * </script>
 *
 * <div bind:this={scrollRef}>
 *   {#each rows as row (row.id)}
 *     <div {@attach intersection.observe}>
 *       {intersection.visible.has(rowNode) ? 'visible' : 'hidden'}
 *     </div>
 *   {/each}
 * </div>
 * ```
 */
export function useIntersection(options: IntersectionOptions = {}): UseIntersection {
  const visible = new SvelteSet<Element>();
  const entries = new SvelteMap<Element, IntersectionObserverEntry>();
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

  const observe: Attachment<Element> = (node) => {
    $effect(() => {
      tracked.add(node);
      observer?.observe(node);
      return () => {
        tracked.delete(node);
        observer?.unobserve(node);
        entries.delete(node);
        visible.delete(node);
      };
    });
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
