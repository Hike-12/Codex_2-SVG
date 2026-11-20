import { useEffect, useState } from 'react';
import { Icon, iconNames } from '../icons';
import { AI_MASTER_PROMPT } from './AiPromptModal';

interface DocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertCode: (snippet: string) => void;
}

export function DocsModal({ isOpen, onClose, onInsertCode }: DocsModalProps) {
  const [activeTab, setActiveTab] = useState<'quickstart' | 'nodes' | 'edges' | 'groups' | 'themes' | 'icons' | 'aiprompt'>('quickstart');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const copyOrInsert = (code: string, idx: number) => {
    onInsertCode(code);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1800);
  };

  return (
    <div className="docs-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="docs-title">
      <div className="docs-modal" onClick={e => e.stopPropagation()}>
        <div className="docs-header">
          <div className="docs-title-wrap">
            <span className="docs-icon">⌘</span>
            <div>
              <h2 id="docs-title">Glyph DSL Guide & Syntax</h2>
              <p>Programmable studio for crisp SVG system architecture diagrams</p>
            </div>
          </div>
          <button className="docs-close-btn" onClick={onClose} aria-label="Close documentation">
            <Icon name="x" width="16" height="16" />
          </button>
        </div>

        <div className="docs-nav">
          <button className={activeTab === 'quickstart' ? 'is-active' : ''} onClick={() => setActiveTab('quickstart')}>Quickstart</button>
          <button className={activeTab === 'nodes' ? 'is-active' : ''} onClick={() => setActiveTab('nodes')}>Nodes & Shapes</button>
          <button className={activeTab === 'edges' ? 'is-active' : ''} onClick={() => setActiveTab('edges')}>Connections & Flows</button>
          <button className={activeTab === 'groups' ? 'is-active' : ''} onClick={() => setActiveTab('groups')}>Groups</button>
          <button className={activeTab === 'themes' ? 'is-active' : ''} onClick={() => setActiveTab('themes')}>Themes & Layout</button>
          <button className={activeTab === 'icons' ? 'is-active' : ''} onClick={() => setActiveTab('icons')}>Icons Reference</button>
          <button className={activeTab === 'aiprompt' ? 'is-active' : ''} onClick={() => setActiveTab('aiprompt')} style={{ color: 'var(--accent)' }}>✦ AI Prompt</button>
        </div>

        <div className="docs-body">
          {activeTab === 'quickstart' && (
            <div className="docs-section">
              <h3>Getting Started with Glyph DSL</h3>
              <p>
                A diagram begins with optional layout directives, followed by node declarations and arrow connections.
                Drag nodes directly on the canvas to customize placement; coordinates save automatically in <code>// @pos</code> comments.
              </p>

              <div className="docs-code-block">
                <div className="code-header">
                  <span>Starter Architecture</span>
                  <button onClick={() => copyOrInsert(`direction LR\ntheme blueprint\n\nClient [shape: circle, icon: user, sub: "Browser"]\nEdgeGateway "Edge Gateway" [shape: pill, icon: gateway, badge: "EDGE"]\nDatabase [shape: cylinder, icon: postgres]\n\nClient -> EdgeGateway : "HTTPS"\nEdgeGateway ~> Database : "Async write"`, 1)}>
                    {copiedIndex === 1 ? '✓ Inserted' : 'Insert into Editor'}
                  </button>
                </div>
                <pre><code>{`direction LR
theme blueprint

Client [shape: circle, icon: user, sub: "Browser"]
EdgeGateway "Edge Gateway" [shape: pill, icon: gateway, badge: "EDGE"]
Database [shape: cylinder, icon: postgres]

Client -> EdgeGateway : "HTTPS"
EdgeGateway ~> Database : "Async write"`}</code></pre>
              </div>

              <div className="docs-feature-grid">
                <div className="feature-item">
                  <strong>Click to Inspect</strong>
                  <span>Click any line or node on the canvas to highlight its exact line in code.</span>
                </div>
                <div className="feature-item">
                  <strong>Keyboard Shortcuts</strong>
                  <span>Press <code>Ctrl + B</code> to toggle the asset panel. Hold <code>Space</code> to pan the canvas.</span>
                </div>
                <div className="feature-item">
                  <strong>Custom Media</strong>
                  <span>Drop your own SVG or PNG in the drawer and refer to it as <code>img: @name</code>.</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'nodes' && (
            <div className="docs-section">
              <h3>Declaring Nodes & Properties</h3>
              <p>
                Declare nodes by their identifier, optional quoted label, and bracketed attributes <code>[attr: value, ...]</code>.
              </p>

              <div className="docs-syntax-table">
                <div className="syntax-row header">
                  <span>Attribute</span>
                  <span>Description</span>
                  <span>Example</span>
                </div>
                <div className="syntax-row">
                  <code>shape</code>
                  <span>One of: <code>card</code>, <code>circle</code>, <code>pill</code>, <code>cylinder</code>, <code>diamond</code>, <code>hexagon</code></span>
                  <code>[shape: pill]</code>
                </div>
                <div className="syntax-row">
                  <code>icon</code>
                  <span>Name of any of the 36 built-in vector icons</span>
                  <code>[icon: gateway]</code>
                </div>
                <div className="syntax-row">
                  <code>sub</code>
                  <span>Secondary subtitle line under the title</span>
                  <code>[sub: "Port 443"]</code>
                </div>
                <div className="syntax-row">
                  <code>badge</code>
                  <span>Upper right status badge</span>
                  <code>[badge: "V2"]</code>
                </div>
                <div className="syntax-row">
                  <code>accent</code>
                  <span>Custom color override for the node's edge accent</span>
                  <code>[accent: "#6366f1"]</code>
                </div>
                <div className="syntax-row">
                  <code>img</code>
                  <span>Reference to custom uploaded image or sample</span>
                  <code>[img: @demo-avatar]</code>
                </div>
              </div>

              <div className="docs-code-block">
                <div className="code-header">
                  <span>Node Shapes Example</span>
                  <button onClick={() => copyOrInsert(`A "Card Shape" [shape: card, icon: server, sub: "Default shape"]\nB "Circle Shape" [shape: circle, icon: user]\nC "Pill Shape" [shape: pill, icon: gateway, badge: "GATEWAY"]\nD "Database Cylinder" [shape: cylinder, icon: postgres]\nE "Router Diamond" [shape: diamond, icon: router]\nF "Worker Hexagon" [shape: hexagon, icon: cpu]`, 2)}>
                    {copiedIndex === 2 ? '✓ Inserted' : 'Insert into Editor'}
                  </button>
                </div>
                <pre><code>{`A "Card Shape" [shape: card, icon: server, sub: "Default shape"]
B "Circle Shape" [shape: circle, icon: user]
C "Pill Shape" [shape: pill, icon: gateway, badge: "GATEWAY"]
D "Database Cylinder" [shape: cylinder, icon: postgres]
E "Router Diamond" [shape: diamond, icon: router]
F "Worker Hexagon" [shape: hexagon, icon: cpu]`}</code></pre>
              </div>
            </div>
          )}

          {activeTab === 'edges' && (
            <div className="docs-section">
              <h3>Connections & Flow Operators</h3>
              <p>
                Connect nodes using standard or animated operators. Append a colon and quoted string <code>: "Label"</code> for edge labels.
              </p>

              <div className="docs-syntax-table">
                <div className="syntax-row header">
                  <span>Operator</span>
                  <span>Behavior</span>
                  <span>Syntax Example</span>
                </div>
                <div className="syntax-row">
                  <code>-&gt;</code>
                  <span>Solid directed connection with arrow</span>
                  <code>Client -&gt; API : "REST"</code>
                </div>
                <div className="syntax-row">
                  <code>~&gt;</code>
                  <span>Dashed async link with live flowing packet dots</span>
                  <code>API ~&gt; Queue : "Events"</code>
                </div>
                <div className="syntax-row">
                  <code>=&gt;</code>
                  <span>High-speed thick stream with rapid packet animation</span>
                  <code>Queue =&gt; Worker : "Batch"</code>
                </div>
                <div className="syntax-row">
                  <code>&lt;-&gt;</code>
                  <span>Bi-directional two-way channel</span>
                  <code>Client &lt;-&gt; Server : "WebSocket"</code>
                </div>
              </div>

              <div className="docs-code-block">
                <div className="code-header">
                  <span>Chained Connections Example</span>
                  <button onClick={() => copyOrInsert(`Client -> EdgeGateway : "HTTPS"\nEdgeGateway -> Service : "gRPC"\nService ~> MessageQueue : "Emit event"\nMessageQueue => Worker : "Stream"\nWorker -> Database : "Persist"`, 3)}>
                    {copiedIndex === 3 ? '✓ Inserted' : 'Insert into Editor'}
                  </button>
                </div>
                <pre><code>{`Client -> EdgeGateway : "HTTPS"
EdgeGateway -> Service : "gRPC"
Service ~> MessageQueue : "Emit event"
MessageQueue => Worker : "Stream"
Worker -> Database : "Persist"`}</code></pre>
              </div>
            </div>
          )}

          {activeTab === 'groups' && (
            <div className="docs-section">
              <h3>Grouping & Clustering Nodes</h3>
              <p>
                Group related microservices or modules with <code>group "Name" {'{'} ... {'}'}</code>.
                Optionally specify <code>[style: dashed]</code> for clean architectural perimeter boundaries.
              </p>

              <div className="docs-code-block">
                <div className="code-header">
                  <span>Cluster Example</span>
                  <button onClick={() => copyOrInsert(`group "Core Cluster" [style: dashed] {\n  Auth [icon: shield, sub: "Identity"]\n  Orders [icon: server, sub: "Order service"]\n  Postgres [shape: cylinder, icon: postgres]\n}\nGateway -> Auth\nGateway -> Orders\nOrders -> Postgres`, 4)}>
                    {copiedIndex === 4 ? '✓ Inserted' : 'Insert into Editor'}
                  </button>
                </div>
                <pre><code>{`group "Core Cluster" [style: dashed] {
  Auth [icon: shield, sub: "Identity"]
  Orders [icon: server, sub: "Order service"]
  Postgres [shape: cylinder, icon: postgres]
}
Gateway -> Auth
Gateway -> Orders
Orders -> Postgres`}</code></pre>
              </div>
            </div>
          )}

          {activeTab === 'themes' && (
            <div className="docs-section">
              <h3>Directives & Themes</h3>
              <p>Directives sit at the top of your document to configure the global studio layout and color palette.</p>

              <div className="docs-syntax-table">
                <div className="syntax-row header">
                  <span>Directive</span>
                  <span>Options</span>
                  <span>Description</span>
                </div>
                <div className="syntax-row">
                  <code>direction</code>
                  <span><code>LR</code> or <code>TD</code></span>
                  <span>Left-to-Right (horizontal pipeline) or Top-to-Down (vertical hierarchy)</span>
                </div>
                <div className="syntax-row">
                  <code>theme</code>
                  <span><code>blueprint</code>, <code>noir</code>, <code>paper</code>, <code>frost</code>, <code>editorial</code></span>
                  <span>Selects from 3 deep dark themes or 2 crisp light architectural themes</span>
                </div>
              </div>

              <h4>Available Palettes</h4>
              <ul className="theme-list">
                <li><strong>Carbon Dusk (<code>theme blueprint</code>)</strong>: Deep slate obsidian with calm dusk iris accents.</li>
                <li><strong>Pure Obsidian (<code>theme noir</code>)</strong>: True pitch black void with titanium silver stealth styling.</li>
                <li><strong>Espresso Amber (<code>theme paper</code>)</strong>: Roasted dark sepia with warm vintage bronze accents.</li>
                <li><strong>Nordic Frost (<code>theme frost</code>)</strong>: Crisp cool white light mode with slate borders and cobalt accents.</li>
                <li><strong>Editorial Cream (<code>theme editorial</code>)</strong>: Warm ivory notebook light mode with classic deep indigo accents.</li>
              </ul>
            </div>
          )}

          {activeTab === 'icons' && (
            <div className="docs-section">
              <h3>36 Built-in Vector Icons</h3>
              <p>Use any of these names inside <code>icon: &lt;name&gt;</code> attribute:</p>
              <div className="docs-icons-grid">
                {iconNames.map(name => (
                  <div key={name} className="docs-icon-card" onClick={() => copyOrInsert(`[icon: ${name}]`, 99)}>
                    <Icon name={name} width="20" height="20" />
                    <span>{name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'aiprompt' && (
            <div className="docs-section">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px' }}>AI Master Prompt</h3>
                  <p style={{ margin: 0, fontSize: '12px' }}>
                    Copy and paste this into ChatGPT, Claude, or Gemini to have AI write perfect Glyph diagrams for you:
                  </p>
                </div>
                <button
                  className="subtle-btn"
                  onClick={async () => {
                    await navigator.clipboard.writeText(AI_MASTER_PROMPT);
                    setCopiedIndex(777);
                    setTimeout(() => setCopiedIndex(null), 1800);
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Icon name={copiedIndex === 777 ? 'check' : 'copy'} width="13" height="13" />
                  <span>{copiedIndex === 777 ? 'Copied to clipboard!' : 'Copy Master Prompt'}</span>
                </button>
              </div>

              <div className="docs-code-block" style={{ maxHeight: '380px', overflowY: 'auto' }}>
                <pre>
                  <code>{AI_MASTER_PROMPT}</code>
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
