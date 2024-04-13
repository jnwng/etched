import { unified } from 'unified';
import rehypeParse from 'rehype-parse';
import rehypeRemark, { Options } from 'rehype-remark';
import remarkStringify from 'remark-stringify';
import { Parent, Node } from 'unist';
import type { Element } from 'hast';
import { defaultHandlers } from 'hast-util-to-mdast';

export const parseClipboardHtml = (pastedHtml: string): string => {
  const processor = unified()
    .use(rehypeParse, { fragment: true }) // Parse the pasted HTML
    .use(() => (tree: Parent) => {
      const firstNonMetaChild = tree.children.find(
        (child) => (child as Element).tagName !== 'meta'
      );
      if (firstNonMetaChild && 'children' in firstNonMetaChild) {
        tree.children = firstNonMetaChild.children as Node[];
      }
    })
    .use(rehypeRemark, {
      handlers: {
        span(h, node) {
          const style = node.properties.style as string;
          if (style.includes('font-weight:700')) {
            return {
              type: 'strong',
              children: node.children,
            };
          }

          if (style.includes('font-style:italic')) {
            return {
              type: 'emphasis',
              children: node.children,
            };
          }

          return defaultHandlers.span(h, node);
        },
      },
    } as Options) // Convert HTML to Markdown
    .use(remarkStringify, {
      handlers: {
        break: () => {
          return '\n';
        },
      },
    }); // Stringify to Markdown

  return processor.processSync(pastedHtml).toString().replace(/\n\n/g, '\n');
};
