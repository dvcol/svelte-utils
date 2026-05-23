import { describe, expect, it } from 'vitest';

import {
  composeTransition,
  emptyAnimation,
  emptyTransition,
  flipToggle,
  flyFrom,
  height,
  isTransitionWithProps,
  isWithProps,
  parseCSSString,
  scaleFreeze,
  scaleHeight,
  scaleValue,
  scaleWidth,
  toAnimation,
  toTransition,
  toTransitionProps,
  unwrap,
  unwrapProps,
  width,
} from '~/transitions/transition.js';

function makeNode() {
  const node = document.createElement('div');
  node.style.width = '100px';
  node.style.height = '50px';
  document.body.appendChild(node);
  return node;
}

describe('transition', () => {
  describe('parseCSSString', () => {
    it('returns 0 when node is missing', () => {
      expect.assertions(1);
      expect(parseCSSString(null as unknown as Element, 'width')).toBe(0);
    });

    it('parses pixel-style numeric properties', () => {
      expect.assertions(1);
      const node = makeNode();
      const value = parseCSSString(node, 'width');
      expect(typeof value).toBe('number');
    });

    it('returns 0 when computed style yields an empty string', () => {
      expect.assertions(1);
      const node = makeNode();
      // an unset property returns '' from getComputedStyle in jsdom
      expect(parseCSSString(node, 'borderTopColor')).toBe(0);
    });

    it('returns 0 when the parsed value is NaN', () => {
      expect.assertions(1);
      const node = makeNode();
      // 'cursor' returns 'auto' — Number.parseFloat('auto') is NaN
      node.style.cursor = 'auto';
      expect(parseCSSString(node, 'cursor')).toBe(0);
    });
  });

  describe('emptyTransition / emptyAnimation', () => {
    it('returns empty configs', () => {
      expect.assertions(2);
      expect(emptyAnimation({} as Element, { from: new DOMRect(), to: new DOMRect() })).toEqual({});
      const result = emptyTransition({} as Element, undefined, { direction: 'in' });
      expect(typeof result).toBe('function');
    });
  });

  describe('height / width', () => {
    it('returns a TransitionConfig with css fn', () => {
      expect.assertions(2);
      const node = makeNode();
      const config = height(node);
      expect(config).toHaveProperty('css');
      expect(typeof config.css).toBe('function');
    });

    it('skip flag short-circuits to empty css', () => {
      expect.assertions(1);
      const node = makeNode();
      const config = width(node, { skip: true });
      expect(config.css?.(0.5, 0.5)).toBe('');
    });

    it('freeze:false produces a string css output', () => {
      expect.assertions(1);
      const node = makeNode();
      const config = height(node, { freeze: false }, { direction: 'in' });
      const css = config.css?.(0.5, 0.5);
      expect(typeof css).toBe('string');
    });

    it('height: default freeze + direction:out emits a width: lock', () => {
      expect.assertions(1);
      const node = makeNode();
      const config = height(node, { css: 'foo: bar' }, { direction: 'out' });
      const css = config.css?.(0.5, 0.5);
      expect(css).toContain('width:');
    });

    it('width: default freeze + direction:out emits a height: lock', () => {
      expect.assertions(1);
      const node = makeNode();
      const config = width(node, { css: 'foo: bar' }, { direction: 'out' });
      const css = config.css?.(0.5, 0.5);
      expect(css).toContain('height:');
    });

    it('opacity option clamps replaceOpacity range', () => {
      expect.assertions(1);
      const node = makeNode();
      const config = height(node, { opacity: { minimum: 0.25 } }, { direction: 'in' });
      const css = config.css?.(0.5, 0.5);
      expect(typeof css).toBe('string');
    });
  });

  describe('composeTransition', () => {
    it('combines multiple transitions into one css string', () => {
      expect.assertions(1);
      const node = makeNode();
      const transition = composeTransition(
        { use: height },
        { use: width },
      );
      const config = transition(node, {}, { direction: 'in' });
      const css = typeof config === 'function' ? '' : config.css?.(0.5, 0.5);
      expect(typeof css).toBe('string');
    });
  });

  describe('scaleFreeze / scaleWidth / scaleHeight', () => {
    it('all return TransitionConfigs with css fns', () => {
      expect.assertions(3);
      const node = makeNode();
      expect(typeof scaleFreeze(node).css).toBe('function');
      expect(typeof scaleWidth(node).css).toBe('function');
      expect(typeof scaleHeight(node).css).toBe('function');
    });

    it('scaleFreeze: freeze branch emits frozen width/height', () => {
      expect.assertions(2);
      const node = makeNode();
      const css = scaleFreeze(node, { css: 'foo: bar' }).css?.(0.5, 0.5);
      expect(css).toContain('height:');
      expect(css).toContain('width:');
    });

    it('scaleFreeze: direction:in skips the freeze branch', () => {
      expect.assertions(1);
      const node = makeNode();
      const css = scaleFreeze(node, { css: 'foo: bar' }, { direction: 'in' }).css?.(0.5, 0.5);
      // freeze branch would emit "height: …px; width: …px" — skipped here
      expect(css).not.toContain('width: 100px');
    });

    it('scaleWidth: css() returns a non-empty string', () => {
      expect.assertions(1);
      const node = makeNode();
      const css = scaleWidth(node).css?.(0.5, 0.5);
      expect(typeof css).toBe('string');
    });

    it('scaleHeight: css() returns a non-empty string', () => {
      expect.assertions(1);
      const node = makeNode();
      const css = scaleHeight(node).css?.(0.5, 0.5);
      expect(typeof css).toBe('string');
    });
  });

  describe('flipToggle', () => {
    it('returns empty config when skip is true', () => {
      expect.assertions(1);
      const node = makeNode();
      const result = flipToggle(node, { from: new DOMRect(), to: new DOMRect() }, { skip: true });
      expect(result).toEqual({});
    });
  });

  describe('flyFrom', () => {
    it('emits opacity and transform CSS', () => {
      expect.assertions(2);
      const node = makeNode();
      const config = flyFrom(node, { x: 10, y: 20 });
      const css = config.css?.(0.5, 0.5);
      expect(css).toContain('opacity:');
      expect(css).toContain('translate(');
    });

    it('accepts string CSS units for x/y via splitCssUnit', () => {
      expect.assertions(2);
      const node = makeNode();
      const config = flyFrom(node, { x: '10em', y: '20%' });
      const css = config.css?.(0.5, 0.5);
      expect(css).toContain('em');
      expect(css).toContain('%');
    });

    it('supports a function start value', () => {
      expect.assertions(1);
      const node = makeNode();
      const config = flyFrom(node, { start: () => ({ x: 5, y: '10px' }) });
      const css = config.css?.(0.5, 0.5);
      expect(css).toContain('translate(');
    });
  });

  describe('scaleValue', () => {
    it('produces a scale() css fragment', () => {
      expect.assertions(1);
      const fn = scaleValue(0.5);
      expect(fn(0.5, 0.5)).toMatch(/scale\(/);
    });
  });

  describe('isWithProps', () => {
    it('narrows wrapper objects', () => {
      expect.assertions(1);
      expect(isWithProps({ use: () => ({}) })).toBe(true);
    });

    it('rejects bare callables', () => {
      expect.assertions(1);
      expect(isWithProps(() => ({}))).toBe(false);
    });

    it('rejects wrappers whose use is undefined', () => {
      expect.assertions(1);
      expect(isWithProps({ use: undefined } as unknown as { use: () => void })).toBe(false);
    });

    it('rejects nullish and non-object inputs', () => {
      expect.assertions(3);
      expect(isWithProps(undefined)).toBe(false);
      expect(isWithProps(null as unknown as undefined)).toBe(false);
      expect(isWithProps(42 as unknown as undefined)).toBe(false);
    });
  });

  describe('unwrap', () => {
    it('returns use from a wrapper', () => {
      expect.assertions(1);
      const fn = () => ({});
      expect(unwrap({ use: fn })).toBe(fn);
    });

    it('passes bare callables through', () => {
      expect.assertions(1);
      const fn = () => ({});
      expect(unwrap(fn)).toBe(fn);
    });

    it('returns fallback for undefined', () => {
      expect.assertions(1);
      const fallback = () => ({});
      expect(unwrap(undefined, fallback)).toBe(fallback);
    });

    it('returns undefined when no fallback is provided', () => {
      expect.assertions(1);
      expect(unwrap(undefined)).toBeUndefined();
    });
  });

  describe('unwrapProps', () => {
    it('returns props from wrapper', () => {
      expect.assertions(1);
      const props = { foo: 'bar' };
      expect(unwrapProps({ use: () => ({}), props })).toBe(props);
    });

    it('returns fallback for bare callable', () => {
      expect.assertions(1);
      const fallback = { foo: 'bar' };
      expect(unwrapProps(() => ({}), fallback)).toBe(fallback);
    });

    it('returns fallback for undefined', () => {
      expect.assertions(1);
      const fallback = { foo: 'bar' };
      expect(unwrapProps(undefined, fallback)).toBe(fallback);
    });
  });

  describe('isTransitionWithProps', () => {
    it('returns true for a transition wrapper', () => {
      expect.assertions(1);
      expect(isTransitionWithProps({ use: emptyTransition })).toBe(true);
    });

    it('returns false for a bare transition', () => {
      expect.assertions(1);
      expect(isTransitionWithProps(emptyTransition)).toBe(false);
    });
  });

  describe('toTransition', () => {
    it('unwraps a wrapper', () => {
      expect.assertions(1);
      const fn = emptyTransition;
      expect(toTransition({ use: fn })).toBe(fn);
    });

    it('passes a bare function through', () => {
      expect.assertions(1);
      expect(toTransition(emptyTransition)).toBe(emptyTransition);
    });

    it('falls back to emptyTransition for undefined', () => {
      expect.assertions(1);
      expect(toTransition(undefined)).toBe(emptyTransition);
    });

    it('honours a custom fallback', () => {
      expect.assertions(1);
      const fallback = emptyTransition;
      expect(toTransition(undefined, fallback)).toBe(fallback);
    });
  });

  describe('toAnimation', () => {
    it('unwraps a wrapper', () => {
      expect.assertions(1);
      expect(toAnimation({ use: emptyAnimation })).toBe(emptyAnimation);
    });

    it('passes a bare function through', () => {
      expect.assertions(1);
      expect(toAnimation(emptyAnimation)).toBe(emptyAnimation);
    });

    it('falls back to emptyAnimation for undefined', () => {
      expect.assertions(1);
      expect(toAnimation(undefined)).toBe(emptyAnimation);
    });

    it('honours a custom fallback', () => {
      expect.assertions(1);
      const fallback = emptyAnimation;
      expect(toAnimation(undefined, fallback)).toBe(fallback);
    });
  });

  describe('toTransitionProps', () => {
    it('returns props from wrapper', () => {
      expect.assertions(1);
      const props = { duration: 200 };
      expect(toTransitionProps({ use: emptyTransition, props })).toBe(props);
    });

    it('returns fallback for bare transition', () => {
      expect.assertions(1);
      const fallback = { duration: 200 };
      expect(toTransitionProps(emptyTransition, fallback)).toBe(fallback);
    });

    it('returns fallback for undefined', () => {
      expect.assertions(1);
      const fallback = { duration: 200 };
      expect(toTransitionProps(undefined, fallback)).toBe(fallback);
    });
  });
});
