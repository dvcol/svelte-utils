import { type SwipeHandlers, type SwipeHooks, useSwipe } from './touch.svelte.js';

import type { ScrollState, SwipeTolerances } from '@dvcol/common-utils/common/touch';
import type { Action } from 'svelte/action';

type SwipeOptions = {
  onSwipe: SwipeHooks['onSwipe'];
  tolerances?: SwipeTolerances;
  scroll?: ScrollState;
};

/**
 * Register touch events handler for swipe detection.
 *
 * @param node
 * @param options
 */
export const swipe: Action<Element, SwipeOptions | SwipeHooks['onSwipe']> = (node: Element, options: SwipeOptions | SwipeHooks['onSwipe']) => {
  let handlers: SwipeHandlers;

  function destroy() {
    if (handlers?.ontouchstart) node.removeEventListener('touchstart', handlers.ontouchstart as EventListenerOrEventListenerObject);
    if (handlers?.ontouchend) node.removeEventListener('touchend', handlers.ontouchend as EventListenerOrEventListenerObject);
  }

  function update(_options: SwipeOptions | SwipeHooks['onSwipe']) {
    destroy();
    const hooks = typeof _options === 'function' ? { onSwipe: _options } : _options;
    handlers = useSwipe({ onSwipe: hooks?.onSwipe }, hooks?.tolerances, hooks?.scroll);
    node.addEventListener('touchstart', handlers.ontouchstart as EventListenerOrEventListenerObject, { passive: true });
    node.addEventListener('touchend', handlers.ontouchend as EventListenerOrEventListenerObject, { passive: true });
  }

  update(options);

  return {
    update,
    destroy,
  };
};
