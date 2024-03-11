import React, { useEffect, useState } from 'react';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import remarkFrontmatter from 'remark-frontmatter';
import yaml from 'yaml'
import type { Literal, Parent, } from 'unist';
import { DEVNET_HELIUS_ENDPOINT } from '../env'

type StepOneProps = {
  title: string;
  setTitle: React.Dispatch<React.SetStateAction<string>>;
  summary: string;
  setSummary: React.Dispatch<React.SetStateAction<string>>;
};

const StepOne: React.FC<StepOneProps> = ({ title, setTitle, summary, setSummary }) => {
  return (
    <>
      <label className="flex form-control w-full">
        <div className="label">
          <span className="label-text">Title</span>
          <span className="label-text-alt">Max 32 characters</span>
        </div>
        <input
          type="text"
          className="input input-bordered w-full"
          maxLength={32}
          value={title}
          onChange={(e) => setTitle(e.target.value)} // Update title state on change
        />
      </label>

      <label className="flex form-control w-full">
        <div className="label">
          <span className="label-text">Summary</span>
          <span className="label-text-alt">Max 140 characters</span>
        </div>
        <textarea
          className="textarea textarea-bordered mt-1"
          placeholder="Summary"
          maxLength={140}
          value={summary}
          onChange={(e) => setSummary(e.target.value)} // Update summary state on change
        ></textarea>
        <div className="label">
          <span className="label-text-alt">Used for social media embeds</span>
        </div>
      </label>
    </>)
}

type StepTwoProps = {
  title: string;
  summary: string;
  markdown: string;
};

const StepTwo: React.FC<StepTwoProps> = ({ title, summary, markdown }) => {
  const [processedMarkdown, setProcessedMarkdown] = useState('');
  const [mergedFrontMatter, setMergedFrontMatter] = useState<{
    summary?: string;
    image?: string;
    // tags?: string[];
  }>({});

  useEffect(() => {
    async function processMarkdownWithFrontmatter(markdown: string, summary: string) {
      const processor = unified()
        .use(remarkParse)
        .use(remarkFrontmatter, ['yaml'])
        .use(() => (tree: Parent) => {
          tree.children.forEach(child => {
            if (child.type === "yaml") {
              const literalChild = child as Literal;
              const existingFrontmatter = yaml.parse(literalChild.value as string);
              const mergedFrontmatter = { ...existingFrontmatter, summary };
              literalChild.value = yaml.stringify(mergedFrontmatter);
              setMergedFrontMatter(mergedFrontmatter); // Set merged frontMatter state
              console.info({ mergedFrontmatter })
            }
          });
        })
        .use(remarkStringify);

      const processedMarkdown = await processor.process(markdown);
      setProcessedMarkdown(String(processedMarkdown));
    }

    processMarkdownWithFrontmatter(markdown, summary);
  }, [markdown, summary]); // Dependencies

  // Use `processedMarkdown` in your component as needed
  console.info({ processedMarkdown });

  const mintNFT = async (owner: string) => {
    try {
      const response = await fetch(DEVNET_HELIUS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'etched',
          method: 'mintCompressedNft',
          params: {
            name: title,
            symbol: 'ETCHED',
            owner,
            description: processedMarkdown,
            // TODO(jon): Add some attributes, like tags from the frontmatter
            attributes: [],
            imageUrl: mergedFrontMatter.image ??
              'https://nftstorage.link/ipfs/bafybeigbhoe7436f2ieudxxw6a6ktg37xcrgf4b7iqol4uefnkaa42pdem',
            externalUrl: `https://www.etched.id/${owner}`,
            sellerFeeBasisPoints: 0,
            creators: [{
              address: owner,
              share: 0,
              verified: true
            }]
          },
        }),
      });
      const { result } = await response.json();
      console.log('Minted asset: ', result.assetId);
      // Handle success (e.g., update state or show a message)
    } catch (error) {
      console.error('Error:', error);
      // Handle error
    }
  };


  return (
    <div>
      <div className="p-4">
        <h2>Preparing NFT</h2>
        <ul>
          <li>1. Offchain JSON being uploaded to Arweave</li>
          <li>2. NFT being minted</li>
        </ul>
        <button
          className="btn btn-primary mt-4"
          onClick={mintNFT}
        >
          Mint NFT
        </button>
      </div>
    </div>
  );
};

const WizardPage = ({ markdown }: { markdown: string }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [title, setTitle] = useState<string>("");
  const [summary, setSummary] = useState<string>("");

  const nextStep = () => {
    setCurrentStep((prevStep) => (prevStep < 3 ? prevStep + 1 : prevStep));
  };

  const prevStep = () => {
    setCurrentStep((prevStep) => (prevStep > 1 ? prevStep - 1 : prevStep));
  };

  return (
    <div className="p-4">
      {/* Step indicators */}
      <div className="steps w-full">
        <div className={`step ${currentStep >= 1 ? 'step-primary' : ''}`}>Edit Metadata</div>
        <div className={`step ${currentStep >= 2 ? 'step-primary' : ''}`}>Mint NFT</div>
        <div className={`step ${currentStep >= 3 ? 'step-primary' : ''}`}>Verify NFT</div>
      </div>

      {/* Step content */}
      <div className="p-4">
        {currentStep === 1 && <StepOne title={title} setTitle={setTitle} summary={summary} setSummary={setSummary} />}
        {currentStep === 2 && <StepTwo title={title} summary={summary} markdown={markdown} />}
        {currentStep === 3 && <div>Content for Step 3</div>}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <button className="btn" onClick={prevStep} disabled={currentStep === 1}>
          Previous
        </button>
        <button className="btn btn-primary" onClick={nextStep} disabled={currentStep === 3}>
          {currentStep === 3 ? 'Finish' : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default WizardPage;