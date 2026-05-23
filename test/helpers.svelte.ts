import type { Attachment } from 'svelte/attachments';

import { flushSync, mount, unmount } from 'svelte';

import Host from './Host.svelte';

export interface MountedAttachment<E extends Element = Element> {
  node: E;
  unmount: () => void;
}

export function mountAttachment<E extends Element = HTMLElement>(
  attach: Attachment<E>,
  tag: keyof HTMLElementTagNameMap = 'div',
): MountedAttachment<E> {
  const target = document.createElement('div');
  document.body.appendChild(target);

  const component = mount(Host, {
    target,
    props: { attach: attach as Attachment<Element>, tag },
  });

  flushSync();

  const node = target.querySelector(tag) as unknown as E;
  return {
    node,
    unmount: () => {
      void unmount(component);
      target.remove();
    },
  };
}
