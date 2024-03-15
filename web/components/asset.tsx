import React, { useState, } from 'react';
import Head from 'next/head';
import { useWallet } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';
import MarkdownProcessor from './processed-markdown';
const VerifyWizard = dynamic(() => import('./verify-wizard'), { ssr: false });
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

type SolanaMarkdownProps = {
  nft: {
    address: string;
    name: string;
    imageUri: string;
    // createdAt: Date;
    content: string;
    isVerified: boolean;
    isCompressed: boolean;
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
              <svg className="h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />  <polyline points="15 3 21 3 21 9" />  <line x1="10" y1="14" x2="21" y2="3" /></svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
)

function Asset({ nft, author }: SolanaMarkdownProps) {
  const [frontMatter, setMarkdownFrontMatter] = useState<MarkdownFrontMatter>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { publicKey } = useWallet();

  // TODO(jon): Reverse lookup the author to find their domain name and push a soft redirect

  const handleProcessed = (processedFrontMatter: MarkdownFrontMatter) => {
    setMarkdownFrontMatter(processedFrontMatter);
  };

  const title = frontMatter?.title ?? nft.name ?? "Untitled Piece";
  const description = frontMatter?.description ?? nft.content.slice(0, 140);

  const handleVerifyClick = () => {
    setIsModalOpen(true);
  };

  return (
    <>
      <Head>
        <title>{`${title} | Etched`}</title>
        <meta name="description" content={description} />
        {/* OpenGraph */}
        <meta property="og:title" content={`${title} | Etched`} />
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
          {/* Warning banner if not verified */}
          {!nft.isVerified && author === publicKey?.toString() ? (
            <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4" role="alert">
              <p className="font-bold">Information</p>
              <p>This is your creation and it is not verified yet.</p>
              <button className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" onClick={handleVerifyClick}>Verify Now</button>
            </div>
          ) : !nft.isVerified ? (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
              <p className="font-bold">Notice</p>
              <p>If you believe this content is yours, please verify it to ensure its safety.</p>
              <button onClick={handleVerifyClick} className="mt-2 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600">Verify Now</button>
            </div>
          ) : null}
          <div className='py-6'>
            <MarkdownProcessor markdown={nft.content} onProcessed={handleProcessed} />
          </div>
          <div className='py-6'>
            <Stats author={author} mint={nft.address} />
          </div>
        </div>
      </div>
      {/* DaisyUI Modal */}
      <div className={`modal ${isModalOpen ? 'modal-open' : ''}`}>
        <div className="modal-box">
          <VerifyWizard address={nft.address} isCompressed={nft.isCompressed} />
          <div className="modal-action">
            <button onClick={() => setIsModalOpen(false)} className="btn">Close</button>
          </div>
        </div>
      </div>
    </>
  );
}

export default Asset;