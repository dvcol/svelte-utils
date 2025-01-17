import type { Action } from 'svelte/action';

type MutationCallback = (entry: MutationRecord, index: number, entries: MutationRecord[]) => void;
type MutationOptions = { callback: MutationCallback; options: MutationObserverInit };

/**
 * Watch for mutations on an element.
 *
 * @see https://github.com/whatwg/dom/issues/126
 * @param node
 * @param parameters
 */
export const mutation: Action<Element, MutationOptions> = (node: Element, parameters: MutationOptions | MutationCallback) => {
  let observer: MutationObserver | null = null;

  function destroy() {
    observer?.disconnect();
    observer = null;
  }

  function update(options: MutationOptions | MutationCallback) {
    destroy();

    const cb = typeof options === 'function' ? options : options.callback;
    const opt = typeof options === 'function' ? undefined : options.options;

    observer = new MutationObserver(mutations => {
      mutations.forEach(cb);
    });
    observer.observe(node, opt);
  }

  update(parameters);

  return {
    update,
    destroy,
  };
};
