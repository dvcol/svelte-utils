import { type EasingFunction, scale, type ScaleParams, type TransitionConfig } from 'svelte/transition';

export type TransitionProps = Record<string, any>;
export type TransitionFunction<T extends TransitionProps | undefined = TransitionProps | undefined> = (
  node: Element,
  props: T,
  options: { direction: 'in' | 'out' },
) => TransitionConfig | (() => TransitionConfig);

export interface BaseParams {
  /**
   * Delay before the transition starts in milliseconds.
   */
  delay?: number;
  /**
   * Duration of the transition in milliseconds.
   */
  duration?: number;
  /**
   * Easing function to apply to the transition.
   */
  easing?: EasingFunction;
  /**
   * Additional CSS to apply to the element during the transition.
   */
  css?: string;
  /**
   * If `false`, the transition will not be applied on the first render.
   */
  initial?: boolean;
}

export interface FreezeParams {
  /**
   * If `true`, the element size (height or width) will be frozen during the transition.
   */
  freeze?: boolean;
}

export type HeightParams = BaseParams & FreezeParams;

/**
 * Animates the height of an element from 0 to the current height for `in` transitions and from the current height to 0 for `out` transitions.
 */
export function height(
  node: Element,
  { delay = 0, duration = 400, easing = x => x, freeze = true, css }: HeightParams = {},
  { direction }: { direction?: 'in' | 'out' } = {},
): TransitionConfig {
  let _height = parseFloat(getComputedStyle(node).height);
  if (!_height || Number.isNaN(_height)) _height = 0;

  let _width = parseFloat(getComputedStyle(node).width);
  if (!_width || Number.isNaN(_width)) _width = 0;

  return {
    delay,
    duration,
    easing,
    css: t => {
      let _css = '';
      if (css?.length) _css = `${css};\n`;
      _css += `height: ${t * _height}px`;
      if (!freeze || direction === 'in') return _css;
      return `${_css};\nwidth: ${_width}px`;
    },
  };
}

export type WidthParams = BaseParams & FreezeParams;

/**
 * Animates the width of an element from 0 to the current width for `in` transitions and from the current width to 0 for `out` transitions.
 */
export function width(
  node: Element,
  { delay = 0, duration = 400, easing = x => x, freeze = true, css }: WidthParams = {},
  { direction }: { direction?: 'in' | 'out' } = {},
): TransitionConfig {
  let _width = parseFloat(getComputedStyle(node).width);
  if (!_width || Number.isNaN(_width)) _width = 0;

  let _height = parseFloat(getComputedStyle(node).height);
  if (!_height || Number.isNaN(_height)) _height = 0;

  return {
    delay,
    duration,
    easing,
    css: t => {
      let _css = '';
      if (css?.length) _css = `${css};\n`;
      _css += `width: ${t * _width}px`;
      if (!freeze || direction === 'in') return _css;
      return `${_css};\nheight: ${_height}px`;
    },
  };
}

export type ScaleFadeParams = BaseParams & ScaleParams & FreezeParams;

/**
 * Animates the opacity and scale of an element.
 * `in` transitions animate from an element's current (default) values to the provided values, passed as parameters.
 * `out` transitions animate from the provided values to an element's default values.
 */
export function scaleFadeInOut(
  node: Element,
  { duration = 400, start = 0.95, freeze = true, css, ...params }: ScaleFadeParams = {},
  { direction }: { direction?: 'in' | 'out' } = {},
): TransitionConfig {
  const { delay, easing, css: scaleCss } = scale(node, { duration, start, ...params });

  let _height = parseFloat(getComputedStyle(node).height);
  if (!_height || Number.isNaN(_height)) _height = 0;

  let _width = parseFloat(getComputedStyle(node).width);
  if (!_width || Number.isNaN(_width)) _width = 0;

  return {
    delay,
    duration,
    easing,
    css: (t, u) => {
      if (!freeze || direction === 'in') return [css, scaleCss?.(t, u)].filter(Boolean).join(';\n');
      return [`height: ${_height}px`, `width: ${_width}px`, scaleCss?.(t, u)].join(';\n');
    },
  };
}

/**
 * Combines the `width` and `scale` transitions to animate the width of an element.
 */
export function scaleWidth(node: Element, { duration = 400, start = 0.95, ...params }: ScaleFadeParams = {}): TransitionConfig {
  const { delay, easing, css: scaleCss } = scale(node, { duration, start, ...params });

  const { css: widthCss } = width(node, { duration, ...params });

  return {
    delay,
    duration,
    easing,
    css: (t, u) => {
      return [widthCss?.(t, u), scaleCss?.(t, u)].join(';\n');
    },
  };
}

/**
 * Combines the `height` and `scale` transitions to animate the height of an element.
 */
export function scaleHeight(node: Element, { duration = 400, start = 0.95, ...params }: ScaleFadeParams = {}): TransitionConfig {
  const { delay, easing, css: scaleCss } = scale(node, { duration, start, ...params });

  const { css: heightCss } = height(node, { duration, ...params });

  return {
    delay,
    duration,
    easing,
    css: (t, u) => {
      return [heightCss?.(t, u), scaleCss?.(t, u)].join(';\n');
    },
  };
}
