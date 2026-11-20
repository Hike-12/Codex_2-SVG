import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode, type WheelEvent } from 'react';
import { Icon, iconNames } from './icons';
import { layout, type PlacedNode } from './layout';
import { exampleAssets, parse, presets } from './dsl';
import { serializeSvg } from './exporter';
import { Dropdown } from './components/Dropdown';
import { DocsModal } from './components/DocsModal';
import './style.css';
import './interactions.css';

const starter = presets[0].source;

function saveFile(name: string, data: string, type: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([data], { type }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

function nodeClip(n: PlacedNode) {
  const x = n.x, y = n.y, w = n.w, h = n.h;
  const shape = n.shape === 'circle' ? <circle cx={x + w / 2} cy={y + h / 2 - 12} r="16" /> :
    n.shape === 'diamond' ? <polygon points={(x + w / 2) + ',' + y + ' ' + (x + w) + ',' + (y + h / 2) + ' ' + (x + w / 2) + ',' + (y + h) + ' ' + x + ',' + (y + h / 2)} /> :
    n.shape === 'hexagon' ? <polygon points={(x + 20) + ',' + y + ' ' + (x + w - 20) + ',' + y + ' ' + (x + w) + ',' + (y + h / 2) + ' ' + (x + w - 20) + ',' + (y + h) + ' ' + (x + 20) + ',' + (y + h) + ' ' + x + ',' + (y + h / 2)} /> :
    n.shape === 'cylinder' ? <path d={'M ' + x + ' ' + (y + 8) + ' A ' + w / 2 + ' 8 0 0 1 ' + (x + w) + ' ' + (y + 8) + ' V ' + (y + h - 8) + ' A ' + w / 2 + ' 8 0 0 1 ' + x + ' ' + (y + h - 8) + ' Z'} /> :
    <rect x={x} y={y} width={w} height={h} rx={n.shape === 'pill' ? h / 2 : 6} />;
  return <clipPath id={'clip-' + n.id} clipPathUnits="userSpaceOnUse" key={n.id}>{shape}</clipPath>;
}

function highlight(line: string) {
  const tokens = /\/\/.*|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|<->|->|~>|=>|\b(?:direction|theme|group)\b|\b(?:shape|label|sub|icon|img|badge|accent|style)\b(?=\s*:)|\b(?:LR|TD|blueprint|noir|paper|card|circle|pill|cylinder|diamond|hexagon)\b/g;
  const parts: ReactNode[] = [];
  let cursor = 0;
  for (const match of line.matchAll(tokens)) {
    const index = match.index ?? 0;
    if (index > cursor) parts.push(line.slice(cursor, index));
    const value = match[0];
    const kind = value.startsWith('//') ? 'syntax-comment' :
      value.startsWith('"') || value.startsWith("'") ? 'syntax-string' :
      ['->', '~>', '=>', '<->'].includes(value) ? 'syntax-operator' :
      value === 'direction' || value === 'theme' || value === 'group' ? 'syntax-keyword' :
      /^(shape|label|sub|icon|img|badge|accent|style)$/.test(value) ? 'syntax-attribute' : 'syntax-value';
    parts.push(<span className={kind} key={index}>{value}</span>);
    cursor = index + value.length;
  }
  if (cursor < line.length) parts.push(line.slice(cursor));
  return parts;
}

function findNodeLine(id: string, src: string): number | null {
  const lines = src.split(/\r?\n/);
  const direct = new RegExp(`^\\s*${id}\\b`);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith('//')) continue;
    if (direct.test(line)) return i + 1;
  }
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith('//')) continue;
    if (new RegExp(`\\b${id}\\b`).test(line)) return i + 1;
  }
  return null;
}

function findEdgeLine(from: string, to: string, src: string): number | null {
  const lines = src.split(/\r?\n/);
  const edgeRegex = new RegExp(`\\b${from}\\b.*(?:->|~>|=>|<->).*\\b${to}\\b`);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const clean = line.replace(/\/\/.*$/, '');
    if (edgeRegex.test(clean)) return i + 1;
  }
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(from) && (lines[i].includes('->') || lines[i].includes('~>') || lines[i].includes('=>') || lines[i].includes('<->'))) {
      return i + 1;
    }
  }
  return null;
}

