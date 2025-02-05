import { untrack } from 'svelte';

export type WatchOptions = { skipFirst?: boolean; skip?: () => boolean };
export function watch(sources: () => unknown, untracked: Parameters<typeof untrack>[0], options: WatchOptions = {}) {
  let first = true;
  const skip = ({ skipFirst }: WatchOptions = {}) => {
    if (!first) return options?.skip?.();
    first = false;
    return skipFirst || options?.skip?.();
  };
  $effect(() => {
    sources();
    if (skip(options)) return;
    untrack(untracked);
  });
}

export function effect(sources: () => unknown, tracked: () => void, options: WatchOptions = {}) {
  let first = true;
  const skip = ({ skipFirst }: WatchOptions = {}) => {
    if (!first) return options?.skip?.();
    first = false;
    return skipFirst || options?.skip?.();
  };
  $effect(() => {
    sources();
    if (skip(options)) return;
    tracked();
  });
}

export const doubleBind = <T = unknown, E = unknown>({
  outer,
  inner,
  input,
  output,
}: {
  outer: () => T;
  inner: () => T;
  input: () => E;
  output: () => E;
}) => {
  watch(outer, () => {
    if (outer() === inner()) return;
    input();
  });
  watch(inner, () => {
    if (outer() === inner()) return;
    output();
  });
};
