import { clamp } from '@dvcol/common-utils/common/math';
import { type AnimationConfig, flip, type FlipParams } from 'svelte/animate';
import { cubicOut } from 'svelte/easing';
import { type EasingFunction, type FlyParams, scale, type ScaleParams, slide, type TransitionConfig } from 'svelte/transition';

export type TransitionProps = Record<string, any>;
export type TransitionFunction<T extends TransitionProps | undefined = TransitionProps | undefined> = (
  node: Element,
  props: T,
  options: { direction: 'in' | 'out' },
) => TransitionConfig | (() => TransitionConfig);
export const emptyTransition: TransitionFunction = () => () => ({});

export type AnimationProps = Record<string, any>;
export type AnimationFunction<T extends AnimationProps | undefined = AnimationProps | undefined> = (
  node: Element,
  directions: { from: DOMRect; to: DOMRect },
  params?: T,
) => AnimationConfig;
export const emptyAnimation: AnimationFunction = () => ({});

export type TransitionWithProps<
  T extends TransitionProps | undefined = TransitionProps,
  F extends TransitionFunction<T> | AnimationFunction<T> = TransitionFunction<T>,
> = {
  /**
   * Transition function.
   */
  use: F;
  /**
   * Optional transition props.
   */
  props?: T;
};

export type AnimationWithProps<T extends AnimationProps | undefined = AnimationProps> = {
  /**
   * Transition function.
   */
  use: AnimationFunction<T>;
  /**
   * Optional transition props.
   */
  props?: T;
};

export type FreezeParams = {
  /**
   * If `true`, the element size (height or width) will be frozen during the transition.
   */
  freeze?: boolean | ((node: Element) => boolean);
};

export type SkipParams = {
  /**
   * If `true`, the transition will be skipped.
   */
  skip?: boolean | ((node: Element) => boolean);
};

export type TransformParams = {
  /**
   * Transform function to apply to the css after parsing.
   */
  transform?: (css: string, t: number, u: number) => string;
};

export type BaseParams = {
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
} & FreezeParams &
  SkipParams;

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

const evaluateFn = (value: boolean | BaseParams['skip'] | BaseParams['freeze'], node: Element) => {
  if (typeof value === 'function') return value(node);
  return value;
};

export type OpacityParams = {
  /**
   * The opacity will be gradually increased (or decreased) over the duration of the transition.
   * The opacity will range from the current (or minimum) opacity to the provided minimum (or current).
   */
  opacity?:
    | boolean
    | {
        /**
         * Minimum opacity to respect (before entering, or after leaving)
         * @default 0
         */
        minimum?: number;
        /**
         * Easing to use
         * @default the parent transition easing
         */
        easing?: EasingFunction;
      };
};
export type WidthParams = BaseParams & OpacityParams & TransformParams;

const opacityRegex = /opacity: [0-9.]+;/;
const replaceOpacity = (css: string, min: boolean | number = false, value: number) => {
  if (min === false) return css.replace(opacityRegex, '');
  return css.replace(opacityRegex, `opacity: ${clamp(value, typeof min === 'number' ? min : 0, 1)};`);
};

export type HeightParams = BaseParams & OpacityParams & TransformParams;

/**
 * Animates the height of an element from 0 to the current height for `in` transitions and from the current height to 0 for `out` transitions.
 * If `freeze` is `true`, the width of the element will be frozen during the transition.
 * If `skip` is `true`, the transition will be skipped.
 * If `opacity` is a truthy, the opacity will be gradually increased or decreased over the duration.
 * @default { easing: x => x, freeze: true, skip: false }
 */
export function height(
  node: Element,
  { easing = x => x, freeze = true, skip = false, css, opacity, transform = _css => _css, ...params }: HeightParams = {},
  { direction }: { direction?: 'in' | 'out' } = {},
): TransitionConfig {
  const { delay, duration, css: heightCss } = slide(node, { axis: 'y', easing, ...params });
  const _width = parseCSSString(node, 'width');
  const _opacity = +getComputedStyle(node).opacity;
  const { minimum = 0, easing: opacityEasing = easing } = typeof opacity === 'object' ? opacity : {};

  return {
    delay,
    duration,
    easing,
    css: (t, u) => {
      if (evaluateFn(skip, node)) return '';
      let _css = css?.length ? `${css};\n` : '';
      if (heightCss) _css += heightCss(t, u);
      if (opacity) _css = replaceOpacity(_css, minimum, opacityEasing(t) * _opacity);
      if (!evaluateFn(freeze, node) || direction === 'in') return transform(_css, t, u);
      return transform(`${_css};\nwidth: ${_width}px`, t, u);
    },
  };
}

/**
 * Animates the width of an element from 0 to the current width for `in` transitions and from the current width to 0 for `out` transitions.
 * If `freeze` is `true`, the width of the element will be frozen during the transition.
 * If `skip` is `true`, the transition will be skipped.
 * If `opacity` is a number, the opacity will be gradually increased or decreased over the duration of the transition but never below the provided value.
 * @default { easing: x => x, freeze: true, skip: false }
 */
