export type Shape = 'card' | 'circle' | 'pill' | 'cylinder' | 'diamond' | 'hexagon';
export type EdgeKind = 'solid' | 'async' | 'stream' | 'sync';
export type NodeDef = { id: string; label: string; sub?: string; icon?: string; shape: Shape; badge?: string; accent?: string; image?: string; group?: string; position?: { x: number; y: number } };
export type EdgeDef = { from: string; to: string; kind: EdgeKind; label?: string };
export type Diagram = { nodes: NodeDef[]; edges: EdgeDef[]; groups: { id: string; label: string; style: string }[]; direction: 'LR' | 'TD'; theme: 'blueprint' | 'noir' | 'paper'; errors: { line: number; message: string }[] };

const unquote = (value: string) => value.trim().replace(/^['"]|['"]$/g, '');
function attrs(source: string): Record<string, string> {
  const result: Record<string, string> = {};
  const parts: string[] = [];
  let current = '', quote = '';
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if ((char === '"' || char === "'") && (!quote || quote === char)) quote = quote ? '' : char;
    if (char === ',' && !quote && /^\s*[\w-]+\s*:/.test(source.slice(i + 1))) { parts.push(current); current = ''; continue; }
    current += char;
  }
  if (current.trim()) parts.push(current);
  for (const part of parts) {
    const split = part.indexOf(':');
    if (split > 0) result[part.slice(0, split).trim()] = unquote(part.slice(split + 1));
  }
  return result;
}
function splitEdges(source: string) {
  const segments: string[] = [], kinds: string[] = [];
  let start = 0, quote = '', bracketDepth = 0;
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if ((char === '"' || char === "'") && (!quote || quote === char)) { quote = quote ? '' : char; continue; }
    if (quote) continue;
    if (char === '[') bracketDepth++;
    else if (char === ']') bracketDepth--;
    if (bracketDepth) continue;
    const match = source.slice(i).match(/^(<->|=>|~>|->)/);
    if (match) { segments.push(source.slice(start, i).trim()); kinds.push(match[1]); i += match[1].length - 1; start = i + 1; }
  }
  segments.push(source.slice(start).trim());
  return { segments, kinds };
}
export function parse(source: string): Diagram {
  const diagram: Diagram = { nodes: [], edges: [], groups: [], direction: 'LR', theme: 'blueprint', errors: [] };
  const nodeMap = new Map<string, NodeDef>();
  const groupStack: string[] = [];
  const positions = new Map<string, {x:number;y:number}>();
  let currentLine = 0;
  const ensureNode = (id: string, label?: string, rawAttrs?: string) => {
    const a = attrs(rawAttrs ?? '');
    const existing = nodeMap.get(id);
    const validShapes: Shape[] = ['card','circle','pill','cylinder','diamond','hexagon'];
    const requested = a.shape || existing?.shape || 'card';
    const shape = validShapes.includes(requested as Shape) ? requested as Shape : 'card';
    if (requested !== shape) diagram.errors.push({ line: currentLine, message: 'Unknown shape "' + requested + '"; using card.' });
    const node: NodeDef = { ...existing, id, label: a.label || label || existing?.label || id, sub: a.sub || existing?.sub, icon: a.icon || existing?.icon, shape, badge: a.badge || existing?.badge, accent: a.accent || existing?.accent, image: a.img || existing?.image, group: groupStack.at(-1) || existing?.group, position: positions.get(id) || existing?.position };
    nodeMap.set(id, node);
  };
  source.split(/\r?\n/).forEach((raw, index) => {
    currentLine = index + 1;
    let line = raw.trim();
    if (!line) return;
    if (line.startsWith('//')) {
      const pos = line.match(/^\/\/\s*@pos\s+([\w-]+)\s*:\s*(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);
      if (pos) { const point = { x: +pos[2], y: +pos[3] }; positions.set(pos[1], point); const n = nodeMap.get(pos[1]); if (n) n.position = point; }
      return;
    }
    let quote = '';
    for (let i = 0; i < line.length - 1; i++) {
      if ((line[i] === '"' || line[i] === "'") && (!quote || quote === line[i])) quote = quote ? '' : line[i];
      if (!quote && line[i] === '/' && line[i+1] === '/') { line = line.slice(0, i).trimEnd(); break; }
    }
    if (!line) return;
    if (/^direction\s+(LR|TD)$/i.test(line)) { diagram.direction = line.slice(-2).toUpperCase() as 'LR' | 'TD'; return; }
    if (/^theme\s+(blueprint|noir|paper)$/i.test(line)) { diagram.theme = line.split(/\s+/)[1].toLowerCase() as Diagram['theme']; return; }
    const group = line.match(/^group\s+"([^"]+)"\s*(?:\[([^\]]*)\])?\s*\{/);
    if (group) { diagram.groups.push({ id: group[1], label: group[1], style: attrs(group[2] || '').style || 'solid' }); groupStack.push(group[1]); return; }
    if (line === '}') { if (!groupStack.pop()) diagram.errors.push({ line: index + 1, message: 'Unexpected closing group.' }); return; }
    if (line.includes('->') || line.includes('~>') || line.includes('=>') || line.includes('<->')) {
      const labelMatch = line.match(/\s*:\s*("[^"]*"|'[^']*')\s*$/);
      if (labelMatch) line = line.slice(0, labelMatch.index).trimEnd();
      const chain = splitEdges(line);
      if (chain.segments.length !== chain.kinds.length + 1 || chain.segments.some(s => !s)) { diagram.errors.push({ line: index + 1, message: 'Could not read this connection.' }); return; }
      const parsedNodes = chain.segments.map(segment => segment.match(/^([\w-]+)(?:\s+"([^"]+)")?\s*(?:\[([\s\S]*?)\])?$/));
      if (parsedNodes.some(n => !n)) { diagram.errors.push({ line: index + 1, message: 'Could not read a node in this connection.' }); return; }
      for (const parsed of parsedNodes) ensureNode(parsed![1], parsed![2], parsed![3]);
      for (let i = 0; i < chain.kinds.length; i++) {
        const op = chain.kinds[i];
        diagram.edges.push({ from: parsedNodes[i]![1], to: parsedNodes[i+1]![1], kind: op === '~>' ? 'async' : op === '=>' ? 'stream' : op === '<->' ? 'sync' : 'solid', label: i === chain.kinds.length-1 && labelMatch ? unquote(labelMatch[1]) : undefined });
      }
      return;
    }
    const node = line.match(/^([\w-]+)(?:\s+"([^"]+)")?\s*(?:\[([^\]]*)\])?$/);
    if (node) { ensureNode(node[1], node[2], node[3]); return; }
    diagram.errors.push({ line: index + 1, message: 'This line does not match the diagram syntax.' });
  });
  if (groupStack.length) diagram.errors.push({ line: source.split(/\r?\n/).length, message: 'A group is missing its closing brace.' });
  diagram.nodes = [...nodeMap.values()];
  return diagram;
}

export const presets: { name: string; source: string }[] = [
  { name: 'Event-Driven Microservices', source: `direction LR
theme blueprint
Client [shape: circle, icon: user, sub: "Browser"]
EdgeGateway "Edge Gateway" [shape: pill, icon: gateway, badge: "EDGE"]
group "Core Cluster" [style: dashed] {
  Auth [icon: shield, sub: "Identity"]
  Orders [icon: server, sub: "Order service"]
  Kafka [shape: pill, icon: queue, badge: "STREAM"]
  Worker [shape: hexagon, icon: cpu]
  Postgres [shape: cylinder, icon: postgres]
  Redis [shape: cylinder, icon: redis]
}
Client -> EdgeGateway : "HTTPS"
EdgeGateway -> Auth : "JWT"
EdgeGateway -> Orders : "REST"
Orders ~> Kafka : "OrderCreated"
Kafka => Worker : "Events"
Worker -> Postgres : "Persist"
Orders -> Redis : "Cache"` },
  { name: 'Multi-Agent AI + RAG', source: `direction LR
theme noir
User [shape: circle, icon: user]
Orchestrator [icon: brain, sub: "Plan & route"]
VectorDB "Vector DB" [shape: cylinder, icon: database, sub: "Semantic search"]
ToolSandbox "Tool Sandbox" [shape: hexagon, icon: terminal, sub: "Isolated tools"]
Router "LLM Router" [icon: gateway, badge: "LLM"]
Stream "Streaming Response" [shape: pill, icon: spark, sub: "Token stream"]
User -> Orchestrator : "Prompt"
Orchestrator ~> VectorDB : "Retrieve context"
Orchestrator ~> ToolSandbox : "Tool call"
VectorDB -> Router : "Grounded context"
ToolSandbox -> Router : "Tool result"
Router => Stream : "Response"` },
  { name: 'Real-Time Collaboration', source: `direction LR
theme paper
BrowserClient "Browser Client" [icon: client, sub: "3 active"]
WebSocketEdge "WebSocket Edge" [shape: pill, icon: globe]
CRDT "CRDT State Engine" [shape: hexagon, icon: cpu, sub: "Conflict-free state"]
Postgres [shape: cylinder, icon: postgres]
Snapshots "S3 Snapshot" [shape: cylinder, icon: bucket]
BrowserClient <-> WebSocketEdge : "WebSocket"
WebSocketEdge ~> CRDT : "Presence"
CRDT => Postgres : "Persist"
CRDT -> Snapshots : "Checkpoint"` },
  { name: 'Geometric + Custom Media', source: `direction TD
theme blueprint
Avatar [shape: circle, img: data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' rx='24' fill='%2367d7ef'/%3E%3Cpath d='M13 33c2-13 20-13 22 0' fill='none' stroke='%2309090b' stroke-width='3'/%3E%3Ccircle cx='24' cy='17' r='7' fill='%2309090b'/%3E%3C/svg%3E, sub: "Embedded SVG"]
Start [shape: circle, icon: spark, sub: "Entry"]
Decision [shape: diamond, icon: search, label: "Route request"]
API [shape: pill, icon: webhook, badge: "POST"]
Compute [shape: hexagon, icon: lambda, accent: "#67D7EF"]
Store [shape: cylinder, icon: storage]
Avatar -> Start : "Actor"
Start -> Decision : "Classify"
Decision -> API : "Accepted"
API ~> Compute : "Dispatch"
Compute -> Store : "Write"` },
];
