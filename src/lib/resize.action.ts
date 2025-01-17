import type { Action } from 'svelte/action';

type ResizeCallback = (entry: ResizeObserverEntry, index: number, entries: ResizeObserverEntry[]) => void;
type ResizeOptions = {
  callback: ResizeCallback;
  options?: ResizeObserverOptions;
};

const callbacks = new WeakMap<Element, ResizeCallback>();
let observer: ResizeObserver;

export const resize: Action<Element, ResizeOptions> = (target: Element, parameters: ResizeOptions | ResizeCallback) => {
  if (!observer) {
    observer = new ResizeObserver(entries =>
      entries.forEach((entry, i) => {
        const callback = callbacks.get(entry.target);
        callback?.(entry, i, entries);
      }),
    );
  }

  function destroy() {
    observer.unobserve(target);
    callbacks.delete(target);
  }

  function update(options: ResizeOptions | ResizeCallback) {
    destroy();

    const cb = typeof options === 'function' ? options : options.callback;
    const opt = typeof options === 'function' ? undefined : options.options;

    callbacks.set(target, cb);
    observer.observe(target, opt);
  }

  update(parameters);

  return {
    destroy,
    update,
  };
};