export default function App() {
  const [source, setSource] = useState(() => location.hash ? decodeURIComponent(location.hash.slice(1)) : starter);
  const [template, setTemplate] = useState(presets[0].name);
  const [theme, setTheme] = useState<'blueprint' | 'noir' | 'paper' | 'frost' | 'editorial'>('blueprint');
  const [docsOpen, setDocsOpen] = useState(false);
  const [flow, setFlow] = useState(true);
  const [drawer, setDrawer] = useState(() => {
    try {
      const saved = localStorage.getItem('glyph-drawer');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });
  const [tab, setTab] = useState<'icons' | 'images'>('icons');
  const [query, setQuery] = useState('');
  const [zoom, setZoom] = useState(1);
  const [shareDone, setShareDone] = useState(false);
  const [canvasFullscreen, setCanvasFullscreen] = useState(false);
  const [dragging, setDragging] = useState<{ id: string; dx: number; dy: number } | null>(null);
  const [editorWidth, setEditorWidth] = useState<number | null>(null);
  const [resizing, setResizing] = useState(false);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [panning, setPanning] = useState<{ x: number; y: number; px: number; py: number } | null>(null);
  const [assetWarning, setAssetWarning] = useState('');
  const [assets, setAssets] = useState<Record<string, string>>(() => {
    try {
      return { ...exampleAssets, ...JSON.parse(localStorage.getItem('glyph-assets') || '{}') };
    } catch {
      return exampleAssets;
    }
  });
  const [manual, setManual] = useState<Record<string, { x: number; y: number }>>({});
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [activeElementId, setActiveElementId] = useState<string | null>(null);

  const editor = useRef<HTMLTextAreaElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);
  const numbersRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasPaneRef = useRef<HTMLElement>(null);

  const parsed = useMemo(() => parse(source), [source]);
  const model = useMemo(() => layout(parsed, manual), [parsed, manual]);

  // Palettes: dark themes + two light themes
  const palette = theme === 'frost'
    ? ['#f8fafc', '#ffffff', '#e2e8f0', '#0f172a', '#64748b', '#f1f5f9', '#2563eb']
    : theme === 'editorial'
    ? ['#f7f5f0', '#fffef9', '#e5e1d6', '#1c1917', '#78716c', '#f0ede6', '#4338ca']
    : theme === 'paper'
    ? ['#060504', '#0c0a08', '#181512', '#eee9e2', '#756c62', '#100d0a', '#d97706']
    : theme === 'noir'
    ? ['#000000', '#060608', '#131315', '#f2f2f4', '#5c5c64', '#09090b', '#e4e4e7']
    : ['#040507', '#08090d', '#141620', '#e6e8ee', '#646979', '#0c0e16', '#6366f1'];

  const colors = {
    bg: palette[0],
    panel: palette[1],
    line: palette[2],
    text: palette[3],
    muted: palette[4],
    grid: palette[5],
    accent: palette[6]
  };

  useEffect(() => {
    try {
      localStorage.setItem('glyph-assets', JSON.stringify(assets));
      setAssetWarning('');
    } catch {
      setAssetWarning('Storage is full. Image is temporary for this session.');
    }
    document.documentElement.dataset.theme = theme;
  }, [assets, theme]);

  useEffect(() => {
    try {
      localStorage.setItem('glyph-drawer', String(drawer));
    } catch {}
  }, [drawer]);

  useEffect(() => {
    if (parsed.theme !== theme) setTheme(parsed.theme);
  }, [parsed.theme]);

  useEffect(() => {
    const sync = () => setCanvasFullscreen(document.fullscreenElement === canvasPaneRef.current);
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !document.fullscreenElement) setCanvasFullscreen(false);
    };
    document.addEventListener('fullscreenchange', sync);
    window.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('fullscreenchange', sync);
      window.removeEventListener('keydown', escape);
    };
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setDrawer(d => !d);
        return;
      }
      if (e.code === 'Space' && document.activeElement !== editor.current) {
        e.preventDefault();
        setSpaceHeld(true);
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpaceHeld(false);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  const setDirective = (key: 'direction' | 'theme', value: string) => {
    const next = source.split('\n').filter(line => !line.trimStart().startsWith(key + ' ')).join('\n').trimStart();
    setSource(key + ' ' + value + '\n' + next);
  };

  const insertAttribute = (key: string, value: string) => {
    const el = editor.current;
    const caret = el?.selectionStart ?? source.length;
    const lineStart = source.lastIndexOf('\n', Math.max(0, caret - 1)) + 1;
    const foundEnd = source.indexOf('\n', caret);
    const lineEnd = foundEnd < 0 ? source.length : foundEnd;
    const line = source.slice(lineStart, lineEnd);
    const open = line.indexOf('['), close = line.indexOf(']', open);
    let at = -1, text = '';
    if (open >= 0 && caret >= lineStart + open && caret <= lineStart + (close < 0 ? line.length : close)) {
      at = lineStart + (close < 0 ? line.length : close);
      text = (source.slice(lineStart + open + 1, at).trim().length ? ', ' : '') + key + ': ' + value;
    } else if (open >= 0 && close >= 0) {
      at = lineStart + close;
      text = (line.slice(open + 1, close).trim().length ? ', ' : '') + key + ': ' + value;
    } else if (/^[\w-]+(?:\s+"[^"]+")?$/.test(line.trim())) {
      at = lineEnd;
      text = ' [' + key + ': ' + value + ']';
    } else {
      const base = key === 'icon' ? 'Icon' : 'Image';
      let id = base + value.split(/[^a-z0-9]+/i).filter(Boolean).map(x => x[0].toUpperCase() + x.slice(1)).join('');
      id = id || base;
      let suffix = 2;
      while (parsed.nodes.some(n => n.id === id)) id = base + value.replace(/[^a-z0-9]/gi, '') + suffix++;
      at = source.length;
      text = (source.endsWith('\n') ? '' : '\n') + id + ' [' + key + ': ' + value + ']\n';
    }
    const next = source.slice(0, at) + text + source.slice(at);
    setSource(next);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(at + text.length, at + text.length);
    });
  };

  const deleteAsset = (name: string) => {
    setAssets(prev => {
      const next = { ...prev };
      delete next[name];
      try {
        localStorage.setItem('glyph-assets', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const highlightSourceLine = (lineNum: number | null, elementId?: string) => {
    if (!lineNum) return;
    setSelectedLine(lineNum);
    if (elementId) setActiveElementId(elementId);

    const lineHeight = 23;
    if (editor.current) {
      const targetScroll = Math.max(0, (lineNum - 1) * lineHeight - (editor.current.clientHeight / 2) + lineHeight);
      editor.current.scrollTo({ top: targetScroll, behavior: 'smooth' });
      if (highlightRef.current) highlightRef.current.scrollTop = targetScroll;
      if (numbersRef.current) numbersRef.current.scrollTop = targetScroll;
    }
  };

  const pointInSvg = (e: PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current, matrix = svg?.getScreenCTM();
    if (!svg || !matrix) return { x: 0, y: 0 };
    const p = svg.createSVGPoint();
    p.x = e.clientX;
    p.y = e.clientY;
    const q = p.matrixTransform(matrix.inverse());
    return { x: q.x, y: q.y };
  };

  const dragStart = (e: PointerEvent<SVGGElement>, n: PlacedNode) => {
    e.stopPropagation();
    const lineNum = findNodeLine(n.id, source);
    highlightSourceLine(lineNum, n.id);

    if (e.button === 1 || spaceHeld) {
      setPanning({ x: e.clientX, y: e.clientY, px: pan.x, py: pan.y });
      stageRef.current?.setPointerCapture(e.pointerId);
      return;
    }
    const pt = pointInSvg(e as unknown as PointerEvent<SVGSVGElement>);
    setDragging({ id: n.id, dx: pt.x - n.x, dy: pt.y - n.y });
    stageRef.current?.setPointerCapture(e.pointerId);
  };

  const dragMove = (e: PointerEvent<HTMLDivElement>) => {
    if (panning) {
      setPan({ x: panning.px + e.clientX - panning.x, y: panning.py + e.clientY - panning.y });
      return;
    }
    if (!dragging) return;
    const p = pointInSvg(e as unknown as PointerEvent<SVGSVGElement>);
    setManual(m => ({ ...m, [dragging.id]: { x: p.x - dragging.dx, y: p.y - dragging.dy } }));
  };

  const dragEnd = () => {
    if (!dragging) return;
    const p = manual[dragging.id];
    if (p) {
      const cleaned = source.replace(/^\/\/\s*@pos.*(?:\r?\n|$)/gm, '').trimEnd();
      setSource(cleaned + '\n\n' + Object.entries({
        ...Object.fromEntries(parsed.nodes.filter(n => n.position).map(n => [n.id, n.position!])),
        ...manual
      }).map(([id, pos]) => '// @pos ' + id + ': ' + Math.round(pos.x) + ',' + Math.round(pos.y)).join('\n'));
    }
    setDragging(null);
  };

  const choosePreset = (name: string) => {
    const p = presets.find(x => x.name === name);
    if (p) {
      setTemplate(name);
      setSource(p.source);
      setManual({});
      setTheme(parse(p.source).theme);
      setSelectedLine(null);
      setActiveElementId(null);
    }
  };

  const share = async () => {
    const url = location.origin + location.pathname + '#' + encodeURIComponent(source);
    await navigator.clipboard.writeText(url);
    history.replaceState(null, '', '#' + encodeURIComponent(source));
    setShareDone(true);
    setTimeout(() => setShareDone(false), 1800);
  };

  const reset = () => {
    setSource(source.replace(/^\/\/\s*@pos.*(?:\r?\n|$)/gm, '').trimEnd());
    setManual({});
    setSelectedLine(null);
    setActiveElementId(null);
  };

  const toggleCanvasFullscreen = async () => {
    const pane = canvasPaneRef.current;
    if (!pane) return;
    if (document.fullscreenElement === pane) {
      await document.exitFullscreen();
      return;
    }
    if (canvasFullscreen) {
      setCanvasFullscreen(false);
      return;
    }
    try {
      await pane.requestFullscreen();
    } catch {
      setCanvasFullscreen(true);
    }
  };

  const finishPointer = () => {
    dragEnd();
    setPanning(null);
  };

  const resizePane = (e: PointerEvent<HTMLDivElement>) => {
    if (!resizing || !workspaceRef.current) return;
    const rect = workspaceRef.current.getBoundingClientRect();
    const drawerWidth = drawer ? (document.querySelector('.asset-drawer')?.getBoundingClientRect().width ?? 0) : 0;
    const max = rect.width - drawerWidth - 310;
    setEditorWidth(Math.max(280, Math.min(max, e.clientX - rect.left - drawerWidth)));
  };

  const resizeEditorBy = (delta: number) => {
    const rect = workspaceRef.current?.getBoundingClientRect();
    const drawerWidth = drawer ? (document.querySelector('.asset-drawer')?.getBoundingClientRect().width ?? 0) : 0;
    const max = Math.max(280, (rect?.width ?? 1000) - drawerWidth - 310);
    setEditorWidth(w => Math.max(280, Math.min(max, (w ?? ((rect?.width ?? 1000) * .38)) + delta)));
  };

  const zoomAtWheel = (e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    setZoom(z => Math.max(.45, Math.min(1.8, z * (e.deltaY < 0 ? 1.08 : .92))));
  };

  const startPan = (e: PointerEvent<HTMLDivElement>) => {
    const target = e.target as Element;
    if (e.button === 1 || spaceHeld || !target.closest('.diagram-node')) {
      e.preventDefault();
      setPanning({ x: e.clientX, y: e.clientY, px: pan.x, py: pan.y });
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const svgText = () => svgRef.current ? serializeSvg(new XMLSerializer().serializeToString(svgRef.current), flow, colors) : '';

  const png = () => {
    const img = new Image();
    const url = URL.createObjectURL(new Blob([svgText()], { type: 'image/svg+xml' }));
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.width * 2;
      c.height = img.height * 2;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.scale(2, 2);
        ctx.drawImage(img, 0, 0);
        c.toBlob(b => {
          if (b) {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(b);
            a.download = 'glyph-craft-diagram.png';
            a.click();
          }
        });
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const handleExportAction = (action: string) => {
    if (action === 'svg') {
      saveFile('glyph-craft-diagram.svg', svgText(), 'image/svg+xml');
    } else if (action === 'png') {
      png();
    } else if (action === 'copy') {
      navigator.clipboard.writeText(svgText());
    }
  };

  const upload = (file?: File) => {
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(file.type)) {
      setAssetWarning('Choose a PNG, JPG, WEBP, or SVG image.');
      return;
    }
    const rd = new FileReader();
    rd.onload = () => {
      const name = file.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      setAssets(a => ({ ...a, [name]: String(rd.result) }));
      insertAttribute('img', '@' + name);
    };
    rd.readAsDataURL(file);
  };

  const vars = {
    '--bg': colors.bg,
    '--panel': colors.panel,
    '--line': colors.line,
    '--ink': colors.text,
    '--muted': colors.muted,
    '--grid': colors.grid,
    '--accent': colors.accent
  } as CSSProperties;

  const templateOptions = presets.map(p => ({ value: p.name, label: p.name }));
  const themeOptions = [
    { value: 'blueprint', label: 'Carbon Dusk (Slate)', badge: 'Dark' },
    { value: 'noir', label: 'Pure Obsidian (Stealth)', badge: 'Dark' },
    { value: 'paper', label: 'Espresso Amber (Sepia)', badge: 'Dark' },
    { value: 'frost', label: 'Nordic Frost', badge: 'Light' },
    { value: 'editorial', label: 'Editorial Cream', badge: 'Light' }
  ];
  const exportOptions = [
    { value: 'svg', label: 'Animated SVG', icon: 'download' },
    { value: 'png', label: '2× Retina PNG', icon: 'image' },
    { value: 'copy', label: 'Copy SVG Code', icon: 'copy' }
  ];

  return (
    <main className="app-shell" style={vars}>
      <header className="topbar">
        <button
          className={`icon-btn panel-toggle-btn ${drawer ? 'is-active' : ''}`}
          onClick={() => setDrawer(!drawer)}
          title={drawer ? 'Collapse assets panel (Ctrl+B)' : 'Expand assets panel (Ctrl+B)'}
          aria-label="Toggle assets panel"
          aria-expanded={drawer}
        >
          <Icon name="sidebar" width="16" height="16" />
        </button>

        <div className="brand">
          <div className="brand-mark">
            <svg viewBox="0 0 24 24">
              <path d="M4 17 12 4l8 13H4Zm4-6h8M7 17l5-6 5 6" />
            </svg>
          </div>
          <span>glyph<span className="brand-dash">/</span>craft</span>
        </div>

        <Dropdown
          label="TEMPLATE"
          value={template}
          options={templateOptions}
          onChange={choosePreset}
        />

        <div className="direction-switch">
          <button
            className={parsed.direction === 'LR' ? 'active' : ''}
            onClick={() => setDirective('direction', 'LR')}
            title="Left to right layout"
          >
            LR <span>→</span>
          </button>
          <button
            className={parsed.direction === 'TD' ? 'active' : ''}
            onClick={() => setDirective('direction', 'TD')}
            title="Top to down layout"
          >
            TD <span>↓</span>
          </button>
        </div>

        <Dropdown
          label="THEME"
          value={theme}
          options={themeOptions}
          onChange={t => {
            const nextTheme = t as typeof theme;
            setTheme(nextTheme);
            setDirective('theme', nextTheme);
          }}
        />

        <div className="toolbar-spacer" />

        <button
          className={`flow-toggle ${flow ? 'is-on' : ''}`}
          onClick={() => setFlow(!flow)}
          title="Toggle animated edge flow"
        >
          <span className="flow-dot" />
          {flow ? 'Flow on' : 'Flow off'}
        </button>

        <button className="toolbar-btn reset-btn" onClick={reset} title="Reset manual node positions">
          <span>↻</span> Reset layout
        </button>

        <button className="toolbar-btn share-btn" onClick={share} title="Copy diagram link to clipboard">
          <span>{shareDone ? '✓' : '⌁'}</span> {shareDone ? 'Copied' : 'Share'}
        </button>

        <Dropdown
          align="right"
          options={exportOptions}
          onChange={handleExportAction}
          triggerContent={(_, isOpen) => (
            <div className="toolbar-btn" style={{ gap: '6px' }}>
              <span>Export</span>
              <span className={`dropdown-chevron ${isOpen ? 'is-open' : ''}`}>
                <Icon name="chevron-down" width="13" height="13" />
              </span>
            </div>
          )}
        />
      </header>

      <section className="workspace" ref={workspaceRef}>
        {drawer && (
          <aside className="asset-drawer">
            <div className="drawer-tabs">
              <div className="drawer-tabs-group">
                <button className={tab === 'icons' ? 'selected' : ''} onClick={() => setTab('icons')}>
                  Icons <span>36</span>
                </button>
                <button className={tab === 'images' ? 'selected' : ''} onClick={() => setTab('images')}>
                  Images <span>{Object.keys(assets).length}</span>
                </button>
              </div>
              <button
                className="drawer-close-btn"
                onClick={() => setDrawer(false)}
                title="Collapse panel (Ctrl+B)"
                aria-label="Collapse panel"
              >
                <Icon name="x" width="14" height="14" />
              </button>
            </div>

            {tab === 'icons' ? (
              <>
                <div className="drawer-search">
                  <Icon name="search" />
                  <input
                    name="icon-search"
                    placeholder="Find an icon..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                  />
                  <kbd>/</kbd>
                </div>
                <div className="icon-grid">
                  {iconNames
                    .filter(n => n.includes(query.toLowerCase()))
                    .map(name => (
                      <button key={name} title={name} onClick={() => insertAttribute('icon', name)}>
                        <Icon name={name} />
                        <span>{name}</span>
                      </button>
                    ))}
                </div>
                <div className="drawer-hint">
                  <span>↳</span> Click an icon to add it to your code
                </div>
              </>
            ) : (
              <div className="images-panel">
                <label
                  className="upload-zone"
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    upload(e.dataTransfer.files[0]);
                  }}
                >
                  <input
                    type="file"
                    name="image-upload"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={e => upload(e.target.files?.[0])}
                  />
                  <b>↑</b>
                  <strong>Drop an image here</strong>
                  <span>or browse · PNG, JPG, SVG</span>
                </label>
                {assetWarning && <p className="asset-warning">{assetWarning}</p>}
                {Object.entries(assets).map(([name, url]) => (
                  <div className="asset-row" key={name}>
                    <button
                      className="asset-row-select"
                      type="button"
                      onClick={() => insertAttribute('img', '@' + name)}
                      title={`Insert @${name} into code`}
                    >
                      <img src={url} alt={name} />
                      <span>@{name}</span>
                    </button>
                    <button
                      className="asset-delete-btn"
                      type="button"
                      title={`Delete @${name}`}
                      aria-label={`Delete @${name}`}
                      onClick={e => {
                        e.stopPropagation();
                        deleteAsset(name);
                      }}
                    >
                      <Icon name="trash" width="13" height="13" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </aside>
        )}

        <div
          className="editor-pane"
          style={{ '--editor-width': editorWidth === null ? '38%' : editorWidth + 'px' } as CSSProperties}
        >
          <div className="pane-header">
            <div className="pane-title">
              <span className="code-icon">⌘</span>
              <span>Diagram source</span>
              <span className="language-pill">GLYPH DSL</span>
            </div>
            <button className="subtle-btn" onClick={() => setDocsOpen(true)}>
              Syntax guide <span>↗</span>
            </button>
          </div>

          <div className="editor-wrap">
            <div ref={numbersRef} className="line-numbers">
              {source.split('\n').map((_, i) => (
                <span
                  key={i}
                  className={`line-num ${selectedLine === i + 1 ? 'is-highlighted' : ''}`}
                  onClick={() => setSelectedLine(i + 1)}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
              ))}
            </div>
            <div className="code-input">
              <pre ref={highlightRef} className="syntax-highlight" aria-hidden="true">
                {source.split('\n').map((line, i) => (
                  <span
                    key={i}
                    className={`syntax-line ${selectedLine === i + 1 ? 'is-highlighted' : ''}`}
                  >
                    {highlight(line)}
                    {i < source.split('\n').length - 1 ? '\n' : ''}
                  </span>
                ))}
              </pre>
              <textarea
                ref={editor}
                name="diagram-source"
                spellCheck={false}
                value={source}
                onChange={e => {
                  setSource(e.target.value);
                  history.replaceState(null, '', location.pathname + location.search);
                }}
                onScroll={e => {
                  if (highlightRef.current) {
                    highlightRef.current.scrollTop = e.currentTarget.scrollTop;
                    highlightRef.current.scrollLeft = e.currentTarget.scrollLeft;
                  }
                  if (numbersRef.current) numbersRef.current.scrollTop = e.currentTarget.scrollTop;
                }}
                aria-label="Diagram DSL source"
              />
            </div>
          </div>

          {parsed.errors.length > 0 && (
            <div className="error-banner">
              <span>!</span>
              <div>
                <b>Line {parsed.errors[0].line}</b> {parsed.errors[0].message}
              </div>
            </div>
          )}

          <div className="editor-footer">
            <span>
              <i className="status-light" /> Live
            </span>
            <span>
              {parsed.nodes.length} nodes <b>·</b> {parsed.edges.length} connections
            </span>
          </div>
        </div>

        <div
          className="splitter"
          onPointerDown={e => {
            setResizing(true);
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={resizePane}
          onPointerUp={() => setResizing(false)}
          onDoubleClick={() => setEditorWidth(null)}
          onKeyDown={e => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
              e.preventDefault();
              resizeEditorBy(e.key === 'ArrowRight' ? 24 : -24);
            }
          }}
          role="separator"
          tabIndex={0}
          aria-orientation="vertical"
          aria-label="Resize editor and canvas"
          aria-valuemin={280}
          aria-valuemax={Math.max(280, (workspaceRef.current?.clientWidth ?? 1440) - (drawer ? (window.innerWidth <= 1120 ? 184 : 224) : 0) - 310)}
          aria-valuenow={Math.round(editorWidth ?? ((workspaceRef.current?.clientWidth ?? 1440) * .38))}
        />

        <section className={'canvas-pane' + (canvasFullscreen && !document.fullscreenElement ? ' is-fullscreen' : '')} ref={canvasPaneRef}>
          <div className="canvas-heading">
            <div>
              <span className="canvas-label">CANVAS</span>
              <span className="canvas-title">{template}</span>
            </div>
            <div className="canvas-tools">
              <div className="canvas-tools-group">
                <button onClick={() => setZoom(z => Math.max(.45, z / 1.12))} aria-label="Zoom out">−</button>
                <button
                  className="zoom-value zoom-reset"
                  onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
                  aria-label={Math.round(zoom * 100) + '%, reset zoom'}
                >
                  {Math.round(zoom * 100)}%
                </button>
                <button onClick={() => setZoom(z => Math.min(1.8, z * 1.12))} aria-label="Zoom in">+</button>
                <button
                  className="fit-btn"
                  title="Reset view"
                  aria-label="Reset view"
                  onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
                >
                  ↺
                </button>
                <button
                  className="fullscreen-btn"
                  title={canvasFullscreen ? 'Exit fullscreen' : 'View canvas fullscreen'}
                  aria-label={canvasFullscreen ? 'Exit fullscreen' : 'View canvas fullscreen'}
                  aria-pressed={canvasFullscreen}
                  onClick={toggleCanvasFullscreen}
                >
                  <Icon name={canvasFullscreen ? 'minimize' : 'maximize'} width="14" height="14" />
                </button>
              </div>
            </div>
          </div>

          <div
            ref={stageRef}
            className="canvas-stage"
            onPointerDown={startPan}
            onPointerMove={dragMove}
            onPointerUp={finishPointer}
            onPointerCancel={finishPointer}
            onWheel={zoomAtWheel}
          >
            <svg
              ref={svgRef}
              className="diagram-svg"
              viewBox={model.viewBox}
              style={{ transform: 'translate(' + pan.x + 'px,' + pan.y + 'px) scale(' + zoom + ')' }}
              role="img"
              aria-label="Live diagram preview"
            >
              <defs>
                <pattern id="dot-grid" width="26" height="26" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="1" fill={colors.grid} />
                </pattern>
                <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
                  <path d="M0 0 10 5 0 10z" fill={colors.muted} />
                </marker>
                <marker id="arrow-accent" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M0 0 10 5 0 10z" fill={colors.accent} />
                </marker>
                {model.nodes.map(nodeClip)}
              </defs>

              <rect className="canvas-grid" x={model.bounds.x} y={model.bounds.y} width={model.bounds.w} height={model.bounds.h} fill="url(#dot-grid)" />

              {model.groups.map(g => (
                <g key={g.id}>
                  <rect className="group-box" x={g.x} y={g.y} width={g.w} height={g.h} rx="8" strokeDasharray={g.style === 'dashed' ? '5 5' : undefined} />
                  <text x={g.x + 14} y={g.y + 20} className="group-label">{g.label.toUpperCase()}</text>
                </g>
              ))}

              {model.edges.map((e, i) => {
                const edgeKey = `${e.from.id}->${e.to.id}`;
                const isEdgeActive = activeElementId === edgeKey;
                return (
                  <g
                    key={i}
                    className={`diagram-edge ${isEdgeActive ? 'is-active' : ''}`}
                    onClick={(evt) => {
                      evt.stopPropagation();
                      const lineNum = findEdgeLine(e.from.id, e.to.id, source);
                      highlightSourceLine(lineNum, edgeKey);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Invisible wider hit area for easy clicking on connection lines */}
                    <path
                      d={e.d}
                      fill="none"
                      stroke="transparent"
                      strokeWidth={14}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d={e.d}
                      fill="none"
                      stroke={isEdgeActive ? colors.accent : (e.kind === 'async' || e.kind === 'stream' ? colors.accent : colors.muted)}
                      strokeWidth={isEdgeActive ? (e.kind === 'stream' ? 3.6 : 2.6) : (e.kind === 'stream' ? 2.8 : 1.6)}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray={e.kind === 'async' ? '5 5' : undefined}
                      markerStart={e.kind === 'sync' ? 'url(#arrow-accent)' : undefined}
                      markerEnd={e.kind === 'sync' || isEdgeActive ? 'url(#arrow-accent)' : 'url(#arrow)'}
                    />
                    {e.label && (
                      <g>
                        <rect
                          x={e.lx - e.label.length * 3.2 - 12}
                          y={e.ly - 10}
                          width={e.label.length * 6.4 + 24}
                          height="20"
                          rx="4"
                          className="edge-label-bg"
                        />
                        <text x={e.lx} y={e.ly + 3} textAnchor="middle" className="edge-label">{e.label}</text>
                      </g>
                    )}
                    {flow && (e.kind === 'async' || e.kind === 'stream') && (e.kind === 'stream' ? [0, .4, .8] : [0]).map((offset, j) => (
                      <circle
                        key={j}
                        className="flow-packet"
                        r={e.kind === 'stream' ? 3 : 2.2}
                        fill={colors.accent}
                      >
                        <animateMotion begin={offset + 's'} dur={e.kind === 'stream' ? '1.2s' : '2.5s'} repeatCount="indefinite" path={e.d} />
                      </circle>
                    ))}
                  </g>
                );
              })}

              {model.nodes.map(n => {
                const centered = n.shape === 'circle';
                const imageX = centered ? n.x + (n.w - 32) / 2 : n.x + 16;
                const iconX = centered ? n.x + (n.w - 24) / 2 : n.x + 16;
                const titleX = centered ? n.x + n.w / 2 : n.x + (n.icon || n.image ? 50 : 16);
                const isNodeActive = activeElementId === n.id;

                return (
                  <g
                    key={n.id}
                    className={`diagram-node ${isNodeActive ? 'is-active' : ''}`}
                    onPointerDown={e => dragStart(e, n)}
                    onClick={e => {
                      e.stopPropagation();
                      const lineNum = findNodeLine(n.id, source);
                      highlightSourceLine(lineNum, n.id);
                    }}
                    style={{ cursor: dragging?.id === n.id ? 'grabbing' : 'grab' }}
                  >
                    {n.shape === 'diamond' ? (
                      <polygon points={(n.x + n.w / 2) + ',' + n.y + ' ' + (n.x + n.w) + ',' + (n.y + n.h / 2) + ' ' + (n.x + n.w / 2) + ',' + (n.y + n.h) + ' ' + n.x + ',' + (n.y + n.h / 2)} className="node-card" />
                    ) : n.shape === 'hexagon' ? (
                      <polygon points={(n.x + 20) + ',' + n.y + ' ' + (n.x + n.w - 20) + ',' + n.y + ' ' + (n.x + n.w) + ',' + (n.y + n.h / 2) + ' ' + (n.x + n.w - 20) + ',' + (n.y + n.h) + ' ' + (n.x + 20) + ',' + (n.y + n.h) + ' ' + n.x + ',' + (n.y + n.h / 2)} className="node-card" />
                    ) : n.shape === 'circle' ? (
                      <ellipse cx={n.x + n.w / 2} cy={n.y + n.h / 2} rx={n.w / 2} ry={n.h / 2} className="node-card" />
                    ) : n.shape === 'cylinder' ? (
                      <g>
                        <rect x={n.x} y={n.y + 6} width={n.w} height={n.h - 12} className="node-card" />
                        <ellipse cx={n.x + n.w / 2} cy={n.y + 7} rx={n.w / 2} ry="7" className="node-card" />
                        <path d={'M ' + n.x + ' ' + (n.y + n.h - 7) + ' Q ' + (n.x + n.w / 2) + ' ' + (n.y + n.h + 7) + ' ' + (n.x + n.w) + ' ' + (n.y + n.h - 7)} fill="none" className="cylinder-base" />
                      </g>
                    ) : (
                      <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={n.shape === 'pill' ? n.h / 2 : 6} className="node-card" />
                    )}

                    {n.accent && n.shape !== 'circle' && (
                      <rect x={n.x + 1} y={n.y + 10} width="2" height={n.h - 20} rx="1" fill={n.accent} />
                    )}
                    {n.image && (
                      <image
                        href={n.image.startsWith('@') ? assets[n.image.slice(1)] : n.image}
                        x={imageX}
                        y={n.y + n.h / 2 + (centered ? -28 : -16)}
                        width="32"
                        height="32"
                        preserveAspectRatio="xMidYMid slice"
                        clipPath={'url(#clip-' + n.id + ')'}
                      />
                    )}
                    {n.icon && !n.image && (
                      <g transform={'translate(' + iconX + ' ' + (n.y + n.h / 2 + (centered ? -30 : -12)) + ')'} className="node-icon">
                        <Icon name={n.icon} width="22" height="22" />
                      </g>
                    )}
                    <text
                      x={titleX}
                      y={n.y + n.h / 2 + (centered ? 22 : (n.sub ? -3 : 4))}
                      textAnchor={centered ? 'middle' : undefined}
                      className="node-title"
                    >
                      {n.label.length > (centered ? 16 : 20) ? n.label.slice(0, centered ? 15 : 19) + '…' : n.label}
                    </text>
                    {n.sub && (
                      <text
                        x={titleX}
                        y={n.y + n.h / 2 + (centered ? 37 : 14)}
                        textAnchor={centered ? 'middle' : undefined}
                        className="node-sub"
                      >
                        {n.sub.length > 23 ? n.sub.slice(0, 22) + '…' : n.sub}
                      </text>
                    )}
                    {n.badge && (
                      <g>
                        <rect x={n.x + n.w - 52} y={n.y + 8} width="42" height="15" rx="3" className="node-badge" />
                        <text x={n.x + n.w - 31} y={n.y + 19} className="node-badge-text" textAnchor="middle">{n.badge}</text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>

            {parsed.errors.length > 0 && (
              <div className="canvas-empty-state">
                <span>↯</span>
                <b>Preview paused at line {parsed.errors[0].line}</b>
                <small>Fix the syntax in the editor to continue.</small>
              </div>
            )}

            <div className="canvas-corner">
              {model.nodes.length} ELEMENTS <span>·</span> SVG 1.1
            </div>
          </div>
        </section>
      </section>

      <DocsModal
        isOpen={docsOpen}
        onClose={() => setDocsOpen(false)}
        onInsertCode={(snippet) => { setSource(prev => prev + '\n' + snippet); }}
      />
    </main>
  );
}
