import type { Component, Snippet } from 'svelte';

export type AnyComponent<
  Props extends Record<string, any> = any,
  Exports extends Record<string, any> = any,
  Bindings extends keyof Props | string = string,
> = Component<Props, Exports, Bindings>;

export type LazyComponentImport<
  Props extends Record<string, any> = any,
  Exports extends Record<string, any> = any,
  Bindings extends keyof Props | string = string,
> = (() => Promise<{ default: AnyComponent<Props, Exports, Bindings> }>) & { _isLazyComponent?: boolean };

export type ComponentOrLazy<
  Props extends Record<string, any> = any,
  Exports extends Record<string, any> = any,
  Bindings extends keyof Props | string = string,
> = (AnyComponent<Props, Exports, Bindings> | LazyComponentImport<Props, Exports, Bindings>) & { _isLazyComponent?: boolean };

export const isLazyComponent = <
  Props extends Record<string, any> = any,
  Exports extends Record<string, any> = any,
  Bindings extends keyof Props | string = string,
>(
  component?: ComponentOrLazy<Props, Exports, Bindings>,
): component is LazyComponentImport<Props, Exports, Bindings> =>
  !!(
    component &&
    typeof component === 'function' &&
    // Wrapped with toLazyComponent
    (component._isLazyComponent ||
      // Wrapped in async function
      component.constructor.name === 'AsyncFunction' ||
      // Arrow function named as component
      component.name === 'component')
  );

export type AnySnippet = Snippet<any>;

export const isSnippet = <
  Props extends Record<string, any> = any,
  Exports extends Record<string, any> = any,
  Bindings extends keyof Props | string = string,
>(
  componentOrSnippet: ComponentOrLazy<Props, Exports, Bindings> | AnySnippet,
): componentOrSnippet is AnySnippet => componentOrSnippet?.length === 1;

export const toLazyComponent = <
  Props extends Record<string, any> = any,
  Exports extends Record<string, any> = any,
  Bindings extends keyof Props | string = string,
>(
  fn: () => Promise<unknown>,
): LazyComponentImport<Props, Exports, Bindings> => {
  const component = fn as LazyComponentImport<Props, Exports, Bindings>;
  component._isLazyComponent = true;
  return component;
};

export function isSyncComponentOrSnippet<
  Props extends Record<string, any> = any,
  Exports extends Record<string, any> = any,
  Bindings extends keyof Props | string = string,
>(component: ComponentOrLazy<Props, Exports, Bindings> | AnySnippet): component is AnyComponent<Props, Exports, Bindings> | AnySnippet {
  return isSnippet(component) || !isLazyComponent(component);
}

export async function resolveComponent<
  Props extends Record<string, any> = any,
  Exports extends Record<string, any> = any,
  Bindings extends keyof Props | string = string,
>(
  component?: ComponentOrLazy<Props, Exports, Bindings> | AnySnippet,
  {
    onStart,
    onLoading,
    onLoaded,
    onError,
  }: {
    onStart?: () => unknown | Promise<unknown>;
    onLoading?: () => unknown | Promise<unknown>;
    onLoaded?: (component?: Component<Props, Exports, Bindings> | AnySnippet) => unknown | Promise<unknown>;
    onError?: (error: unknown) => unknown | Promise<unknown>;
  } = {},
): Promise<Component<Props, Exports, Bindings> | AnySnippet | AnyComponent<Props, Exports, Bindings> | undefined> {
  if (!component || isSyncComponentOrSnippet(component)) {
    await onStart?.();
    await onLoaded?.(component);
    return component;
  }
  return resolveAsyncComponent(component, { onStart, onLoading, onLoaded, onError });
}

export async function resolveAsyncComponent<
  Props extends Record<string, any> = any,
  Exports extends Record<string, any> = any,
  Bindings extends keyof Props | string = string,
>(
  component: LazyComponentImport<Props, Exports, Bindings>,
  {
    onStart,
    onLoading,
    onLoaded,
    onError,
  }: {
    onStart?: () => unknown | Promise<unknown>;
    onLoading?: () => unknown | Promise<unknown>;
    onLoaded?: (component?: Component<Props, Exports, Bindings> | AnySnippet) => unknown | Promise<unknown>;
    onError?: (error: unknown) => unknown | Promise<unknown>;
  } = {},
): Promise<AnyComponent<Props, Exports, Bindings> | undefined> {
  await onStart?.();
  onLoading?.();
  try {
    const awaited = await component();
    await onLoaded?.(awaited.default);
    return awaited.default;
  } catch (error) {
    await onError?.(error);
    return undefined;
  }
}
