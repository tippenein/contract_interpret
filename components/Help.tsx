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
    <div className="w-full m-2 p-2 shadow-inner rounded-md text-center">
      <h2 className="mb-6">Supported blockchains currently included: Stacks and Ethereum</h2>
      <h3 className="mb-6">Examples</h3>
      <div className="mb-2">
        <p className="font-bold">Stacks Contract</p>
        <div className="flex justify-center items-center space-x-2">
          <span className="text-xs p-2 rounded bg-white text-black">{stacksExample}</span>
          <button onClick={() => handleButtonClick(stacksExample)}>
            <CopyIcon />
          </button>
          {copySuccess === stacksExample && <span className="text-sm text-green-600">Copied!</span>}
        </div>
      </div>
      <div className="mb-2">
        <p className="font-bold">Ethereum Contract</p>
        <div className="flex justify-center items-center space-x-2">
          <span className="text-xs p-2 rounded bg-white text-black">{ethExample}</span>
          <button onClick={() => handleButtonClick(ethExample)}>
            <CopyIcon />
          </button>
          {copySuccess === ethExample && <span className="text-sm text-green-600">Copied!</span>}
        </div>
      </div>
    </div>
  );
};