export function width(
  node: Element,
  { easing = x => x, freeze = true, skip = false, css, opacity, transform = _css => _css, ...params }: WidthParams = {},
  { direction }: { direction?: 'in' | 'out' } = {},
): TransitionConfig {
  const { delay, duration, css: widthCss } = slide(node, { axis: 'x', easing, ...params });
  const _height = parseCSSString(node, 'height');
  const _opacity = +getComputedStyle(node).opacity;
  const { minimum = 0, easing: opacityEasing = easing } = typeof opacity === 'object' ? opacity : {};

  return {
    delay,
    duration,
    easing,
    css: (t, u) => {
      if (evaluateFn(skip, node)) return '';
      let _css = css?.length ? `${css};\n` : '';
      if (widthCss) _css += widthCss(t, u);
      if (opacity) _css = replaceOpacity(_css, minimum, opacityEasing(t) * _opacity);
      if (!evaluateFn(freeze, node) || direction === 'in') return transform(_css, t, u);
      return transform(`${_css};\nheight: ${_height}px`, t, u);
    },
  };
}

/**
 * Composes multiple transitions into a single transition.
 * @param transitions - The transition functions and their props to compose into one.
 */
export function composeTransition<T extends TransitionProps = TransitionProps>(...transitions: TransitionWithProps<T>[]): TransitionFunction<T> {
  return (node, params, options) => {
    const _transitions = transitions.map(({ use, props }) => {
      return use(node, { ...params, ...props }, options);
    });

    return {
      delay: params.delay ?? 0,
      duration: params.duration ?? 400,
      easing: params.easing ?? (x => x),
      css: (t, u) => {
        if (params.skip && evaluateFn(params.skip, node)) return '';
        const _css = _transitions
          .map(transition => {
            if (typeof transition === 'function') return transition().css?.(t, u);
            return transition.css?.(t, u);
          })
          .filter(Boolean)
          .join(';\n');
        if (params.transform) return params.transform(_css, t, u);
        return _css;
      },
    };
  };
}

export type ScaleFreezeParams = BaseParams & ScaleParams;

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
  { duration = 400, start = 0.95, scale: scaleParam, width: widthParam, opacity, ...params }: ScaleWidthParams = {},
): TransitionConfig {
  const { delay, easing, css: scaleCss } = scale(node, { duration, start, opacity, ...params, ...scaleParam });

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
  { duration = 400, start = 0.95, scale: scaleParam, height: heightParam, opacity, ...params }: ScaleHeightParams = {},
): TransitionConfig {
  const { delay, easing, css: scaleCss } = scale(node, { duration, start, opacity, ...params, ...scaleParam });

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

export type FlipToggleParams = FlipParams & SkipParams;
export const flipToggle: AnimationFunction<FlipToggleParams> = (node, directions, { skip, ...params } = {}) =>
  evaluateFn(skip, node) ? {} : flip(node, directions, params);

type FlyUnit = { value: number; unit: string };
type FlyValue = number | string | FlyUnit;
const regexCssUnit = /^\s*(-?[\d.]+)(\S*)\s*$/;

function splitCssUnit(value: FlyValue): FlyUnit {
  if (typeof value === 'object') return value;
  if (typeof value === 'number') return { value, unit: 'px' };
  const split = value.match(regexCssUnit);
  return {
    value: Number.parseFloat(split?.[1] ?? '0'),
    unit: split?.[2] || 'px',
  };
}

type StartValue = string | number | { x?: FlyValue; y?: FlyValue };
type StartFunction = (options: { node: Element; style: CSSStyleDeclaration }) => StartValue;

function parseStartValue(node: Element, style: CSSStyleDeclaration, start: StartValue | StartFunction): { x: string; y: string } {
  const value = typeof start === 'function' ? start({ node, style }) : (start ?? {});
  const { x = 0, y = 0 } = typeof value === 'object' ? value : { x: value, y: value };
  const { value: x_value, unit: x_unit } = splitCssUnit(x);
  const { value: y_value, unit: y_unit } = splitCssUnit(y);
  return { x: `${x_value}${x_unit}`, y: `${y_value}${y_unit}` };
}

export type FlyFrom = Omit<FlyParams, 'x' | 'y'> & {
  x?: FlyValue;
  y?: FlyValue;
  start?: StartValue | StartFunction;
};

/* Animates the x and y positions and the opacity of an element. `in` transitions animate from the provided values, passed as parameters to the element's default values. `out` transitions animate from the element's default values to the provided values.
 *
 * @param {Element} node
 * @param {FlyFrom} [params]
 * @returns {TransitionConfig}
 */
export function flyFrom(
  node: Element,
  { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0, start = 0 }: FlyFrom = {},
): TransitionConfig {
  const style = getComputedStyle(node);
  const target_opacity = +style.opacity;
  const transform = style.transform === 'none' ? '' : style.transform;
  const od = target_opacity * (1 - opacity);
  const { value: x_value, unit: x_unit } = splitCssUnit(x);
  const { value: y_value, unit: y_unit } = splitCssUnit(y);
  const { x: start_x, y: start_y } = parseStartValue(node, style, start);
  return {
    delay,
    duration,
    easing,
    css: (t, u) => `
      transform: ${transform} translate(calc(${start_x} + ${(1 - t) * x_value}${x_unit}), calc(${start_y} + ${(1 - t) * y_value}${y_unit}));
      opacity: ${target_opacity - od * u}`,
  };
}
