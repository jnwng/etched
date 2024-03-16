import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import remarkFrontmatter from 'remark-frontmatter';
import remarkMatterPlugin from '@/utilities/matter'; // Adjust the import path as necessary
import type { Parent } from 'unist';

type MarkdownFrontMatter = {
  title?: string;
  description?: string;
};

type MarkdownProcessorProps = {
  markdown: string;
  processedMarkdown?: string;
  onProcessed?: (frontMatter: MarkdownFrontMatter, markdownBody: string) => void; // Callback prop for passing data to parent
};

export const processMarkdown = (markdown: string) => {
  const processor = unified()
    .use(remarkParse)
    .use(remarkStringify)
    .use(remarkFrontmatter)
    .use(() => (tree: Parent) => {
      tree.children = tree.children.filter(child => child.type !== "yaml");
    })
    .use(remarkMatterPlugin);

  const processedMarkdown = processor.processSync(markdown.trim());
  const frontMatter = processedMarkdown.data.matter as MarkdownFrontMatter;
  const content = String(processedMarkdown);
  return { frontMatter, content }
}

const MarkdownProcessor: React.FC<MarkdownProcessorProps> = ({ markdown, processedMarkdown, onProcessed }) => {
  const [markdownBody, setMarkdownBody] = useState(processedMarkdown || '');

  useEffect(() => {
    if (!processedMarkdown) {
      const { frontMatter, content } = processMarkdown(markdown)
      setMarkdownBody(content); // Update local state for rendering
      if (onProcessed) {
        onProcessed(frontMatter, content); // Pass data to parent component
      }
    }
  }, [processedMarkdown, markdown, onProcessed]);

  // Render the processed Markdown content
  return (
    <ReactMarkdown className="prose lg:prose-xl">{markdownBody}</ReactMarkdown>
  );
};

export default MarkdownProcessor;