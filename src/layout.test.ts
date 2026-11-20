import { describe, expect, it } from 'vitest';
import { parse } from './dsl';
import { layout } from './layout';

describe('deterministic layout', () => {
  it('places forward edges in layers and respects manual positions', () => {
    const d=parse('A -> B -> C');
    const result=layout(d,{B:{x:400,y:170}});
    expect(result.nodes.find(n=>n.id==='B')).toMatchObject({x:400,y:170});
    expect(result.nodes.find(n=>n.id==='C')!.x).toBeGreaterThan(result.nodes.find(n=>n.id==='A')!.x);
  });
  it('terminates on cycles and routes every declared edge', () => {
    const d=parse('Worker -> Queue -> Worker');
    const result=layout(d);
    expect(result.nodes).toHaveLength(2);
    expect(result.edges).toHaveLength(2);
    expect(result.edges.every(e=>e.d.startsWith('M '))).toBe(true);
  });
  it('expands group bounds around member nodes', () => {
    const d=parse('group "Core" {\nA -> B\n}');
    const result=layout(d);
    const group=result.groups[0], members=result.nodes;
    expect(group.x).toBeLessThan(Math.min(...members.map(n=>n.x)));
    expect(group.y+group.h).toBeGreaterThan(Math.max(...members.map(n=>n.y+n.h)));
  });
});
