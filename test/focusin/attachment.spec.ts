import { describe, expect, it, vi } from 'vitest';

import { useFocusin } from '~/focusin/attachment.svelte.js';

import { mountAttachment } from '../helpers.svelte.js';

describe('useFocusin', () => {
  it('fires onChange on focusin', () => {
    expect.assertions(2);
    const onChange = vi.fn();
    const { node, unmount } = mountAttachment<HTMLElement>(
      useFocusin({ onChange, mirror: false }),
    );

    node.dispatchEvent(new FocusEvent('focusin'));

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith(true, expect.any(FocusEvent));
    unmount();
  });

  it('skips onChange when value did not change', () => {
    expect.assertions(1);
    const onChange = vi.fn();
    const { node, unmount } = mountAttachment<HTMLElement>(
      useFocusin({ focusin: true, onChange, mirror: false }),
    );

    node.dispatchEvent(new FocusEvent('focusin'));

    expect(onChange).not.toHaveBeenCalled();
    unmount();
  });

  it('removes listeners on unmount', () => {
    expect.assertions(1);
    const onChange = vi.fn();
    const { node, unmount } = mountAttachment<HTMLElement>(
      useFocusin({ onChange, mirror: false }),
    );

    unmount();
    node.dispatchEvent(new FocusEvent('focusin'));

    expect(onChange).not.toHaveBeenCalled();
  });
});
