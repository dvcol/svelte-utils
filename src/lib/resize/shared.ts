export type ResizeListener = (entries: ResizeObserverEntry[]) => void;

export const listeners = new WeakMap<Element, ResizeListener>();

let observer: ResizeObserver | undefined;

export function getObserver(): ResizeObserver {
  if (observer) return observer;
  observer = new ResizeObserver((entries) => {
    const grouped = new Map<Element, ResizeObserverEntry[]>();
    for (const entry of entries) {
      const list = grouped.get(entry.target);
      if (list) list.push(entry);
      else grouped.set(entry.target, [entry]);
    }
    for (const [target, group] of grouped) listeners.get(target)?.(group);
  });
  return observer;
}
