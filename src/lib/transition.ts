import { type AnimationConfig, flip, type FlipParams } from 'svelte/animate';
import { type EasingFunction, scale, type ScaleParams, slide, type TransitionConfig } from 'svelte/transition';

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
  T extends TransitionProps = TransitionProps,
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

export type HeightParams = BaseParams & OpacityParams & TransformParams;

/**
 * Animates the height of an element from 0 to the current height for `in` transitions and from the current height to 0 for `out` transitions.
 * If `freeze` is `true`, the width of the element will be frozen during the transition.
 * If `skip` is `true`, the transition will be skipped.
 * @default { easing: x => x, freeze: true, skip: false }
 */
export function height(
  node: Element,
  { easing = x => x, freeze = true, skip = false, css, opacity, transform = _css => _css, ...params }: HeightParams = {},
  { direction }: { direction?: 'in' | 'out' } = {},
): TransitionConfig {
  const { delay, duration, css: heightCss } = slide(node, { axis: 'y', easing, ...params });
  const _width = parseCSSString(node, 'width');

  return {
    delay,
    duration,
    easing,
    css: (t, u) => {
      if (evaluateFn(skip, node)) return '';
      let _css = css?.length ? `${css};\n` : '';
      if (heightCss) _css += heightCss(t, u);
      _css = _css.replace(/opacity: [0-9.]+;/, opacity ? `opacity: ${t};` : '');
      if (!evaluateFn(freeze, node) || direction === 'in') return transform(_css, t, u);
      return transform(`${_css};\nwidth: ${_width}px`, t, u);
    },
  };
}

export type OpacityParams = {
  /**
   * If `true`, the opacity will be gradually increased or decreased over the duration of the transition.
   */
  opacity?: boolean;
};
export type WidthParams = BaseParams & OpacityParams & TransformParams;

/**
 * Animates the width of an element from 0 to the current width for `in` transitions and from the current width to 0 for `out` transitions.
 * If `freeze` is `true`, the width of the element will be frozen during the transition.
 * If `skip` is `true`, the transition will be skipped.
 * @default { easing: x => x, freeze: true, skip: false }
 */
export function width(
  node: Element,
  { easing = x => x, freeze = true, skip = false, css, opacity, transform = _css => _css, ...params }: WidthParams = {},
  { direction }: { direction?: 'in' | 'out' } = {},
): TransitionConfig {
  const { delay, duration, css: widthCss } = slide(node, { axis: 'x', easing, ...params });
  const _height = parseCSSString(node, 'height');

  return {
    delay,
    duration,
    easing,
    css: (t, u) => {
      if (evaluateFn(skip, node)) return '';
      let _css = css?.length ? `${css};\n` : '';
      if (widthCss) _css += widthCss(t, u);
      _css = _css.replace(/opacity: [0-9.]+;/, opacity ? `opacity: ${t};` : '');
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
