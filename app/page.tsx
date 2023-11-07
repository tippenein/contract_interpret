"use client"

import Head from "next/head";
import React from 'react';
import { useReducer, useState } from "react";
let ReactMarkdown: React.ComponentType<{ children: string }> | undefined;
import('react-markdown').then((module) => {
  ReactMarkdown = module.default || module;
});
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { solarizedlight } from 'react-syntax-highlighter/dist/esm/styles/prism';

import {Help} from '../components/Help';

interface ResponseData {
  sourceCode: string;
  interpretation: string;
  blockchain: string;
}
interface ErrorResponse {
  error: string;
}

const syntaxFor = (b: string) => {
  if (b === "ethereum") {
    return "javascript";
  } else if (b === "stacks") {
    return "lisp";
  } else {
    return "javascript"; // default case
  }
}


export default function Home() {
  const [copySuccess, setCopySuccess] = useState('');
  const [contractAddress, setContractAddress] = useState('');
  const [sourceCode, setSourceCode] = useState('');
  const [interpretation, setInterpretation] = useState('');
  const [blockchain, setBlockchain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('interpretation');

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess('Copied!');
      setTimeout(() => setCopySuccess(''), 2000); // Clear the message after 2 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleFormSubmit = async (e: any) => {
    e.preventDefault()

    setLoading(true);
    setError('');

    try {
      const response = await fetch("/api/interpret", {
        method: "POST",
        body: JSON.stringify({ address: contractAddress }),
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
      });
      console.log(response.status)
      if (response.ok) {
        const data = await response.json() as ResponseData;
        console.log('Data received:', data);

        setSourceCode(data.sourceCode);
        setInterpretation(data.interpretation);
        setBlockchain(data.blockchain);
      } else {
        const errorData = await response.json() as ErrorResponse;
        console.log(errorData.error)

        setError(errorData.error);
      }
    } catch (error) {
      console.log(error)
      setError('Server error');
    }

    setContractAddress('');
    setLoading(false);
  };

  return (
    <div>
      <Head>
        <title>Contract Interpreter</title>
        <meta name="description" content="Smart contract interpreter" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center flex flex-col text-lg lg:flex">
        <h1 className="font-mono mb-4">Contract Interpreter</h1>
        <form onSubmit={handleFormSubmit} className="font-mono">
          <div className="flex">
            <input
              type="text"
              placeholder="Enter contract address"
              className="flex-grow text-black px-4 py-2 h-12"
              value={contractAddress}
              onChange={(e: any) => {
                const { target } = e
                setContractAddress(target.value)
              }}
            />
            <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4"
              type="submit"
              disabled={loading}
              >
              Interpret
            </button>
          </div>
        </form>
      </div>
      {!interpretation && (<Help copySuccess={copySuccess} handleCopy={handleCopy} setCopySuccess={setCopySuccess} />)}
      <div className="flex p-24 justify-center items-center">
        <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-lg lg:flex">
          {loading && <p>Loading...</p>}
          {error && <p>{error}</p>}
          {interpretation && sourceCode && (
            <div>
              <div className="flex border-b">
                <button
                  className={`py-2 px-4 bg-slate-100  text-black ${activeTab === 'interpretation' ? 'border-b-4 border-green-500' : ''}`}
                  onClick={() => setActiveTab('interpretation')}
                >
                  Interpretation
                </button>
                <button
                  className={`py-2 px-4 bg-slate-100 text-black ${activeTab === 'sourceCode' ? 'border-b-4 border-green-500' : ''}`}
                  onClick={() => setActiveTab('sourceCode')}
                >
                  Source Code
                </button>
              </div>

              {activeTab === 'interpretation' && (
                <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-lg lg:flex">
                  {loading && <p>Loading...</p>}
                  {error && <p>{error}</p>}
                  {interpretation && (
                    <div>
                      <article className="bg-slate-100 text-black font-sans rounded p-6 prose">
                      {ReactMarkdown && <ReactMarkdown>{interpretation}</ReactMarkdown>}
                      </article>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'sourceCode' && sourceCode && (
                <div className="container flex mx-auto">
                  <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-lg lg:flex">
                  <SyntaxHighlighter language={syntaxFor(blockchain.toLowerCase())} style={solarizedlight}>
                    {sourceCode}
                  </SyntaxHighlighter>
                  </div>
                </div>
              )}
            </div>
          )}
          </div>
        </div>
      </main>
    </div>
  );
}
