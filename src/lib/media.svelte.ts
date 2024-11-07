import { onDestroy } from 'svelte';

export type WatchMediaResult = {
  media: MediaQueryList;
  matches: () => boolean;
  destroy: () => void;
};

export const useWatchMedia = (
  query: string,
  callback?: (event: MediaQueryListEvent) => void,
  options?: AddEventListenerOptions,
): WatchMediaResult => {
  const media = window.matchMedia(query);
  let matches = $state(media.matches);

  const listener = (event: MediaQueryListEvent) => {
    matches = event.matches;
    callback?.(event);
  };
  media.addEventListener('change', listener, options);
  const destroy = () => media.removeEventListener('change', listener, options);

  onDestroy(() => destroy());
  return {
    media,
    matches: () => matches,
    destroy,
  };
};
