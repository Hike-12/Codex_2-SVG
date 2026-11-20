import { describe, expect, it } from 'vitest';
import { parse } from './dsl';

describe('diagram DSL', () => {
  it('reads node shapes, labels, icons, images and subtitles', () => {
    const d = parse([
      'A [shape: card, icon: server, sub: "primary"]',
      'B [shape: circle, img: @avatar]',
      'C [shape: pill]', 'D [shape: cylinder]', 'E [shape: diamond]', 'F [shape: hexagon]'
    ].join('\n'));
    expect(d.nodes.map(n => n.shape)).toEqual(['card','circle','pill','cylinder','diamond','hexagon']);
    expect(d.nodes[0]).toMatchObject({ icon:'server', sub:'primary' });
    expect(d.nodes[1].image).toBe('@avatar');
  });
  it('parses chained solid, async and stream edges with groups', () => {
    const d = parse('group "Services" [style: dashed] {\nA -> B ~> C => D : "events"\n}');
    expect(d.nodes.map(n=>n.group)).toEqual(['Services','Services','Services','Services']);
    expect(d.edges.map(e=>e.kind)).toEqual(['solid','async','stream']);
    expect(d.edges[2].label).toBe('events');
    expect(d.groups[0].style).toBe('dashed');
  });
  it('keeps manual positions and recovers after malformed lines', () => {
    const d = parse('A [icon: postgres]\nnot a valid declaration !!!\n// @pos A: 120,240\nB');
    expect(d.nodes[0].position).toEqual({x:120,y:240});
    expect(d.errors).toHaveLength(1);
    expect(d.nodes.map(n=>n.id)).toEqual(['A','B']);
  });
  it('reads top-level direction and theme directives', () => {
    expect(parse('direction TD\ntheme paper\nA -> B')).toMatchObject({direction:'TD',theme:'paper'});
  });
});
