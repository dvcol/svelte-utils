import { describe, expect, it, vi } from 'vitest';

import { useHovering } from '~/hovering/attachment.js';

import { mountAttachment } from '../helpers.svelte.js';

describe('useHovering', () => {
  it('fires onChange on pointerenter', () => {
    expect.assertions(2);
    const onChange = vi.fn();
    const { node, unmount } = mountAttachment<HTMLElement>(useHovering({ onChange }));

    node.dispatchEvent(new PointerEvent('pointerenter'));

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith(true, expect.any(PointerEvent));
    unmount();
  });

  it('fires onChange on pointerleave when previously hovered', () => {
    expect.assertions(2);
    const onChange = vi.fn();
    const { node, unmount } = mountAttachment<HTMLElement>(useHovering({ onChange }));

    node.dispatchEvent(new PointerEvent('pointerenter'));
    node.dispatchEvent(new PointerEvent('pointerleave'));

    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenLastCalledWith(false, expect.any(PointerEvent));
    unmount();
  });

  it('does not fire pointerleave when not hovered', () => {
    expect.assertions(1);
    const onChange = vi.fn();
    const { node, unmount } = mountAttachment<HTMLElement>(useHovering({ onChange }));

    node.dispatchEvent(new PointerEvent('pointerleave'));

    expect(onChange).not.toHaveBeenCalled();
    unmount();
  });

  it('removes listeners on unmount', () => {
    expect.assertions(1);
    const onChange = vi.fn();
    const { node, unmount } = mountAttachment<HTMLElement>(useHovering({ onChange }));

    unmount();
    node.dispatchEvent(new PointerEvent('pointerenter'));

    expect(onChange).not.toHaveBeenCalled();
  });
});
