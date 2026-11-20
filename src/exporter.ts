/** Prepare the rendered SVG for a standalone download or clipboard export. */
export type SvgPalette = { panel: string; line: string; text: string; muted: string; accent: string };
export function serializeSvg(markup: string, animated = true, palette: SvgPalette = { panel:'#111114', line:'#29292e', text:'#eeedf0', muted:'#777780', accent:'#67d7ef' }) {
  let output = markup;
  if (!/\sxmlns=/.test(output)) output = output.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  const viewBox = output.match(/viewBox="(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)"/);
  if (viewBox) output = output.replace(/<svg\b[^>]*>/, tag => {
    if (!/\swidth=/.test(tag)) tag = tag.replace('<svg', '<svg width="' + viewBox[3] + '"');
    if (!/\sheight=/.test(tag)) tag = tag.replace('<svg', '<svg height="' + viewBox[4] + '"');
    return tag;
  });
  output = output.replace(/<rect\b[^>]*class="node-hit"[^>]*\/?>(?:<\/rect>)?/g, '');
  output = output.replace(/\sstyle="[^"]*transform:[^"]*"/, '');
  if (!animated) output = output.replace(/<circle\b[^>]*class="flow-packet"[^>]*>[\s\S]*?<\/circle>/g, '');
  const styles = '<style>.node-card{fill:'+palette.panel+';stroke:#44444c;stroke-width:1}.cylinder-base{stroke:#44444c;stroke-width:1}.node-icon{color:'+palette.accent+'}.node-title{fill:'+palette.text+';font:600 11px system-ui,sans-serif}.node-sub{fill:'+palette.muted+';font:9px ui-monospace,monospace}.node-badge{fill:'+palette.accent+'22;stroke:'+palette.accent+'66}.node-badge-text{fill:'+palette.accent+';font:7px ui-monospace,monospace;letter-spacing:.4px}.edge-label-bg{fill:'+palette.panel+';stroke:'+palette.line+';stroke-width:.8}.edge-label{fill:'+palette.muted+';font:8px ui-monospace,monospace}.group-box{fill:'+palette.panel+'08;stroke:'+palette.line+';stroke-width:1}.group-label{fill:'+palette.muted+';font:8px ui-monospace,monospace;letter-spacing:.8px}.flow-packet{filter:drop-shadow(0 0 4px '+palette.accent+')}</style>';
  output = output.replace(/<svg\b[^>]*>/, tag => tag + styles);
  return '<?xml version="1.0" encoding="UTF-8"?>' + output;
}
