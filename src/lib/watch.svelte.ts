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
  /**
   * Whether to run the logic inside the tracked scope
   */
  tracked?: boolean;
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
 * @param change - logic to run when sources change
 * @param sources - getter function including tracked dependencies
 * @param options - watch options to control the behavior
 * @param options.tracked - whether to run the logic inside a tracked scope (default: false with sources, true without)
 */
export const useEffect = (
  change: Parameters<typeof untrack>[0],
  sources?: () => unknown,
  { tracked = !sources, ...options }: Omit<WatchOptions, 'pre' | 'root'> = {},
) => {
  const until = useUntil(options);
  return () => {
    sources?.();
    if (until(options)) return;
    if (tracked) change();
    else untrack(change);
    wait(options);
    return options?.callback;
  };
};

/**
 * Watch for changes in the sources and run the logic.
 *
 * Logic will run outside of the tracked scope if `sources` is provided or if `options.tracked` is explicitly false.
 *
 * @param change - logic to run when sources change
 * @param sources - getter function including tracked dependencies
 * @param options - watch options
 * @param options.root - run outside tracked scope
 * @param options.pre - run before tick
 */
export function watch(change: Parameters<typeof untrack>[0], sources?: () => unknown, { root, pre, ...options }: WatchOptions = {}) {
  const logic = useEffect(change, sources, options);
  if (root) $effect.root(logic);
  else if (pre) $effect.pre(logic);
  else $effect(logic);
}

/**
 * Watch for changes in the sources and run the logic.
 *
 * Logic will run inside of the tracked scope unless `options.tracked` is explicitly false.
 *
 * @param change - logic to run when sources change
 * @param sources - getter function including tracked dependencies
 * @param options - watch options
 */
export function effect(change: Parameters<typeof untrack>[0], sources?: () => unknown, options: WatchOptions = {}) {
  return watch(change, sources, { tracked: true, ...options });
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
