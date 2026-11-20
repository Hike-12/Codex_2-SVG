import { describe, expect, it } from 'vitest';
import { exampleAssets, parse, presets } from './dsl';

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
  it('supports inline node definitions and unquoted self-contained image data', () => {
    const d=parse('Client -> Worker [shape: hexagon, icon: cpu, sub: "fast", img: data:image/svg+xml;base64,PHN2Zy8+] ~> DB : "persist"');
    expect(d.nodes[1]).toMatchObject({id:'Worker',shape:'hexagon',icon:'cpu',sub:'fast',image:'data:image/svg+xml;base64,PHN2Zy8+'});
    expect(d.edges).toEqual([{from:'Client',to:'Worker',kind:'solid'},{from:'Worker',to:'DB',kind:'async',label:'persist'}]);
  });
  it('applies position comments before the node and preserves quoted line comments', () => {
    const d=parse('// @pos A: 34,56\nA "API // edge" [label: "API // edge"] // trailing comment\nA <-> B : "sync"');
    expect(d.nodes[0]).toMatchObject({label:'API // edge',position:{x:34,y:56}});
    expect(d.edges[0].kind).toBe('sync');
    expect(d.errors).toHaveLength(0);
  });
  it('falls back safely when a shape is unknown', () => {
    const d=parse('A [shape: octagon]');
    expect(d.nodes[0].shape).toBe('card');
    expect(d.errors[0].message).toContain('Unknown shape');
  });
  it('ships four parseable templates, including an embedded SVG image demo', () => {
    expect(presets).toHaveLength(4);
    for(const preset of presets) expect(parse(preset.source).errors).toEqual([]);
    const media=parse(presets[3].source);
    expect(media.nodes.find(n=>n.id==='Avatar')?.image).toBe('@demo-avatar');
    expect(exampleAssets['demo-avatar']).toMatch(/^data:image\/svg\+xml,/);
    expect(new Set(media.nodes.map(n=>n.shape))).toEqual(new Set(['circle','diamond','pill','hexagon','cylinder']));
  });
});
