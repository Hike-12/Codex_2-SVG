/** Prepare the rendered SVG for a standalone download or clipboard export. */
export function serializeSvg(markup: string, animated = true) {
  let output = markup;
  if (!/\sxmlns=/.test(output)) output = output.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  output = output.replace(/<rect\b[^>]*class="canvas-grid"[^>]*\/?>(?:<\/rect>)?/g, '');
  output = output.replace(/<rect\b[^>]*class="node-hit"[^>]*\/?>(?:<\/rect>)?/g, '');
  if (!animated) output = output.replace(/<circle\b[^>]*class="flow-packet"[^>]*>[\s\S]*?<\/circle>/g, '');
  return '<?xml version="1.0" encoding="UTF-8"?>' + output;
}
