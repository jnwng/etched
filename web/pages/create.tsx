import React, { useState } from 'react';
import ProcessedMarkdown from '@/components/processed-markdown';
import dynamic from 'next/dynamic';
const CreateWizard = dynamic(() => import('../components/create-wizard'), {
  ssr: false,
});

const CreatePage = () => {
  const [markdown, setMarkdown] = useState('');
  const [isMinting, setIsMinting] = useState(false); // State to manage minting status
  const [processedMarkdown, setProcessedMarkdown] = useState('');

  const handleMarkdownChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setMarkdown(event.target.value);
  };

  const handleMintClick = async () => {
    console.log('Minting...');
    setIsMinting(true);
  };

  return (
    <div className="flex h-[90vh]">
      <div className="w-1/2 p-4">
        <textarea
          className="textarea textarea-bordered h-full w-full"
          placeholder="Enter Markdown..."
          value={markdown}
          onChange={handleMarkdownChange}
          disabled={isMinting} // Disable textarea when minting
        ></textarea>
      </div>
      <div className="w-1/2 p-4 flex flex-col">
        <div className="flex-grow overflow-auto">
          <ProcessedMarkdown
            markdown={markdown}
            onProcessed={(_, content) => setProcessedMarkdown(content)}
          />
        </div>

        <hr className="my-4" />

        <button
          className="btn btn-primary mt-4"
          onClick={handleMintClick}
          disabled={isMinting} // Disable button when minting
        >
          Mint
        </button>
      </div>

      {/* DaisyUI Modal */}
      <input
        type="checkbox"
        id="create-wizard-modal"
        className="modal-toggle"
        checked={isMinting}
        readOnly
      />
      <div className="modal">
        <div className="modal-box relative">
          <label
            htmlFor="create-wizard-modal"
            className="btn btn-sm btn-circle absolute right-2 top-2"
            onClick={() => setIsMinting(false)}
          >
            ×
          </label>
          <h3 className="font-bold text-lg">Minting Wizard</h3>
          <CreateWizard markdown={processedMarkdown} />
        </div>
      </div>
    </div>
  );
};

export default CreatePage;
