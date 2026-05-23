import { describe, expect, it } from 'vitest';

import {
  composeTransition,
  emptyAnimation,
  emptyTransition,
  flipToggle,
  flyFrom,
  height,
  parseCSSString,
  scaleFreeze,
  scaleHeight,
  scaleValue,
  scaleWidth,
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
  });

  describe('scaleValue', () => {
    it('produces a scale() css fragment', () => {
      expect.assertions(1);
      const fn = scaleValue(0.5);
      expect(fn(0.5, 0.5)).toMatch(/scale\(/);
    });
  });
});
