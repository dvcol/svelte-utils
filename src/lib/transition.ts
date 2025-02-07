import { type AnimationConfig, flip, type FlipParams } from 'svelte/animate';
import { type EasingFunction, scale, type ScaleParams, type TransitionConfig } from 'svelte/transition';

export type TransitionProps = Record<string, any>;
export type TransitionFunction<T extends TransitionProps | undefined = TransitionProps | undefined> = (
  node: Element,
  props: T,
  options: { direction: 'in' | 'out' },
) => TransitionConfig | (() => TransitionConfig);
export const emptyTransition: TransitionFunction = () => () => ({});

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
 * Parses a CSS property from a string to a number.
 * @param node - The element to parse the CSS property from.
 * @param css - The CSS property to parse.
 */
export const parseCSSString = (node: Element, css: keyof CSSStyleDeclaration) => {
  if (!node) return 0;
  let value = getComputedStyle(node)[css];
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return 0;
  if (!value) return 0;
  value = parseFloat(value);
  if (Number.isNaN(value)) return 0;
  return value;
};

/**
 * Animates the height of an element from 0 to the current height for `in` transitions and from the current height to 0 for `out` transitions.
 * @default { delay: 0, duration: 400, easing: x => x, freeze: true }
 */
export function height(
  node: Element,
  { delay = 0, duration = 400, easing = x => x, freeze = true, css }: HeightParams = {},
  { direction }: { direction?: 'in' | 'out' } = {},
): TransitionConfig {
  const _height = parseCSSString(node, 'height');
  const _width = parseCSSString(node, 'width');
  const _marginTop = parseCSSString(node, 'marginTop');
  const _marginBottom = parseCSSString(node, 'marginBottom');
  const _paddingTop = parseCSSString(node, 'paddingTop');
  const _paddingBottom = parseCSSString(node, 'paddingBottom');

  return {
    delay,
    duration,
    easing,
    css: t => {
      let _css = 'overflow: hidden;\n';
      if (css?.length) _css += `${css};\n`;
      if (_marginTop) _css += `margin-top: ${t * _marginTop}px;\n`;
      if (_marginBottom) _css += `margin-bottom: ${t * _marginBottom}px;\n`;
      if (_paddingTop) _css += `padding-top: ${t * _paddingTop}px;\n`;
      if (_paddingBottom) _css += `padding-bottom: ${t * _paddingBottom}px;\n`;
      _css += `height: ${t * _height}px`;
      if (!freeze || direction === 'in') return _css;
      return `${_css};\nwidth: ${_width}px`;
    },
  };
}

export type WidthParams = BaseParams & FreezeParams;

/**
 * Animates the width of an element from 0 to the current width for `in` transitions and from the current width to 0 for `out` transitions.
 * @default { delay: 0, duration: 400, easing: x => x, freeze: true }
 */
export function width(
  node: Element,
  { delay = 0, duration = 400, easing = x => x, freeze = true, css }: WidthParams = {},
  { direction }: { direction?: 'in' | 'out' } = {},
): TransitionConfig {
  const _width = parseCSSString(node, 'width');
  const _height = parseCSSString(node, 'height');
  const _marginRight = parseCSSString(node, 'marginRight');
  const _marginLeft = parseCSSString(node, 'marginLeft');
  const _paddingRight = parseCSSString(node, 'paddingRight');
  const _paddingLeft = parseCSSString(node, 'paddingLeft');

  return {
    delay,
    duration,
    easing,
    css: t => {
      let _css = 'overflow: hidden;\n';
      if (css?.length) _css += `${css};\n`;
      if (_marginRight) _css += `margin-right: ${t * _marginRight}px;\n`;
      if (_marginLeft) _css += `margin-left: ${t * _marginLeft}px;\n`;
      if (_paddingRight) _css += `padding-right: ${t * _paddingRight}px;\n`;
      if (_paddingLeft) _css += `padding-left: ${t * _paddingLeft}px;\n`;
      _css += `width: ${t * _width}px`;
      if (!freeze || direction === 'in') return _css;
      return `${_css};\nheight: ${_height}px`;
    },
  };
}

export type ScaleFreezeParams = BaseParams & ScaleParams & FreezeParams;

/**
 * Animates the opacity and scale of an element.
 * `in` transitions animate from an element's current (default) values to the provided values, passed as parameters.
 * `out` transitions animate from the provided values to an element's default values.
 * @default { duration: 400, start: 0.95, freeze: true }
 */
export function scaleFreeze(
  node: Element,
  { duration = 400, start = 0.95, freeze = true, css, ...params }: ScaleFreezeParams = {},
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

export type ScaleWidthParams = BaseParams &
  ScaleParams & { scale?: Omit<ScaleParams, 'duration' | 'delay' | 'easing'>; width?: Omit<WidthParams, 'duration' | 'delay' | 'easing'> };

/**
 * Combines the `width` and `scale` transitions to animate the width of an element.
 * @default { duration: 400, start: 0.95 }
 */
export function scaleWidth(
  node: Element,
  { duration = 400, start = 0.95, scale: scaleParam, width: widthParam, ...params }: ScaleWidthParams = {},
): TransitionConfig {
  const { delay, easing, css: scaleCss } = scale(node, { duration, start, ...params, ...scaleParam });

  const { css: widthCss } = width(node, { duration, ...params, ...widthParam });

  return {
    delay,
    duration,
    easing,
    css: (t, u) => {
      return [widthCss?.(t, u), scaleCss?.(t, u)].join(';\n');
    },
  };
}

export type ScaleHeightParams = BaseParams &
  ScaleParams & { scale?: Omit<ScaleParams, 'duration' | 'delay' | 'easing'>; height?: Omit<HeightParams, 'duration' | 'delay' | 'easing'> };

/**
 * Combines the `height` and `scale` transitions to animate the height of an element.
 * @default { duration: 400, start: 0.95 }
 */
export function scaleHeight(
  node: Element,
  { duration = 400, start = 0.95, scale: scaleParam, height: heightParam, ...params }: ScaleHeightParams = {},
): TransitionConfig {
  const { delay, easing, css: scaleCss } = scale(node, { duration, start, ...params, ...scaleParam });

  const { css: heightCss } = height(node, { duration, ...params, ...heightParam });

  return {
    delay,
    duration,
    easing,
    css: (t, u) => {
      return [heightCss?.(t, u), scaleCss?.(t, u)].join(';\n');
    },
  };
}

export type AnimationProps = Record<string, any>;
export type AnimationFunction<T extends AnimationProps | undefined = AnimationProps | undefined> = (
  node: Element,
  directions: { from: DOMRect; to: DOMRect },
  params?: T,
) => AnimationConfig;
export const emptyAnimation: AnimationFunction = () => ({});

export type AnimationWithProps<T extends AnimationProps = AnimationProps> = {
  /**
   * Transition function.
   */
  use: AnimationFunction<T>;
  /**
   * Optional transition props.
   */
  props?: T;
};

export type FlipToggleParams = FlipParams & { enabled?: boolean };
export const flipToggle: AnimationFunction<FlipToggleParams> = (node, directions, params) =>
  params?.enabled === false ? {} : flip(node, directions, params);
