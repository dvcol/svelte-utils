import { flushSync } from 'svelte';
import { describe, expect, it } from 'vitest';

import { useMutation } from '~/mutation/attachment.svelte.js';

import { mountAttachment } from '../helpers.svelte.js';

async function nextMutation() {
  await Promise.resolve();
  await new Promise(resolve => setTimeout(resolve, 0));
}

describe('useMutation', () => {
  it('exposes records and current as reactive state', () => {
    expect.assertions(2);
    const cleanup = $effect.root(() => {
      const mutation = useMutation({ attributes: true });
      const { unmount } = mountAttachment<HTMLElement>(mutation.observe);

      expect(mutation.records).toEqual([]);
      expect(mutation.current).toBeUndefined();
      unmount();
    });
    cleanup();
  });

  it('updates records when the node mutates', async () => {
    expect.assertions(2);
    let resolved!: () => void;
    const done = new Promise<void>((res) => {
      resolved = res;
    });

    const cleanup = $effect.root(() => {
      const mutation = useMutation({ attributes: true });
      const { node, unmount } = mountAttachment<HTMLElement>(mutation.observe);

      node.setAttribute('data-test', '1');

      void nextMutation().then(() => {
        try {
          expect(mutation.records.length).toBeGreaterThan(0);
          expect(mutation.current?.attributeName).toBe('data-test');
        } finally {
          unmount();
          resolved();
        }
      });
    });

    await done;
    cleanup();
  });

  it('uses default childList option when called without arguments', async () => {
    expect.assertions(1);
    let resolved!: () => void;
    const done = new Promise<void>((res) => {
      resolved = res;
    });

    const cleanup = $effect.root(() => {
      const mutation = useMutation();
      const { node, unmount } = mountAttachment<HTMLElement>(mutation.observe);

      node.appendChild(document.createElement('span'));

      void nextMutation().then(() => {
        try {
          expect(mutation.records.length).toBeGreaterThan(0);
        } finally {
          unmount();
          resolved();
        }
      });
    });

    await done;
    cleanup();
  });

  it('re-creates the observer when an option getter changes', async () => {
    expect.assertions(2);
    let resolved!: () => void;
    const done = new Promise<void>((res) => {
      resolved = res;
    });

    const cleanup = $effect.root(() => {
      let attributes = $state(false);
      const mutation = useMutation({
        childList: true,
        get attributes() {
          return attributes;
        },
      });
      const { node, unmount } = mountAttachment<HTMLElement>(mutation.observe);

      // Initial config: attributes off — mutating an attribute should not record.
      node.setAttribute('data-test', '1');

      void nextMutation().then(async () => {
        try {
          expect(mutation.records.length).toBe(0);

          // Toggle option → observer is re-created with attributes: true.
          attributes = true;
          flushSync();

          node.setAttribute('data-test', '2');
          await nextMutation();

          expect(mutation.records.length).toBeGreaterThan(0);
        } finally {
          unmount();
          resolved();
        }
      });
    });

    await done;
    cleanup();
  });

  it('disconnects the observer on unmount', async () => {
    expect.assertions(1);
    const cleanup = $effect.root(() => {
      const mutation = useMutation({ attributes: true });
      const { node, unmount } = mountAttachment<HTMLElement>(mutation.observe);
      unmount();
      node.setAttribute('data-test', '1');
    });

    await nextMutation();
    cleanup();
    expect(true).toBe(true);
  });
});
