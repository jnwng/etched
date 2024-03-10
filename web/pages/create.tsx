import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

const CreatePage = () => {
  const [markdown, setMarkdown] = useState('');

  // Function to handle Markdown text change
  const handleMarkdownChange = (event) => {
    setMarkdown(event.target.value);
  };

  // Function to handle "Mint" button click
  const handleMintClick = () => {
    console.log('Minting...');
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
        ></textarea>
      </div>
      <div className="w-1/2 p-4 flex flex-col">
        <div className="flex-grow overflow-auto prose lg:prose-xl">
          <ReactMarkdown>{markdown}</ReactMarkdown>
        </div>
        <button
          className="btn btn-primary mt-4"
          onClick={handleMintClick}
        >
          Mint
        </button>
      </div>
    </div>
  );
};

export default CreatePage;
