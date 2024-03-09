import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkFrontmatter from 'remark-frontmatter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import yaml from 'yaml';
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

  //   const author = "ETchEDh1Uk9B8mGaDkS7sy4zUkkqUVXcbpBn5rW5EiZE";

  //   const description = `
  // ---
  // title: 'Dynamic Solana NFT Details'
  // description: 'Explore the unique attributes and story behind this Solana NFT.'
  // ---

  // # Welcome to the NFT World

  // This NFT, identified by the address ${address}, holds a unique place in the Solana ecosystem. Its attributes, history, and current ownership are a testament to the vibrant community and technological innovation that Solana supports.

  // Explore below for more details about this NFT's journey and significance.
  // `;

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
        <div className="py-6 prose lg:prose-xl">

          <div className="flex gap-2">
            <button className="badge badge-outline">
              Author: {author}
            </button>
            {/* <button className="badge badge-outline">
              Published At: {nft.createdAt.toString()}
            </button> */}
            <button className="badge badge-outline">
              Permaweb Address: {nft.address}
            </button>
          </div>

          <ReactMarkdown>{markdownBody}</ReactMarkdown>
        </div>
      </div>
    </>
  );
}

export default SolanaMarkdown;