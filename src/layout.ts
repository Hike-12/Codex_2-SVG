import type { Diagram, NodeDef } from './dsl';
export type PlacedNode = NodeDef & { x: number; y: number; w: number; h: number };
export type PlacedEdge = { from: PlacedNode; to: PlacedNode; kind: string; label?: string; d: string; lx: number; ly: number };
export type GroupBox = { id: string; label: string; x: number; y: number; w: number; h: number; style: string };
const measure = (n: NodeDef) => {
  const width = Math.max(174, Math.min(250, 84 + n.label.length * 8 + (n.sub ? n.sub.length * 1.2 : 0)));
  const height = n.shape === 'circle' ? 132 : n.shape === 'pill' ? 62 : 82;
  return { w: width, h: height };
};
export function layout(diagram: Diagram, manual: Record<string, { x: number; y: number }> = {}) {
  const ids = diagram.nodes.map(n => n.id);
  const rank = new Map(ids.map(id => [id, 0]));
  // A depth-first spanning order drops only edges that point back into the active path.
  const state = new Map<string, number>(), order: string[] = [], forward: typeof diagram.edges = [];
  const visit = (id: string) => {
    state.set(id, 1);
    for (const edge of diagram.edges.filter(e => e.from === id)) {
      if (state.get(edge.to) === 1) continue;
      forward.push(edge);
      if (!state.has(edge.to)) visit(edge.to);
    }
    state.set(id, 2); order.push(id);
  };
  for (const id of ids) if (!state.has(id)) visit(id);
  for (const id of order.reverse()) for (const edge of forward.filter(e => e.from === id)) {
    rank.set(edge.to, Math.max(rank.get(edge.to) ?? 0, (rank.get(id) ?? 0) + 1));
  }
  const buckets = new Map<number, NodeDef[]>();
  for (const n of diagram.nodes) { const r = rank.get(n.id) ?? 0; buckets.set(r, [...(buckets.get(r) ?? []), n]); }
  // A few stable barycenter sweeps order nodes by the average rank of their neighbors.
  for (let sweep = 0; sweep < 3; sweep++) for (const [r, bucket] of buckets) {
    bucket.sort((a, b) => {
      const score = (id: string) => diagram.edges.filter(e => e.to === id).reduce((s, e) => s + (buckets.get(rank.get(e.from) ?? 0)?.findIndex(n => n.id === e.from) ?? 0), 0);
      return score(a.id) - score(b.id) || a.id.localeCompare(b.id);
    });
    buckets.set(r, bucket);
  }
  const nodes: PlacedNode[] = [];
  for (const [r, bucket] of buckets) {
    let cursor = 0;
    for (const n of bucket) {
      const { w, h } = measure(n), point = manual[n.id] || n.position;
      const x = point?.x ?? (diagram.direction === 'LR' ? r * 290 + 64 : 64 + (cursor % 2) * 310);
      const y = point?.y ?? (diagram.direction === 'LR' ? cursor * 138 + 64 : r * 174 + 50);
      nodes.push({ ...n, x, y, w, h }); cursor++;
    }
  }
  const byId = new Map(nodes.map(n => [n.id, n]));
  const edges: PlacedEdge[] = diagram.edges.flatMap(e => {
    const from = byId.get(e.from), to = byId.get(e.to); if (!from || !to) return [];
    const forward = diagram.direction === 'LR';
    const back = forward ? to.x <= from.x : to.y <= from.y;
    let sx: number, sy: number, ex: number, ey: number, d: string;
    if (back && from.id === to.id) { sx = from.x + from.w/2; sy = from.y; ex = from.x + from.w; ey = from.y + from.h/2; d = `M ${sx} ${sy} C ${sx+85} ${sy-110}, ${ex+100} ${ey-110}, ${ex} ${ey}`; }
    else if (forward) {
      sx = back ? from.x : from.x + from.w; sy = from.y + from.h / 2;
      ex = back ? to.x + to.w : to.x; ey = to.y + to.h / 2;
      const bend = Math.max(56, Math.abs(ex - sx) * .46) * (back ? -1 : 1);
      d = `M ${sx} ${sy} C ${sx+bend} ${sy}, ${ex-bend} ${ey}, ${ex} ${ey}`;
    } else {
      sx = from.x + from.w/2; sy = back ? from.y : from.y + from.h;
      ex = to.x + to.w/2; ey = back ? to.y + to.h : to.y;
      const bend = Math.max(48, Math.abs(ey - sy) * .46) * (back ? -1 : 1);
      d = `M ${sx} ${sy} C ${sx} ${sy+bend}, ${ex} ${ey-bend}, ${ex} ${ey}`;
    }
    return [{ ...e, from, to, d, lx: (sx + ex) / 2, ly: (sy + ey) / 2 }];
  });
  const groups: GroupBox[] = diagram.groups.flatMap(g => {
    const members = nodes.filter(n => n.group === g.id); if (!members.length) return [];
    const minX = Math.min(...members.map(n => n.x)), minY = Math.min(...members.map(n => n.y));
    const maxX = Math.max(...members.map(n => n.x+n.w)), maxY = Math.max(...members.map(n => n.y+n.h));
    return [{ id: g.id, label: g.label, x: minX-24, y: minY-58, w: maxX-minX+48, h: maxY-minY+82, style: g.style }];
  });
  const minX = Math.min(0, ...nodes.map(n => n.x-48)), minY = Math.min(0, ...nodes.map(n => n.y-48));
  const maxX = Math.max(980, ...nodes.map(n => n.x+n.w+64)), maxY = Math.max(600, ...nodes.map(n => n.y+n.h+64));
  return { nodes, edges, groups, viewBox: `${minX} ${minY} ${maxX-minX} ${maxY-minY}`, bounds: { x: minX, y: minY, w: maxX-minX, h: maxY-minY } };
}
