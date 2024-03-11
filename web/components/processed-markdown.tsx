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
  onProcessed?: (frontMatter: MarkdownFrontMatter, markdownBody: string) => void; // Callback prop for passing data to parent
};

const MarkdownProcessor: React.FC<MarkdownProcessorProps> = ({ markdown, onProcessed }) => {
  const [markdownBody, setMarkdownBody] = useState('');

  useEffect(() => {
    const processor = unified()
      .use(remarkParse)
      .use(remarkStringify)
      .use(remarkFrontmatter)
      .use(() => (tree: Parent) => {
        tree.children = tree.children.filter(child => child.type !== "yaml");
      })
      .use(remarkMatterPlugin);

    processor.process(markdown.trim()).then((file) => {
      const frontMatter = file.data.matter as MarkdownFrontMatter;
      const processedMarkdownBody = String(file);
      setMarkdownBody(processedMarkdownBody); // Update local state for rendering
      if (onProcessed) {
        onProcessed(frontMatter, processedMarkdownBody); // Pass data to parent component
      }
    });
  }, [markdown, onProcessed]);

  // Render the processed Markdown content
  return (
    <ReactMarkdown className="prose lg:prose-xl">{markdownBody}</ReactMarkdown>
  );
};

export default MarkdownProcessor;