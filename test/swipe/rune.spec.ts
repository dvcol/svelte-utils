import { describe, expect, it, vi } from 'vitest';

import { useSwipe } from '~/swipe/rune.svelte.js';

function makeTouchEvent(type: string, x: number, y: number): TouchEvent {
  const touch = { clientX: x, clientY: y, identifier: 0 } as Touch;
  const event = new Event(type) as TouchEvent;
  Object.defineProperty(event, 'targetTouches', { value: [touch] });
  Object.defineProperty(event, 'changedTouches', { value: [touch] });
  return event;
}

describe('useSwipe rune', () => {
  it('returns ontouchstart and ontouchend handlers', () => {
    expect.assertions(2);
    const handlers = useSwipe();
    expect(typeof handlers.ontouchstart).toBe('function');
    expect(typeof handlers.ontouchend).toBe('function');
  });

  it('detects a horizontal swipe and invokes onSwipe', () => {
    expect.assertions(1);
    const onSwipe = vi.fn();
    const handlers = useSwipe({ onSwipe });

    handlers.ontouchstart(makeTouchEvent('touchstart', 0, 0) as never);
    handlers.ontouchend(makeTouchEvent('touchend', 200, 0) as never);

    expect(onSwipe).toHaveBeenCalledWith('right');
  });

  it('does not call onSwipe when start touch is missing', () => {
    expect.assertions(2);
    const onSwipe = vi.fn();
    const onTouchEnd = vi.fn();
    const handlers = useSwipe({ onSwipe, onTouchEnd });

    handlers.ontouchend(makeTouchEvent('touchend', 200, 0) as never);

    expect(onSwipe).not.toHaveBeenCalled();
    expect(onTouchEnd).toHaveBeenCalled();
  });

  it('calls onTouchStart and onTouchEnd hooks', () => {
    expect.assertions(2);
    const onTouchStart = vi.fn();
    const onTouchEnd = vi.fn();
    const handlers = useSwipe({ onTouchStart, onTouchEnd });

    handlers.ontouchstart(makeTouchEvent('touchstart', 0, 0) as never);
    handlers.ontouchend(makeTouchEvent('touchend', 0, 0) as never);

    expect(onTouchStart).toHaveBeenCalledOnce();
    expect(onTouchEnd).toHaveBeenCalledOnce();
  });
});
