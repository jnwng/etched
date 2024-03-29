import React, { useState, useEffect } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import { unified } from 'unified';
import rehypeParse from 'rehype-parse';
import rehypeStringify from 'rehype-stringify';
import rehypeRaw from 'rehype-raw';
import rehypeFormat from 'rehype-format';
import remarkMatterPlugin from '@/utilities/matter'; // Adjust the import path as necessary
import type { Parent } from 'unist';
import remarkGfm from 'remark-gfm';
import rehypeMermaid from 'rehype-mermaid';
export type MarkdownFrontMatter = {
  title?: string;
  description?: string;
};

type MarkdownProcessorProps = {
  markdown: string;
  processedMarkdown?: string;
  onProcessed?: (
    frontMatter: MarkdownFrontMatter,
    markdownBody: string
  ) => void; // Callback prop for passing data to parent
};

export const processMarkdown = async (markdown: string) => {
  console.log({ markdown });
  const processedMarkdown = await unified()
    // .use(remarkParse)
    // .use(remarkRehype)
    .use(rehypeParse)
    .use(rehypeMermaid)
    .use(rehypeStringify)
    .use(rehypeFormat)
    .use(() => (tree: Parent) => {
      console.log({ tree });
      tree.children = tree.children.filter((child) => child.type !== 'yaml');
    })
    .use(remarkMatterPlugin)
    .process(markdown);
  const frontMatter = processedMarkdown.data.matter as MarkdownFrontMatter;
  const content = String(processedMarkdown);
  return { frontMatter, content };
};

const MarkdownProcessor: React.FC<MarkdownProcessorProps> = ({
  markdown,
  processedMarkdown,
  onProcessed,
}) => {
  const [markdownBody, setMarkdownBody] = useState(processedMarkdown || '');

  useEffect(() => {
    const processMarkdownAsync = async () => {
      if (!processedMarkdown) {
        const { frontMatter, content } = await processMarkdown(markdown);
        setMarkdownBody(content); // Update local state for rendering

        if (onProcessed) {
          onProcessed(frontMatter, content); // Pass data to parent component
        }
      }
    };

    processMarkdownAsync();
  }, [processedMarkdown, markdown, onProcessed]);

  const components: Components = {
    // @ts-expect-error Not sure how to fix this!
    code({ node, multiline, className, children, ...props }) {
      if (multiline) {
        return <code {...props}>{children}</code>;
      } else {
        return (
          <code
            {...props}
            className="bg-gray-100 break-spaces whitespace-normal"
          >
            {children}
          </code>
        );
      }
    },
    pre({ node, children, ...props }) {
      const enhancedChildren = React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? // @ts-expect-error Not sure how to fix this!
            React.cloneElement(child, { multiline: true })
          : child
      );
      return (
        <pre className="overflow-x-auto max-w-[calc(100vw-2rem)]" {...props}>
          {enhancedChildren}
        </pre>
      );
    },
  };

  // Render the processed Markdown content
  return (
    <ReactMarkdown
      className="prose lg:prose-xl max-w-[calc(100vw-2rem)]"
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={components}
    >
      {markdownBody}
    </ReactMarkdown>
  );
};

export default MarkdownProcessor;
