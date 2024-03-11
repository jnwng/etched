import React, { useState } from 'react';
import CreateWizard from '../components/create-wizard'; // Assuming the path to your component
import ProcessedMarkdown from '@/components/processed-markdown';

const CreatePage = () => {
  const [markdown, setMarkdown] = useState('');
  const [isMinting, setIsMinting] = useState(false); // State to manage minting status

  const handleMarkdownChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMarkdown(event.target.value);
  };

  const handleMintClick = () => {
    console.log('Minting...');
    setIsMinting(true); // Open the modal to show the CreateWizard component
    // Implement your minting logic here
  };

  return (
    <div className="flex h-screen">
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
        <div className="flex-grow overflow-auto prose lg:prose-xl">
          <ProcessedMarkdown markdown={markdown} />
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
      <input type="checkbox" id="create-wizard-modal" className="modal-toggle" checked={isMinting} readOnly />
      <div className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Minting Wizard</h3>
          <CreateWizard markdown={markdown} />
          <div className="modal-action">
            <label htmlFor="create-wizard-modal" className="btn" onClick={() => setIsMinting(false)}>Close</label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePage;
