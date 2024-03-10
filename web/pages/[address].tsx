import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkFrontmatter from 'remark-frontmatter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import env from '../components/env';
import Head from 'next/head';
import remarkMatterPlugin from '@/utilities/matter';
import type { Parent } from 'unist'

export const getStaticPaths = () => {
  return { paths: [], fallback: "blocking" };
};

// Order of operations
// NFT
// - Name (Max 32 characters)
// - Author address (Pubkey; resolves to shortname)
// - Created at (Mint time)
// Markdown (optional)
// - Name (Truncated at 32 characters)
// - Summary (Truncated at 140 characters)
// - Description (Content)
// - 

export async function getStaticProps({ params: { address } }: { params: { address: string } }) {
  // TODO(jon): Switch this endpoint based on environment / subdomain
  // Temporarily commenting out the dynamic fetch to use static file
  const res = await fetch(env.DEVNET_HELIUS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getAsset",
      params: [address],
    }),
  });
  const data = await res.json();

  // TODO(jon): Figure out the author's shortname
  const { result: { ownership: { owner: author }, content: { metadata: { name } } } } = data;


  const contentRes = await fetch(data.result.content.json_uri);
  const { description, image } = await contentRes.json();

  // Directly pass markdown content to the component
  return {
    props: {
      author,
      nft: {
        address,
        name,
        imageUri: image,
        content: description,
        // createdAt: undefined,
      }
    },
    revalidate: 60
  };
}

type SolanaMarkdownProps = {
  nft: {
    address: string;
    name: string;
    imageUri: string;
    // createdAt: Date;
    content: string;
  };
  author: string;
};

type MarkdownFrontMatter = {
  title?: string;
  // This is labeled "description" but is actually more akin to a "summary"
  description?: string;
}

const Stats = ({ author, mint }: { author: string, mint: string }) => (
  <div className="flex flex-col sm:flex-row gap-2">
    <div className="stats shadow stats-vertical w-full">
      <div className="stat p-1 sm:p-2">
        <div className="stat-desc">Author</div>
        <div className="stat-title text-xs">
          <div className="flex items-center space-x-2">
            <span>{author}</span>
            <a href={`https://solana.fm/address/${author}/transactions`} target="_blank" rel="noopener noreferrer">
              <svg className="h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />  <polyline points="15 3 21 3 21 9" />  <line x1="10" y1="14" x2="21" y2="3" /></svg>
            </a>
          </div>
        </div>
      </div>

      <div className="stat p-1 sm:p-2">
        <div className="stat-desc">Mint</div>
        <div className="stat-title text-xs">
          <div className="flex items-center space-x-2">
            <span>{mint}</span>
            <a href={`https://solana.fm/address/${mint}/transactions`} target="_blank" rel="noopener noreferrer">
              <svg className="h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />  <polyline points="15 3 21 3 21 9" />  <line x1="10" y1="14" x2="21" y2="3" /></svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
)

function SolanaMarkdown({ nft, author }: SolanaMarkdownProps) {
  const [frontMatter, setMarkdownFrontMatter] = useState<MarkdownFrontMatter>();
  const [markdownBody, setMarkdownBody] = useState('');

  useEffect(() => {
    const processor = unified()
      .use(remarkParse)
      .use(remarkStringify)
      .use(remarkFrontmatter)
      .use(() => (tree: Parent) => {
        tree.children = tree.children.filter(child => child.type !== "yaml");
      })
      .use(remarkMatterPlugin)

    processor.process(nft.content.trim()).then((file) => {
      setMarkdownFrontMatter(file.data.matter as MarkdownFrontMatter);
      setMarkdownBody(String(file));
    });
  }, [nft]);

  const title = frontMatter?.title ?? nft.name ?? "Untitled Piece";
  const description = frontMatter?.description ?? nft.content.slice(0, 140);
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        {/* OpenGraph */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:site_name" content="ETCHED" />
        <meta property="og:type" content="article" />
        {/* TODO: Make this the fully-qualified URL; pull out the domain entirely based on environment */}
        {/* <meta property="og:url" content={`https://etched.id/${frontMatter.slug}`} />  */}
        {/* TODO(jon): Replace this default */}
        <meta property="og:image" content={nft.imageUri || "https://etched.com/default-image.jpg"} />
        {/* TODO: Pull published_time from the NFT */}
        {/* <meta property="article:published_time" content={nft.createdAt.toString() || new Date().toISOString()} /> */}
        {/* TODO: Pull author from the NFT */}
        <meta property="article:author" content={author || "Anonymous"} />

        {/* Twitter Cards */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
      </Head>
      <div className="flex justify-center">
        <div className="py-6 px-4">
          <ReactMarkdown className="prose lg:prose-xl">{markdownBody}</ReactMarkdown>
          <div className='py-6'>
            <Stats author={author} mint={nft.address} />
          </div>
        </div>
      </div>
    </>
  );
}

export default SolanaMarkdown;