import { untrack } from 'svelte';

export function watch(sources: () => unknown, untracked: Parameters<typeof untrack>[0]) {
  $effect(() => {
    sources();
    untrack(untracked);
  });
}

export function effect(sources: () => unknown, tracked: () => void) {
  $effect(() => {
    sources();
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
