import Markdoc, { type Config, type RenderableTreeNodes } from '@markdoc/markdoc';

// Only type imports may be named: a named runtime import such as `{ Tag }`
// passes under Vitest but breaks the server build (CommonJS interop).

// typographer: curly quotes and proper dashes for anything Charlotte types
// with straight quotes in the admin.
const tokenizer = new Markdoc.Tokenizer({ typographer: true });

// Drop the default <article> wrapper so fragments can sit inside any element.
const config: Config = {
  nodes: {
    document: { ...Markdoc.nodes.document, render: undefined },
  },
};

// Tags whose end is a word boundary in plain text.
const BLOCK_TAGS = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'blockquote', 'hr', 'td', 'th']);

function transform(source: string): RenderableTreeNodes | null {
  if (!source.trim()) return null;
  const ast = Markdoc.parse(tokenizer.tokenize(source));
  return Markdoc.transform(ast, config);
}

export function renderInline(source: string): string {
  const tree = transform(source);
  return tree === null ? '' : Markdoc.renderers.html(tree);
}

function collectText(node: RenderableTreeNodes): string {
  if (node === null || node === undefined) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(collectText).join('');
  if (Markdoc.Tag.isTag(node)) {
    const inner = collectText(node.children as RenderableTreeNodes);
    return BLOCK_TAGS.has(String(node.name)) ? `${inner} ` : inner;
  }
  return '';
}

export function toPlainText(source: string): string {
  const tree = transform(source);
  return tree === null ? '' : collectText(tree).replace(/\s+/g, ' ').trim();
}
