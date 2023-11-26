"use client"

import Head from "next/head";
import React from 'react';
import { useReducer, useState } from "react";
let ReactMarkdown: React.ComponentType<{ children: string }> | undefined;
import('react-markdown').then((module) => {
  ReactMarkdown = module.default || module;
});
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { solarizedlight } from 'react-syntax-highlighter/dist/esm/styles/prism';

import {Help} from '../components/Help';

interface ResponseData {
  sourceCode: string;
  interpretation: string;
  blockchain: string;
  requestedContractAddress: string;
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
  const [contractAddress, setContractAddress] = useState('');
  const [sourceCode, setSourceCode] = useState('');
  const [interpretation, setInterpretation] = useState('');
  const [blockchain, setBlockchain] = useState('');
  const [requestedContractAddress, setRequestedContractAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('interpretation');


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
        setRequestedContractAddress(data.requestedContractAddress);
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
      <main className="flex flex-col items-center p-24 w-full">
      <div className="w-full max-w-5xl flex flex-col items-center">
        <h1 className="font-mono font-semibold mb-6"><a href="/">Contract Interpreter</a></h1>
        <form onSubmit={handleFormSubmit} className="font-mono">
          <div className="flex justify-center">
            <input
              type="text"
              placeholder="Contract address"
              className="text-black px-4 py-2 h-12 w-full max-w-md"
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
      {!interpretation && <div className="w-full flex justify-center"><Help /></div>}
      {interpretation && (
        <h2 className="font-mono text-white font-semibold m-6">{requestedContractAddress}</h2>
      )}
      <div className="flex p-12 justify-center items-center">
        {loading && <p>Loading...</p>}
        {error && <p>{error}</p>}
        <div className="items-center justify-between font-mono text-lg lg:flex">
          {interpretation && sourceCode && (
            <div>
              <div className="flex border-b">
                <button
                  className={`py-2 px-4 bg-slate-100 border-r-2 text-black ${activeTab === 'interpretation' ? 'border-b-4 border-green-500' : ''}`}
                  onClick={() => setActiveTab('interpretation')}
                >
                  Interpretation
                </button>
                <button
                  className={`py-2 px-4 bg-slate-100 border-r-2 text-black ${activeTab === 'sourceCode' ? 'border-b-4 border-green-500' : ''}`}
                  onClick={() => setActiveTab('sourceCode')}
                >
                  Source Code
                </button>
              </div>

              {loading && <p>Loading...</p>}
              {error && <p>{error}</p>}
              {activeTab === 'interpretation' && (
                <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-lg lg:flex">
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
                  <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-lg lg:flex">
                    <SyntaxHighlighter
                      showLineNumbers={true}
                      language={syntaxFor(blockchain.toLowerCase())}
                      style={solarizedlight}
                    >
                      {sourceCode}
                    </SyntaxHighlighter>
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
