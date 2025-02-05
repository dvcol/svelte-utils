import { tick, untrack } from 'svelte';

export type WatchOptions = {
  /**
   * Run outside tracked scope.
   * @see https://svelte.dev/docs/svelte/$effect#$effect.root
   */
  root?: boolean;
  /**
   * Run before tick
   * @see https://svelte.dev/docs/svelte/$effect#$effect.pre
   */
  pre?: boolean;
  /**
   * Skip the first n runs
   */
  skip?: number;
  /**
   * Skip while the condition is true
   */
  until?: () => boolean;
  /**
   * Run on the next tick
   * @see https://svelte.dev/docs/svelte/lifecycle-hooks#tick
   */
  next?: () => void;
  /**
   *  If a callback is provided, it will run:
   *   * immediately before the effect re-runs
   *   * when the component is destroyed
   *   @see https://svelte.dev/docs/svelte/$effect
   */
  callback?: () => void;
};

const wait = (options?: Pick<WatchOptions, 'next'>) => {
  if (!options?.next) return;
  tick().then(options.next);
};

const useUntil = (options?: Pick<WatchOptions, 'until'>) => {
  let first = 0;
  return ({ skip = 0 }: WatchOptions = {}) => {
    if (skip <= first) return options?.until?.();
    first += 1;
    return skip <= first || options?.until?.();
  };
};

/**
 * Create a function that wraps the logic to run when the sources change.
 * @param sources - getter function including all dependencies
 * @param logic - logic to run when sources change
 * @param options - watch options to control the behavior
 * @param tracked - Whether to run the logic inside the tracked scope
 */
export const useEffect = (sources: () => unknown, logic: () => void, options: Omit<WatchOptions, 'pre' | 'root'> = {}, tracked = false) => {
  const until = useUntil(options);
  return () => {
    sources();
    if (until(options)) return;
    if (tracked) logic();
    else untrack(logic);
    wait(options);
    return options?.callback;
  };
};

/**
 * Watch for changes in the sources and run the logic.
 *
 * Logic will run outside of the tracked scope.
 * To run inside the tracked scope, use `$effect` or `effect` instead.
 *
 * @param sources - getter function including all dependencies
 * @param untracked - logic to run when sources change
 * @param options - watch options
 */
export function watch(sources: () => unknown, untracked: Parameters<typeof untrack>[0], options: WatchOptions = {}) {
  const logic = useEffect(sources, untracked, options, false);
  if (options.root) $effect.root(logic);
  else if (options.pre) $effect.pre(logic);
  else $effect(logic);
}

/**
 * Watch for changes in the sources and run the logic.
 *
 * Logic will run inside the tracked scope.
 * To run outside the tracked scope, use `watch` instead.
 *
 * @param sources - getter function including all dependencies
 * @param tracked - logic to run when sources change
 * @param options - watch options
 */
export function effect(sources: () => unknown, tracked: () => void, options: WatchOptions = {}) {
  const logic = useEffect(sources, tracked, options, true);
  if (options.root) $effect.root(logic);
  else if (options.pre) $effect.pre(logic);
  else $effect(logic);
}

export const doubleBind = <T = unknown, E = unknown>(
  {
    outer,
    inner,
    input,
    output,
  }: {
    outer: () => T;
    inner: () => T;
    input: () => E;
    output: () => E;
  },
  options: WatchOptions,
) => {
  watch(
    outer,
    () => {
      if (outer() === inner()) return;
      input();
    },
    options,
  );
  watch(
    inner,
    () => {
      if (outer() === inner()) return;
      output();
    },
    options,
  );
};
