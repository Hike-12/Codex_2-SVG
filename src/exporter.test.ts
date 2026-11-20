import { describe, expect, it } from 'vitest';
import { serializeSvg } from './exporter';

describe('standalone SVG export', () => {
  const svg='<svg viewBox="0 0 100 100"><defs><clipPath id="avatar"><circle cx="10" cy="10" r="8"/></clipPath></defs><rect class="canvas-grid"/><rect class="node-hit"/><path d="M0 0L1 1"/><circle class="flow-packet"><animateMotion dur="2s"/></circle><image clip-path="url(#avatar)"/></svg>';
  it('adds XML and SVG namespaces and preserves reusable image clips', () => {
    const out=serializeSvg(svg);
    expect(out.startsWith('<?xml version="1.0"')).toBe(true);
    expect(out).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(out).toContain('<clipPath');
    expect(out).toContain('clip-path="url(#avatar)"');
    expect(out).toContain('<animateMotion');
    expect(out).not.toContain('canvas-grid');
    expect(out).not.toContain('node-hit');
  });
  it('removes animated packets for a static export', () => {
    expect(serializeSvg(svg,false)).not.toContain('animateMotion');
  });
});
