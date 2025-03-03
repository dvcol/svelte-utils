import { handleSwipe } from '@dvcol/common-utils/common/touch';

import type { ScrollState, SwipeDirections, SwipeTolerances } from '@dvcol/common-utils/common/touch';
import type { TouchEventHandler } from 'svelte/elements';

export type SwipeHooks = {
  onSwipe?: (swipe: SwipeDirections) => void;
  onTouchStart?: TouchEventHandler<HTMLDivElement> | null;
  onTouchEnd?: TouchEventHandler<HTMLDivElement> | null;
};

export type SwipeHandlers = {
  ontouchstart: TouchEventHandler<HTMLDivElement>;
  ontouchend: TouchEventHandler<HTMLDivElement>;
};

/**
 * Register touch events handler for swipe detection.
 * @param onSwipe
 * @param onTouchStart
 * @param onTouchEnd
 * @param tolerances
 * @param scroll
 */
export const useSwipe = (
  { onSwipe, onTouchStart, onTouchEnd }: SwipeHooks = {},
  tolerances?: SwipeTolerances,
  scroll?: ScrollState,
): SwipeHandlers => {
  let scrollStart = $state({ x: window.scrollX, y: window.scrollY });
  let touchStart = $state<TouchEvent>();

  return {
    ontouchstart: e => {
      touchStart = e;
      scrollStart = { x: window.scrollX, y: window.scrollY };
      return onTouchStart?.(e);
    },
    ontouchend: e => {
      const start = touchStart?.targetTouches?.[0];
      const end = e.changedTouches?.[0];

      if (!start || !end) return onTouchEnd?.(e);

      const swipe = handleSwipe(
        {
          start,
          end,
        },
        tolerances,
        {
          start: scrollStart,
          end: { x: window.scrollX, y: window.scrollY },
          ...scroll,
        },
      );

      if (swipe) onSwipe?.(swipe);

      touchStart = undefined;
      return onTouchEnd?.(e);
    },
  };
};
