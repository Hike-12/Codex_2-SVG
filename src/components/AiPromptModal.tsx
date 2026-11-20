import { useEffect, useState } from 'react';
import { Icon } from '../icons';

interface AiPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertCode: (snippet: string) => void;
}

export const AI_MASTER_PROMPT = `You are an expert enterprise systems architect and visual designer specialized in creating production-grade, publication-ready architecture diagrams using the Glyph DSL language.

When asked to design, document, or visualize any system architecture, generate ONLY valid Glyph DSL code inside a single \`\`\`glyph code block.

═══════════════════════════════════════════════════════════════════
GLYPH DSL SPECIFICATION & SYNTAX RULES
═══════════════════════════════════════════════════════════════════

1. DIRECTIVES (First lines of the document):
   • direction LR  (Left-to-Right layout, recommended for data pipelines, microservices, event streams)
     OR
     direction TD  (Top-to-Down layout, recommended for multi-tier applications or hierarchical flows)
   • theme <theme_name>
     Available themes:
     - blueprint : Carbon Dusk (deep slate with iris accents - default)
     - noir      : Pure Obsidian (stealth high-contrast monochrome)
     - paper     : Espresso Amber (warm sepia bronze with earthy tones)
     - frost     : Nordic Frost (crisp, clean minimal light theme with blue accent)
     - editorial : Editorial Cream (warm paper light theme with deep indigo accent)

2. NODE DECLARATION FORMAT:
   NodeId "Display Label" [shape: <shape>, icon: <icon>, sub: "Subtitle", badge: "BADGE"]

   • NodeId: Alphanumeric identifier without spaces or special characters (e.g., Client, ApiGateway, KafkaBroker, PgPrimary).
   • "Display Label": Human-readable component name in double quotes (e.g., "API Gateway").
   • Attributes inside square brackets [attr: value, attr: value]:
     - shape: One of:
       * card     : Default rectangular card (ideal for standard services and application nodes)
       * pill     : Stadium capsule (ideal for gateways, message brokers, queues, endpoints)
       * circle   : Circular node (ideal for external clients, users, browsers, actors)
       * cylinder : Storage cylinder (ideal for databases, caches, file stores, object storage)
       * diamond  : Rhombus (ideal for routers, load balancers, decision/proxy nodes)
       * hexagon  : Hexagon (ideal for compute workers, ML models, background engines)

     - icon: Built-in SVG vector icon. Must be one of these EXACT 36 names:
       Infrastructure & Cloud: server, database, postgres, redis, queue, globe, cloud, docker, kubernetes, lambda, storage, bucket, cache, gateway, router
       Clients & Interfaces:   client, mobile, terminal, search, chart, bell, mail, code, file
       Security & Identity:    lock, key, shield, user, users
       Compute & AI:           cpu, ai, brain, spark
       DevOps & Integration:   webhook, git, github

     - sub: Technical subtitle in quotes (e.g., sub: "Port 443", sub: "Go · OIDC", sub: "PostgreSQL 16", sub: "Active-Active")
     - badge: Short uppercase tag in quotes (e.g., badge: "EDGE", badge: "TLS", badge: "PRIMARY", badge: "REPLICA", badge: "STREAM", badge: "VPC")

3. GROUPS & BOUNDARIES:
   group "Cluster or Perimeter Name" [style: solid|dashed] {
     // Put node declarations belonging to this boundary here
     ServiceA "Service A" [shape: card, icon: server]
     ServiceB "Service B" [shape: card, icon: server]
   }
   • Use [style: dashed] for trust zones, VPC boundaries, Kubernetes namespaces, or logical tiers.

4. CONNECTIONS & FLOW OPERATORS:
   • A -> B : "Label"  : Solid line (Standard synchronous flow: HTTP, REST, gRPC)
   • A ~> B : "Label"  : Dashed line with animated flow dot (Asynchronous: Kafka, RabbitMQ, Webhooks, SQS)
   • A => B : "Label"  : Double-width line (Streaming / Replication: WebSockets, SSE, CDC)
   • A <-> B : "Label" : Bidirectional line (Two-way synchronous handshake or cluster gossip)
   • Labels must always be quoted strings preceded by a colon: : "Protocol or Action"

═══════════════════════════════════════════════════════════════════
CRAFT RULES FOR WORLD-CLASS ARCHITECTURE DIAGRAMS
═══════════════════════════════════════════════════════════════════

1. LOGICAL TIERING:
   Organize systems from input to state:
   Client/User (circle) -> Ingress/LB (diamond/pill) -> Core Services (cards) -> Event Stream (pill) -> Data & Caches (cylinder).

2. SEMANTIC SHAPE ACCURACY:
   - Always use 'circle' or 'pill' for Users and Clients.
   - Always use 'cylinder' for databases (Postgres, Redis, Mongo, ClickHouse).
   - Always use 'pill' for queues, event brokers, and edge gateways.
   - Always use 'diamond' for routers and load balancers.
   - Always use 'hexagon' for workers and AI/ML processors.

3. DESCRIPTIVE SUBTITLES & BADGES:
   Give nodes professional depth by specifying runtimes, protocols, or engine versions in 'sub' and high-level role in 'badge'.

4. CLEAN TOPOLOGY:
   Do not create spaghetti connections. Route flows cleanly through gateways or message buses rather than mesh-connecting every node.

═══════════════════════════════════════════════════════════════════
COMPLETE REFERENCE TEMPLATE:
═══════════════════════════════════════════════════════════════════

direction LR
theme blueprint

Client [shape: circle, icon: user, sub: "Web & Mobile App"]
Cdn "CloudFront CDN" [shape: pill, icon: globe, badge: "EDGE"]

group "Public Ingress Zone" [style: dashed] {
  Alb "Application LB" [shape: diamond, icon: router, sub: "AWS ALB"]
  ApiGw "API Gateway" [shape: pill, icon: gateway, badge: "VPC INGRESS"]
}

group "Core Microservices Tier" [style: dashed] {
  AuthSvc "Auth Service" [shape: card, icon: shield, sub: "Go · OIDC"]
  OrderSvc "Order Service" [shape: card, icon: server, sub: "Java · Spring"]
  PaymentSvc "Payment Service" [shape: card, icon: lock, sub: "Node · Stripe"]
  Worker "Event Processor" [shape: hexagon, icon: cpu, sub: "Go Worker"]
}

group "Event Streaming & State" [style: dashed] {
  Kafka "Kafka Cluster" [shape: pill, icon: queue, badge: "EVENT STREAM"]
  RedisCache "Redis Cache" [shape: cylinder, icon: redis, sub: "In-memory · v7"]
  MainDb "Postgres Primary" [shape: cylinder, icon: postgres, badge: "AURORA"]
  AnalyticsDb "ClickHouse" [shape: cylinder, icon: database, sub: "OLAP Storage"]
}

Client -> Cdn : "HTTPS"
Cdn -> Alb : "Origin TLS"
Alb -> ApiGw : "Route"
ApiGw -> AuthSvc : "Validate JWT"
ApiGw -> OrderSvc : "Create Order"
OrderSvc -> PaymentSvc : "Execute Charge"
OrderSvc -> RedisCache : "Check Idempotency"
OrderSvc ~> Kafka : "OrderCreated"
Kafka ~> Worker : "Consume Events"
Worker -> MainDb : "ACID Commit"
Worker => AnalyticsDb : "CDC Ingestion"`;

