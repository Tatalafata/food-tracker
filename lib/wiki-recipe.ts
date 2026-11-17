import { DomUtils, parseDocument } from 'htmlparser2';

type HtmlNode = ReturnType<typeof parseDocument>['children'][number];
type HtmlTag = Extract<HtmlNode, { attribs: unknown }>;

export type WikiBlock =
  | { kind: 'heading'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'item'; text: string; marker: string; depth: number; href?: string };

export interface WikiRecipe {
  blocks: WikiBlock[];
  source: string;
}

const originPattern = /^(https:\/\/(?:it|en)\.wikibooks\.org)(?=\/)/;
const pagePattern = /^(?:Cookbook:|Libro di cucina\/Ricette\/).+/;
const hidden = new Set(['script', 'style', 'figure', 'img', 'link', 'figcaption', 'audio', 'video', 'iframe', 'form', 'input', 'button']);
const skipClass = /\b(?:navbox|metadata|mw-editsection|mw-empty-elt|hatnote|toc|sistersitebox|sisterproject|catlinks|reference|reflist|navbar|mbox|noprint|thumb|infobox)\b/i;
const cache = new Map<string, WikiRecipe>();

export function wikiRecipeSource(value: string, base?: string) {
  try {
    const baseOrigin = base?.match(originPattern)?.[1];
    const url = baseOrigin && value.startsWith('/wiki/') ? baseOrigin + value
      : baseOrigin && value.startsWith('./') ? baseOrigin + '/wiki/' + value.slice(2) : value;
    const origin = url.match(originPattern)?.[1];
    if (!origin || !url.startsWith(origin + '/wiki/')) return null;
    const page = decodeURIComponent(url.slice((origin + '/wiki/').length).split(/[?#]/, 1)[0]).replace(/_/g, ' ');
    return pagePattern.test(page) ? { origin, page } : null;
  } catch {
    return null;
  }
}

export function wikiRecipeKey(value: string, base?: string) {
  const source = wikiRecipeSource(value, base);
  return source ? source.origin + '/' + source.page : null;
}

function skipped(node: HtmlTag) {
  return hidden.has(node.name) || skipClass.test(node.attribs.class ?? '')
    || node.attribs.hidden !== undefined || /(?:^|;)\s*display\s*:\s*none\b/i.test(node.attribs.style ?? '');
}

function plain(node: HtmlNode): string {
  if (DomUtils.isText(node)) return node.data;
  if (!DomUtils.isTag(node) || skipped(node) || node.name === 'ul' || node.name === 'ol') return '';
  if (node.name === 'br') return ' ';
  const text = node.children.map(plain).join('');
  if (/^[0-9]+$/.test(text)) {
    const digits = node.name === 'sup' ? '⁰¹²³⁴⁵⁶⁷⁸⁹' : node.name === 'sub' ? '₀₁₂₃₄₅₆₇₈₉' : null;
    if (digits) return text.replace(/[0-9]/g, digit => digits[Number(digit)]);
  }
  return text;
}

export function extractWikiBlocks(html: string): WikiBlock[] {
  const blocks: WikiBlock[] = [];
  const clean = (text: string) => text.replace(/\s+/g, ' ').trim();
  const nonRecipeSection = /^(altri progetti|collegamenti esterni|external links|references|bibliografia|notes et références|bibliography)$/i;
  let omitSection = false;

  function visit(node: HtmlNode, depth = 0) {
    if (!DomUtils.isTag(node) || skipped(node)) return;
    if (/^h[2-6]$/.test(node.name)) {
      const text = clean(plain(node));
      omitSection = nonRecipeSection.test(text);
      if (text && !omitSection) blocks.push({ kind: 'heading', text });
      return;
    }
    if (node.name === 'ul' || node.name === 'ol') {
      if (omitSection) return;
      const items = node.children.filter(child => DomUtils.isTag(child) && child.name === 'li');
      const start = Number(node.attribs.start) || 1;
      items.forEach((item, index) => {
        if (!DomUtils.isTag(item) || skipped(item)) return;
        const text = clean(plain(item));
        const link = item.children.find(child => DomUtils.isTag(child) && child.name === 'a');
        const href = link && DomUtils.isTag(link) && text.startsWith(clean(plain(link))) ? link.attribs.href : undefined;
        if (text) blocks.push({ kind: 'item', text, depth, marker: node.name === 'ol' ? (start + index) + '.' : '•', href });
        item.children.forEach(child => {
          if (DomUtils.isTag(child) && (child.name === 'ul' || child.name === 'ol')) visit(child, depth + 1);
        });
      });
      return;
    }
    if (node.name === 'tr') {
      if (omitSection) return;
      const text = node.children.filter(child => DomUtils.isTag(child) && (child.name === 'td' || child.name === 'th'))
        .map(child => clean(plain(child))).filter(Boolean).join(' · ');
      if (text) blocks.push({ kind: 'paragraph', text });
      return;
    }
    if (node.name === 'p' || node.name === 'dt' || node.name === 'dd') {
      const text = clean(plain(node));
      if (!omitSection && text) blocks.push({ kind: 'paragraph', text });
      return;
    }
    node.children.forEach(child => visit(child, depth));
  }

  parseDocument(html).children.forEach(node => visit(node));
  return blocks;
}

export async function readWikiRecipe(url: string, signal: AbortSignal): Promise<WikiRecipe> {
  const source = wikiRecipeSource(url);
  if (!source) throw new Error('Invalid recipe source');
  const cached = cache.get(url);
  if (cached) return cached;
  const query = '/w/api.php?action=parse&format=json&formatversion=2&prop=text%7Crevid'
    + '&origin=*&redirects=1&disableeditsection=1&disabletoc=1&page=' + encodeURIComponent(source.page);
  const response = await fetch(source.origin + query, {
    signal, headers: { 'Api-User-Agent': 'ChefSuggest/1.0 (https://github.com/Tatalafata/food-tracker)' },
  });
  if (!response.ok) throw new Error('Recipe unavailable');
  const payload = await response.json();
  const html = payload.parse?.text;
  if (typeof html !== 'string' || html.length > 600000) throw new Error('Invalid recipe response');
  const blocks = extractWikiBlocks(html);
  if (!blocks.some(block => block.kind !== 'heading')) throw new Error('Empty recipe');
  const revision = payload.parse.revid;
  const article = {
    blocks,
    source: Number.isInteger(revision) && revision > 0 ? source.origin + '/w/index.php?oldid=' + revision : url,
  };
  cache.set(url, article);
  if (cache.size > 24) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  return article;
}
