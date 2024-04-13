import React, { useState } from 'react';
import ProcessedMarkdown from '@/components/processed-markdown';
import dynamic from 'next/dynamic';
const CreateWizard = dynamic(() => import('../components/create-wizard'), {
  ssr: false,
});

import { parseClipboardHtml } from '@/utilities/parse-clipboard-html';

const CreatePage = () => {
  const [markdown, setMarkdown] = useState('');
  const [isMinting, setIsMinting] = useState(false); // State to manage minting status
  const [processedMarkdown, setProcessedMarkdown] = useState('');

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault(); // Prevent the default paste behavior

    // Get the text content from the clipboard
    const pastedText = e.clipboardData.getData('text/plain');
    const pastedHtml = e.clipboardData.getData('text/html');
    console.info({ pastedHtml });

    let textToInsert = pastedText;
    if (pastedHtml) {
      textToInsert = parseClipboardHtml(pastedHtml);
    }

    // Insert the processed text into the textarea
    // Assuming you want to append the text at the current cursor position
    const textarea = e.target as HTMLTextAreaElement;
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const textBefore = textarea.value.substring(0, startPos);
    const textAfter = textarea.value.substring(endPos, textarea.value.length);
    textarea.value = textBefore + textToInsert + textAfter;

    // Update the cursor position
    const newPos = startPos + textToInsert.length;
    textarea.setSelectionRange(newPos, newPos);

    // Trigger onChange manually if needed
    setMarkdown(textarea.value);
  };

  const handleMarkdownChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMarkdown(e.target.value);
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
          onPaste={handlePaste}
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