export const SAMPLE_USER_PROMPT = `Design a fault-tolerant, event-driven banking payment system in Glyph DSL.
It should have mobile clients, an API Gateway, OAuth2 Authentication, an Account Service, a Fraud Detection ML Engine, an event stream, and a distributed ledger database.`;

export function AiPromptModal({ isOpen, onClose, onInsertCode }: AiPromptModalProps) {
  const [activeTab, setActiveTab] = useState<'prompt' | 'usage' | 'examples'>('prompt');
  const [copied, setCopied] = useState(false);
  const [inserted, setInserted] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(AI_MASTER_PROMPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleInsertSample = () => {
    const referenceArchitecture = `direction LR
theme blueprint

Client [shape: circle, icon: user, sub: "Web & Mobile App"]
Cdn "CloudFront CDN" [shape: pill, icon: globe, badge: "EDGE"]

group "Public Ingress Zone" [style: dashed] {
  Alb "Application LB" [shape: diamond, icon: router, sub: "AWS ALB"]
  ApiGw "API Gateway" [shape: pill, icon: gateway, badge: "VPC INGRESS"]
}

group "Core Microservices Tier" [style: dashed] {
  AuthSvc "Auth Service" [shape: card, icon: shield, sub: "Go · OIDC"]
  OrderSvc "Order Service" [shape: card, icon: server, sub: "Java · Spring"]
  PaymentSvc "Payment Service" [shape: card, icon: lock, sub: "Node · Stripe"]
  Worker "Event Processor" [shape: hexagon, icon: cpu, sub: "Go Worker"]
}

group "Event Streaming & State" [style: dashed] {
  Kafka "Kafka Cluster" [shape: pill, icon: queue, badge: "EVENT STREAM"]
  RedisCache "Redis Cache" [shape: cylinder, icon: redis, sub: "In-memory · v7"]
  MainDb "Postgres Primary" [shape: cylinder, icon: postgres, badge: "AURORA"]
  AnalyticsDb "ClickHouse" [shape: cylinder, icon: database, sub: "OLAP Storage"]
}

Client -> Cdn : "HTTPS"
Cdn -> Alb : "Origin TLS"
Alb -> ApiGw : "Route"
ApiGw -> AuthSvc : "Validate JWT"
ApiGw -> OrderSvc : "Create Order"
OrderSvc -> PaymentSvc : "Execute Charge"
OrderSvc -> RedisCache : "Check Idempotency"
OrderSvc ~> Kafka : "OrderCreated"
Kafka ~> Worker : "Consume Events"
Worker -> MainDb : "ACID Commit"
Worker => AnalyticsDb : "CDC Ingestion"`;

    onInsertCode(referenceArchitecture);
    setInserted(true);
    setTimeout(() => {
      setInserted(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="docs-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="ai-prompt-title">
      <div className="docs-modal ai-prompt-modal" onClick={e => e.stopPropagation()}>
        <div className="docs-header">
          <div className="docs-title-wrap">
            <span className="docs-icon">
              <Icon name="spark" width="22" height="22" />
            </span>
            <div>
              <h2 id="ai-prompt-title">AI Architecture Generator Prompt</h2>
              <p>Give this master prompt to ChatGPT, Claude, or Gemini to create world-class architecture diagrams</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className={`toolbar-btn ${copied ? 'is-on' : ''}`}
              onClick={handleCopyPrompt}
              style={{
                height: '32px',
                padding: '0 12px',
                borderColor: copied ? 'var(--accent)' : 'var(--line)',
                color: copied ? 'var(--accent)' : 'var(--ink)'
              }}
            >
              <Icon name={copied ? 'check' : 'copy'} width="14" height="14" />
              <span>{copied ? 'Copied Prompt!' : 'Copy Prompt'}</span>
            </button>
            <button className="docs-close-btn" onClick={onClose} aria-label="Close modal">
              <Icon name="x" width="16" height="16" />
            </button>
          </div>
        </div>

        <div className="docs-nav">
          <button className={activeTab === 'prompt' ? 'is-active' : ''} onClick={() => setActiveTab('prompt')}>
            Master AI Prompt
          </button>
          <button className={activeTab === 'usage' ? 'is-active' : ''} onClick={() => setActiveTab('usage')}>
            How to Use with LLMs
          </button>
          <button className={activeTab === 'examples' ? 'is-active' : ''} onClick={() => setActiveTab('examples')}>
            Example Prompts & Output
          </button>
        </div>

        <div className="docs-body">
          {activeTab === 'prompt' && (
            <div className="docs-section">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <p style={{ margin: 0 }}>
                  This prompt teaches any modern LLM the complete syntax rules, available themes, shapes, 36 vector icons, and semantic architectural craft standards:
                </p>
                <button
                  className="subtle-btn"
                  onClick={handleCopyPrompt}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}
                >
                  <Icon name={copied ? 'check' : 'copy'} width="13" height="13" />
                  <span>{copied ? 'Copied to clipboard!' : 'Copy full text'}</span>
                </button>
              </div>

              <div className="docs-code-block" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                <div className="code-header">
                  <span>glyph-dsl-system-prompt.md</span>
                  <button onClick={handleCopyPrompt}>
                    {copied ? '✓ Copied!' : 'Copy Prompt'}
                  </button>
                </div>
                <pre>
                  <code>{AI_MASTER_PROMPT}</code>
                </pre>
              </div>

              <div className="docs-feature-grid" style={{ marginTop: '16px' }}>
                <div className="feature-item">
                  <strong>1. Copy Prompt</strong>
                  <span>Click "Copy Prompt" to copy the complete specification to your clipboard.</span>
                </div>
                <div className="feature-item">
                  <strong>2. Send to AI</strong>
                  <span>Paste into ChatGPT, Claude, DeepSeek, or Gemini as system instructions or initial prompt.</span>
                </div>
                <div className="feature-item">
                  <strong>3. Paste into Studio</strong>
                  <span>Paste the generated code into the left editor to instantly render your diagram.</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'usage' && (
            <div className="docs-section">
              <h3>How to Use with Different AI Tools</h3>
              <p>Configure your favorite AI model so it automatically speaks Glyph DSL:</p>

              <div className="docs-syntax-table">
                <div className="syntax-row header">
                  <span>Platform</span>
                  <span>Recommended Setup</span>
                  <span>Usage Flow</span>
                </div>
                <div className="syntax-row">
                  <code>Claude (Anthropic)</code>
                  <span>Add prompt to a <strong>Project's Custom Instructions</strong>.</span>
                  <span>Ask: "Map out our multi-region Kubernetes cluster with Vault and Cilium"</span>
                </div>
                <div className="syntax-row">
                  <code>ChatGPT (OpenAI)</code>
                  <span>Create a <strong>Custom GPT</strong> or paste at the start of a chat.</span>
                  <span>Ask: "Generate a Glyph diagram for a streaming analytics pipeline"</span>
                </div>
                <div className="syntax-row">
                  <code>Cursor / Copilot</code>
                  <span>Save as <code>.cursorrules</code> or <code>rules.md</code> in your repo.</span>
                  <span>Generate diagrams directly inside your IDE workspace</span>
                </div>
                <div className="syntax-row">
                  <code>One-off Chat</code>
                  <span>Paste the master prompt first, then describe what you want.</span>
                  <span>Instant valid Glyph code ready to copy-paste</span>
                </div>
              </div>

              <h4>Pro-Tips for Better AI Architectures</h4>
              <ul className="theme-list">
                <li><strong>Specify the tiering:</strong> Tell the AI whether you want <code>direction LR</code> (event-driven, data pipeline) or <code>direction TD</code> (layered tiers).</li>
                <li><strong>Choose the theme:</strong> Ask for <code>theme blueprint</code> (slate dark), <code>theme noir</code> (stealth dark), <code>theme paper</code> (sepia bronze), <code>theme frost</code> (light blue), or <code>theme editorial</code> (cream paper).</li>
                <li><strong>Ask for specific technologies:</strong> The AI knows to map Kafka to <code>icon: queue</code>, Postgres to <code>icon: postgres</code>, Redis to <code>icon: redis</code>, etc.</li>
              </ul>
            </div>
          )}

          {activeTab === 'examples' && (
            <div className="docs-section">
              <h3>Example AI Request & Generated Diagram</h3>
              <p>Here is an example prompt you can give an AI, along with the architecture code it produces:</p>

              <div className="docs-code-block">
                <div className="code-header">
                  <span>Sample User Prompt to AI</span>
                </div>
                <pre>
                  <code>{SAMPLE_USER_PROMPT}</code>
                </pre>
              </div>

              <h4>Resulting Glyph Architecture</h4>
              <div className="docs-code-block">
                <div className="code-header">
                  <span>Generated Glyph Code</span>
                  <button onClick={handleInsertSample}>
                    {inserted ? '✓ Inserted!' : 'Insert into Editor'}
                  </button>
                </div>
                <pre>
                  <code>{`direction LR
theme blueprint

Client [shape: circle, icon: user, sub: "Web & Mobile App"]
Cdn "CloudFront CDN" [shape: pill, icon: globe, badge: "EDGE"]

group "Public Ingress Zone" [style: dashed] {
  Alb "Application LB" [shape: diamond, icon: router, sub: "AWS ALB"]
  ApiGw "API Gateway" [shape: pill, icon: gateway, badge: "VPC INGRESS"]
}

group "Core Microservices Tier" [style: dashed] {
  AuthSvc "Auth Service" [shape: card, icon: shield, sub: "Go · OIDC"]
  OrderSvc "Order Service" [shape: card, icon: server, sub: "Java · Spring"]
  PaymentSvc "Payment Service" [shape: card, icon: lock, sub: "Node · Stripe"]
  Worker "Event Processor" [shape: hexagon, icon: cpu, sub: "Go Worker"]
}

group "Event Streaming & State" [style: dashed] {
  Kafka "Kafka Cluster" [shape: pill, icon: queue, badge: "EVENT STREAM"]
  RedisCache "Redis Cache" [shape: cylinder, icon: redis, sub: "In-memory · v7"]
  MainDb "Postgres Primary" [shape: cylinder, icon: postgres, badge: "AURORA"]
  AnalyticsDb "ClickHouse" [shape: cylinder, icon: database, sub: "OLAP Storage"]
}

Client -> Cdn : "HTTPS"
Cdn -> Alb : "Origin TLS"
Alb -> ApiGw : "Route"
ApiGw -> AuthSvc : "Validate JWT"
ApiGw -> OrderSvc : "Create Order"
OrderSvc -> PaymentSvc : "Execute Charge"
OrderSvc -> RedisCache : "Check Idempotency"
OrderSvc ~> Kafka : "OrderCreated"
Kafka ~> Worker : "Consume Events"
Worker -> MainDb : "ACID Commit"
Worker => AnalyticsDb : "CDC Ingestion"`}</code>
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
