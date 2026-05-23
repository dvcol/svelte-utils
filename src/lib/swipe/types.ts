import type { ScrollState } from '@dvcol/common-utils/common/touch';

import type { SwipeHooks, SwipeNodeTolerances } from './rune.svelte.js';

export interface SwipeOptions {
  onSwipe: SwipeHooks['onSwipe'];
  tolerances?: SwipeNodeTolerances;
  scroll?: ScrollState;
}
