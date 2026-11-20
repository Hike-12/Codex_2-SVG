export type Shape = 'card' | 'circle' | 'pill' | 'cylinder' | 'diamond' | 'hexagon';
export type EdgeKind = 'solid' | 'async' | 'stream' | 'sync';
export type NodeDef = { id: string; label: string; sub?: string; icon?: string; shape: Shape; badge?: string; accent?: string; image?: string; group?: string; position?: { x: number; y: number } };
export type EdgeDef = { from: string; to: string; kind: EdgeKind; label?: string };
export type Diagram = { nodes: NodeDef[]; edges: EdgeDef[]; groups: { id: string; label: string; style: string }[]; direction: 'LR' | 'TD'; theme: 'blueprint' | 'noir' | 'paper'; errors: { line: number; message: string }[] };

const unquote = (value: string) => value.trim().replace(/^['"]|['"]$/g, '');
function attrs(source: string): Record<string, string> {
  const result: Record<string, string> = {};
  const pattern = /([\w-]+)\s*:\s*("[^"]*"|'[^']*'|[^,]+)(?:,|$)/g;
  for (const match of source.matchAll(pattern)) result[match[1]] = unquote(match[2].replace(/,$/, ''));
  return result;
}
const operators = /(<->|=>|~>|->)/g;
export function parse(source: string): Diagram {
  const diagram: Diagram = { nodes: [], edges: [], groups: [], direction: 'LR', theme: 'blueprint', errors: [] };
  const nodeMap = new Map<string, NodeDef>();
  const groupStack: string[] = [];
  const ensureNode = (id: string, label?: string, rawAttrs?: string) => {
    const a = attrs(rawAttrs ?? '');
    const existing = nodeMap.get(id);
    const node: NodeDef = { ...existing, id, label: a.label || label || existing?.label || id, sub: a.sub || existing?.sub, icon: a.icon || existing?.icon, shape: (a.shape as Shape) || existing?.shape || 'card', badge: a.badge || existing?.badge, accent: a.accent || existing?.accent, image: a.img || existing?.image, group: groupStack.at(-1) || existing?.group };
    nodeMap.set(id, node);
  };
  source.split(/\r?\n/).forEach((raw, index) => {
    const line = raw.trim();
    if (!line || line.startsWith('//')) {
      const pos = line.match(/^\/\/\s*@pos\s+([\w-]+)\s*:\s*(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);
      if (pos) { const n = nodeMap.get(pos[1]); if (n) n.position = { x: +pos[2], y: +pos[3] }; }
      return;
    }
    if (/^direction\s+(LR|TD)$/i.test(line)) { diagram.direction = line.slice(-2).toUpperCase() as 'LR' | 'TD'; return; }
    if (/^theme\s+(blueprint|noir|paper)$/i.test(line)) { diagram.theme = line.split(/\s+/)[1].toLowerCase() as Diagram['theme']; return; }
    const group = line.match(/^group\s+"([^"]+)"\s*(?:\[([^\]]*)\])?\s*\{/);
    if (group) { diagram.groups.push({ id: group[1], label: group[1], style: attrs(group[2] || '').style || 'solid' }); groupStack.push(group[1]); return; }
    if (line === '}') { groupStack.pop(); return; }
    if (line.includes('->') || line.includes('~>') || line.includes('=>') || line.includes('<->')) {
      const parts = line.split(operators).map(s => s.trim()).filter(Boolean);
      let current: string | undefined;
      for (let i = 0; i < parts.length; i++) {
        if (['->','~>','=>','<->'].includes(parts[i])) {
          const op = parts[i], target = parts[i + 1]?.match(/^([\w-]+)/)?.[1];
          if (!current || !target) { diagram.errors.push({ line: index + 1, message: 'Could not read this connection.' }); break; }
          const label = line.match(/:\s*"([^"]+)"/)?.[1];
          ensureNode(current); ensureNode(target);
          diagram.edges.push({ from: current, to: target, kind: op === '~>' ? 'async' : op === '=>' ? 'stream' : op === '<->' ? 'sync' : 'solid', label });
          current = target; i++;
        } else {
          const parsed = parts[i].match(/^([\w-]+)(?:\s+"([^"]+)")?\s*(?:\[([^\]]*)\])?$/);
          if (!parsed) { diagram.errors.push({ line: index + 1, message: 'Could not read this node.' }); break; }
          current = parsed[1]; ensureNode(current, parsed[2], parsed[3]);
        }
      }
      return;
    }
    const node = line.match(/^([\w-]+)(?:\s+"([^"]+)")?\s*(?:\[([^\]]*)\])?$/);
    if (node) { ensureNode(node[1], node[2], node[3]); return; }
    diagram.errors.push({ line: index + 1, message: 'This line does not match the diagram syntax.' });
  });
  diagram.nodes = [...nodeMap.values()];
  return diagram;
}

export const presets: { name: string; source: string }[] = [
  { name: 'Event-driven stack', source: `direction LR
theme blueprint
Client [shape: circle, icon: user, sub: "Browser"]
Gateway [shape: pill, icon: gateway, badge: "EDGE"]
group "Core cluster" [style: dashed] {
  Auth [icon: shield, sub: "Identity"]
  Orders [icon: server, sub: "Order service"]
  Kafka [shape: pill, icon: queue, badge: "STREAM"]
  Worker [shape: hexagon, icon: cpu]
  Postgres [shape: cylinder, icon: postgres]
  Redis [shape: cylinder, icon: redis]
}
Client -> Gateway : "HTTPS"
Gateway -> Auth : "JWT"
Gateway -> Orders : "REST"
Orders ~> Kafka : "OrderCreated"
Kafka => Worker : "Events"
Worker -> Postgres : "Persist"
Orders -> Redis : "Cache"` },
  { name: 'AI + retrieval', source: `direction LR
theme noir
User [shape: circle, icon: user]
Orchestrator [icon: brain, sub: "Plan & route"]
VectorDB [shape: cylinder, icon: database, sub: "Semantic search"]
Sandbox [shape: hexagon, icon: terminal, sub: "Isolated tools"]
Router [icon: gateway, badge: "LLM"]
Stream [shape: pill, icon: spark, sub: "Token stream"]
User -> Orchestrator : "Prompt"
Orchestrator ~> VectorDB : "Retrieve context"
Orchestrator ~> Sandbox : "Tool call"
VectorDB -> Router : "Grounded context"
Sandbox -> Router : "Tool result"
Router => Stream : "Response"` },
  { name: 'Live collaboration', source: `direction LR
theme paper
Browser [icon: client, sub: "3 active"]
Edge [shape: pill, icon: globe]
CRDT [shape: hexagon, icon: cpu, sub: "Conflict-free state"]
Postgres [shape: cylinder, icon: postgres]
Snapshots [shape: cylinder, icon: bucket]
Browser <-> Edge : "WebSocket"
Edge ~> CRDT : "Presence"
CRDT => Postgres : "Persist"
CRDT -> Snapshots : "Checkpoint"` },
  { name: 'Shapes & media', source: `direction TD
theme blueprint
Start [shape: circle, icon: spark, sub: "Entry"]
Decision [shape: diamond, icon: search, label: "Route request"]
API [shape: pill, icon: webhook, badge: "POST"]
Compute [shape: hexagon, icon: lambda]
Store [shape: cylinder, icon: storage]
Start -> Decision : "Classify"
Decision -> API : "Accepted"
API ~> Compute : "Dispatch"
Compute -> Store : "Write"` },
];
