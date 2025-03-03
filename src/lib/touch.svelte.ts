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

export type SwipeNodeTolerances = SwipeTolerances & {
  horizontal?: SwipeTolerances['horizontal'] | `${number}%`;
  up?: SwipeTolerances['up'] | `${number}%`;
  down?: SwipeTolerances['down'] | `${number}%`;
  vertical?: SwipeTolerances['vertical'] | `${number}%`;
  left?: SwipeTolerances['left'] | `${number}%`;
  right?: SwipeTolerances['right'] | `${number}%`;
  container?: Element;
};

const percentRegex = /(\d+)%/;
const toTolerances = ({ container, ...tolerances }: SwipeNodeTolerances = {}): SwipeTolerances | undefined => {
  if (!tolerances || !Object.keys(tolerances)?.length) return undefined;
  return Object.entries(tolerances).reduce<SwipeTolerances>((acc, [key, value]) => {
    if (typeof value === 'number') {
      acc[key as keyof SwipeTolerances] = value;
    } else {
      const percent = Number.parseFloat(value);
      if (!percentRegex.test(value) || !container) {
        if (!container) console.warn('[SwipeHandler] Node is missing or undefined, value will be used as number', value);
        acc[key as keyof SwipeTolerances] = Number.parseFloat(value);
      } else if (['horizontal', 'left', 'right'].includes(key)) {
        acc[key as keyof SwipeTolerances] = (container.clientWidth * percent) / 100;
      } else {
        acc[key as keyof SwipeTolerances] = (container.clientHeight * percent) / 100;
      }
    }
    return acc;
  }, {});
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
  tolerances?: SwipeNodeTolerances,
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
        toTolerances(tolerances),
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
