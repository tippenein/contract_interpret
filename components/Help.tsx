import React from 'react';
import { useState } from "react";
import {CopyIcon} from './CopyIcon';

declare global {
  interface Navigator {
    clipboard: {
      writeText(newClipText: string): Promise<void>;
      // Add any other clipboard functions you need here
    };
  }
}

export const Help = () => {
  const [copySuccess, setCopySuccess] = useState('');
  const ethExample = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
  const stacksExample = 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-oracle-v2-2'
  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess('Copied!');
      setTimeout(() => setCopySuccess(''), 2000); // Clear the message after 2 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };
  const handleButtonClick = async (text: string) => {
    await handleCopy(text);
    setCopySuccess(text);
  };
  return (
    <div style={{width: '100%', margin: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '5px'}}>
      <h2 className="mb-6">Supported blockchains include Stacks and Ethereum</h2>
      <div className="mb-2">
        <p><strong>Stacks Contract</strong></p>
        <span className="p-2 rounded bg-white text-black">{stacksExample}</span>
        <button onClick={() => handleButtonClick(stacksExample)}>
          <CopyIcon />
        </button>
        {copySuccess === stacksExample && <span>Copied!</span>}
      </div>
      <div className="mb-2">
        <p><strong>Ethereum Contract</strong></p>
        <span className="p-2 rounded bg-white text-black">{ethExample}</span>
        <button onClick={() => handleButtonClick(ethExample)}>
          <CopyIcon />
        </button>
        {copySuccess === ethExample && <span>Copied!</span>}
      </div>
    </div>
  );
};
