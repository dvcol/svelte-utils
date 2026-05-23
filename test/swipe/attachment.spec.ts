import { describe, expect, it, vi } from 'vitest';

import { useSwipe } from '~/swipe/attachment.svelte.js';

import { mountAttachment } from '../helpers.svelte.js';

function makeTouchEvent(type: string, x: number, y: number): TouchEvent {
  const touch = { clientX: x, clientY: y, identifier: 0 } as Touch;
  const event = new Event(type, { bubbles: true }) as TouchEvent;
  Object.defineProperty(event, 'targetTouches', { value: [touch] });
  Object.defineProperty(event, 'changedTouches', { value: [touch] });
  return event;
}

describe('useSwipe attachment', () => {
  it('fires onSwipe when start+end yield a swipe direction', () => {
    expect.assertions(1);
    const onSwipe = vi.fn();
    const { node, unmount } = mountAttachment<HTMLElement>(useSwipe(onSwipe));

    node.dispatchEvent(makeTouchEvent('touchstart', 0, 0));
    node.dispatchEvent(makeTouchEvent('touchend', 200, 0));

    expect(onSwipe).toHaveBeenCalledWith('right');
    unmount();
  });

  it('accepts an options object with tolerances', () => {
    expect.assertions(1);
    const onSwipe = vi.fn();
    const { node, unmount } = mountAttachment<HTMLElement>(
      useSwipe({ onSwipe, tolerances: { horizontal: 1000 } }),
    );

    node.dispatchEvent(makeTouchEvent('touchstart', 0, 0));
    node.dispatchEvent(makeTouchEvent('touchend', 50, 0));

    expect(onSwipe).not.toHaveBeenCalled();
    unmount();
  });

  it('removes listeners on unmount', () => {
    expect.assertions(1);
    const onSwipe = vi.fn();
    const { node, unmount } = mountAttachment<HTMLElement>(useSwipe(onSwipe));

    unmount();
    node.dispatchEvent(makeTouchEvent('touchstart', 0, 0));
    node.dispatchEvent(makeTouchEvent('touchend', 200, 0));

    expect(onSwipe).not.toHaveBeenCalled();
  });
});
