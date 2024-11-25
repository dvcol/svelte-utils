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
