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

export const getStaticPaths = () => {
  return { paths: [], fallback: "blocking" };
};

export async function getStaticProps({ params: { address } }: { params: { address: string } }) {
  // TODO(jon): Switch this endpoint based on environment / subdomain
  // Temporarily commenting out the dynamic fetch to use static file
  /*
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

  const {result: { ownership: {owner}}} = data;
  TODO(jon): Figure out the author / shortname

  const author = owner;

  const contentRes = await fetch(data.result.content.json_uri);
  const { description } = await contentRes.json();
  */

  const author = "ETchEDh1Uk9B8mGaDkS7sy4zUkkqUVXcbpBn5rW5EiZE";

  const description = `
---
title: 'Dynamic Solana NFT Details'
description: 'Explore the unique attributes and story behind this Solana NFT.'
---

# Welcome to the NFT World

This NFT, identified by the address ${address}, holds a unique place in the Solana ecosystem. Its attributes, history, and current ownership are a testament to the vibrant community and technological innovation that Solana supports.

Explore below for more details about this NFT's journey and significance.
`;

  // Directly pass markdown content to the component
  return {
    props: {
      author,
      contentMarkdown: description,
    },
  };
}

type SolanaMarkdownProps = {
  contentMarkdown: string;
  author: string;
};

function SolanaMarkdown({ contentMarkdown, author }: SolanaMarkdownProps) {
  const [frontMatter, setFrontMatter] = useState({});
  const [markdownBody, setMarkdownBody] = useState('');

  useEffect(() => {
    const processor = unified()
      .use(remarkParse)
      .use(remarkStringify)
      .use(remarkFrontmatter)
      .use(() => tree => {
        tree.children = tree.children.filter(child => child.type !== "yaml");
      })
      .use(remarkMatterPlugin)

    processor.process(contentMarkdown.trim()).then((file) => {
      setFrontMatter(file.data.matter);
      setMarkdownBody(String(file));
    });
  }, [contentMarkdown]);

  return (
    <div className="flex justify-center">
      <div className="py-6 prose lg:prose-xl">
        <Head>
          <title>{frontMatter.title}</title>
          <meta name="description" content={frontMatter.description} />
          <meta property="og:title" content={frontMatter.title} />
          <meta property="og:description" content={frontMatter.description} />
          <meta property="og:site_name" content="ETCHED" />
          <meta property="og:type" content="article" />
          {/* TODO: Make this the fully-qualified URL */}
          <meta property="og:url" content={`https://etched.com/${frontMatter.slug}`} />
          {/* TODO: Make these default values smarter based on NFT attributes or metadata */}
          <meta property="og:image" content={frontMatter.image || "https://etched.com/default-image.jpg"} />
          <meta property="article:published_time" content={frontMatter.date || new Date().toISOString()} />
          <meta property="article:author" content={author || "Anonymous"} />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={frontMatter.title} />
          <meta name="twitter:description" content={frontMatter.description} />
        </Head>
        <ReactMarkdown>{markdownBody}</ReactMarkdown>
      </div>
    </div>
  );
}

export default SolanaMarkdown;