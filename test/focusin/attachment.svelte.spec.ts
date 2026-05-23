import { flushSync } from 'svelte';
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

  it('fires onChange on focusout when previously focused', async () => {
    expect.assertions(2);
    vi.useFakeTimers();
    const onChange = vi.fn();
    const { node, unmount } = mountAttachment<HTMLElement>(
      useFocusin({ focusin: true, onChange, mirror: false }),
    );

    node.dispatchEvent(new FocusEvent('focusout'));
    await vi.advanceTimersByTimeAsync(1);

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith(false, expect.any(FocusEvent));
    unmount();
    vi.useRealTimers();
  });

  it('skips focusout when activeElement is still inside the node', async () => {
    expect.assertions(1);
    vi.useFakeTimers();
    const onChange = vi.fn();
    const { node, unmount } = mountAttachment<HTMLButtonElement>(
      useFocusin({ focusin: true, onChange, mirror: false }),
      'button',
    );

    node.focus();

    node.dispatchEvent(new FocusEvent('focusout'));
    await vi.advanceTimersByTimeAsync(1);

    expect(onChange).not.toHaveBeenCalled();
    unmount();
    vi.useRealTimers();
  });

  it('mirror: focuses the node when focusin becomes true', () => {
    expect.assertions(2);
    const cleanup = $effect.root(() => {
      let focused = $state(false);
      const { node, unmount } = mountAttachment<HTMLButtonElement>(
        useFocusin({
          get focusin() {
            return focused;
          },
        }),
        'button',
      );

      expect(document.activeElement).not.toBe(node);

      focused = true;
      flushSync();

      expect(document.activeElement).toBe(node);
      unmount();
    });
    cleanup();
  });

  it('mirror: focuses a focusable descendant when host itself is not focusable', () => {
    expect.assertions(1);
    const cleanup = $effect.root(() => {
      let focused = $state(false);
      const target = document.createElement('div');
      const child = document.createElement('button');
      target.appendChild(child);
      document.body.appendChild(target);

      const detach = useFocusin({
        get focusin() {
          return focused;
        },
      })(target);
      flushSync();

      focused = true;
      flushSync();

      expect(document.activeElement).toBe(child);

      if (typeof detach === 'function') detach();
      target.remove();
    });
    cleanup();
  });

  it('mirror: blurs the active element when focusin becomes false', () => {
    expect.assertions(2);
    const cleanup = $effect.root(() => {
      let focused = $state(true);
      const { node, unmount } = mountAttachment<HTMLButtonElement>(
        useFocusin({
          get focusin() {
            return focused;
          },
        }),
        'button',
      );

      flushSync();
      expect(document.activeElement).toBe(node);

      focused = false;
      flushSync();

      expect(document.activeElement).not.toBe(node);
      unmount();
    });
    cleanup();
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
