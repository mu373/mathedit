import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
import { generateSVG } from '../../core/src/renderer/generator';

const textPrototype = Object.getPrototypeOf(document.createElementNS('http://www.w3.org/2000/svg', 'text'));
const originalBBox = Object.getOwnPropertyDescriptor(textPrototype, 'getBBox');

// Happy DOM exposes a bound Document constructor that its HTMLDocument does not
// inherit from. MathJax checks instanceof, so use the actual base constructor.
beforeAll(() => {
  vi.stubGlobal('Document', Object.getPrototypeOf(document.constructor));
  Object.defineProperty(textPrototype, 'getBBox', {
    configurable: true,
    value(this: SVGElement) {
      const width = this.ownerDocument === document && document.body.contains(this)
        ? Array.from(this.textContent ?? '').length * 1000 : 0;
      return { x: 0, y: 0, width, height: 1000 };
    },
  });
});
afterAll(() => {
  vi.unstubAllGlobals();
  if (originalBBox) Object.defineProperty(textPrototype, 'getBBox', originalBBox);
  else Reflect.deleteProperty(textPrototype, 'getBBox');
});

const samples = [
  'こんにちは',
  String.raw`\begin{eqnarray}\unicode{x5F45}\text{は、弓へんに剪。}\end{eqnarray}`,
  String.raw`\unicode{x0041}`,
  String.raw`\begin{array}{c|ccccc}
x & \cdots & -1 & \cdots & 1 & \cdots \\
\hline
f’(x) & + & 0 & – & 0 & + \\
\hline
f(x) & \nearrow & e & \searrow & -e & \nearrow
\end{array}`,
  String.raw`\begin{array}{|c|c|c|} xxx & yyy & zzz \\ 1 & 2 & 3 \\ \end{array}`,
  String.raw`\begin{array}{ccc}\hline xxx & yyy & zzz \\ \hline 1 & 2 & 3 \\ \hline\end{array}`,
];

describe('SVG rendering', () => {
  it.each(samples)('renders %s', (latex) => {
    const result = generateSVG({ equations: [{ latex }] });
    expect(result.errors).toEqual([]);
    expect(result.svg).not.toMatch(/NaN|Infinity/);
    const svg = new DOMParser().parseFromString(result.svg, 'image/svg+xml');
    expect(svg.querySelector('[data-mml-node="merror"]')).toBeNull();
    expect(Number(svg.documentElement.getAttribute('width'))).toBeGreaterThan(0);
  });
});

function renderSvg(latex: string, color?: string) {
  const result = generateSVG({ equations: [{ latex }], options: { color } });
  expect(result.errors).toEqual([]);
  return new DOMParser().parseFromString(result.svg, 'image/svg+xml');
}

function inheritedAttribute(element: Element, name: string): string | null {
  for (let node: Element | null = element; node; node = node.parentElement) {
    const value = node.getAttribute(name);
    if (value !== null) return value;
  }
  return null;
}

it('measures Japanese glyphs in the live document and preserves their text', () => {
  const svg = renderSvg('こんにちは');
  expect([...svg.querySelectorAll('text')].map(node => node.textContent).join('')).toBe('こんにちは');
  // Five 1000-unit glyphs in our layout stub, scaled to output pixels.
  expect(Number(svg.documentElement.getAttribute('width'))).toBeGreaterThan(200);
});

it('keeps Japanese text and the requested Unicode glyph in an equation array', () => {
  const svg = renderSvg(samples[1]);
  const text = [...svg.querySelectorAll('text')].map(node => node.textContent).join('');
  expect(text).toContain('彅');
  expect(text).toContain('は、弓へんに剪。');
});

it.each([
  [samples[3], 3],
  [samples[4], 2],
  [samples[5], 1],
] as const)('exports visible internal array rules: %s', (latex, count) => {
  const svg = renderSvg(latex);
  const lines = [...svg.querySelectorAll('line[data-line]')];
  expect(lines).toHaveLength(count);
  for (const line of lines) {
    expect(inheritedAttribute(line, 'stroke')).toBe('black');
    expect(parseFloat((line as unknown as SVGElement).style.strokeWidth)).toBeGreaterThan(0);
  }
});

it('applies requested colors to array rules while preserving explicit TeX colors', () => {
  const svg = renderSvg(samples[3], '#008800');
  for (const line of svg.querySelectorAll('line[data-line]')) {
    expect(inheritedAttribute(line, 'stroke')).toBe('#008800');
  }
  const colored = renderSvg(String.raw`\color{red}{x} + y`);
  expect(colored.querySelector('[fill="red"]')).not.toBeNull();
});
