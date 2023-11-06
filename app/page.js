"use client"

import Head from "next/head";
import { useReducer, useState } from "react";

export default function Home() {
  const [contractAddress, setContractAddress] = useState('');
  const [sourceCode, setSourceCode] = useState('');
  const [showSourceCode, setShowSourceCode] = useState(false);
  const [interpretation, setInterpretation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');


  const handleFormSubmit = async (e) => {
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
      if (response.ok) {
        const data = await response.json();
        console.log('Data received:', data);

        setSourceCode(data.sourceCode);
        setInterpretation(data.interpretation);
      } else {
        const errorData = await response.json();

        setError(errorData);
        console.error('API Error:', errorData);
      }
    } catch (error) {
      console.log(error)
      setError('Server error');
    }

    setLoading(false);
  };

  return (
    <div>
      <Head>
        <title>Contract interpreter</title>
        <meta name="description" content="Smart contract interpreter" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-lg lg:flex">
          <h1>Contract Interpreter</h1>
          <form onSubmit={handleFormSubmit}>
            <input
              type="text"
              placeholder="Enter contract address"
              className="text-black px-4 py-2"
              value={contractAddress}
              onChange={(e) =>
                setContractAddress(e.target.value)
              }
            />
            <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4"
              type="submit"
              disabled={loading}
              >
              Interpret
            </button>
          </form>
        </div>
        <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-lg lg:flex">
          {loading && <p>Loading...</p>}
          {error && <p>Error</p>}
          {interpretation && (
            <div>
              <h2>Interpretation:</h2>
              <p className="bg-slate-100 text-black font-sans rounded p-6 whitespace-pre-wrap">{interpretation}</p>
            </div>
          )}
        </div>
        {sourceCode && (
          <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-lg lg:flex">
            <button onClick={() => setShowSourceCode(!showSourceCode)}>Toggle source code</button>
            {showSourceCode && (
              <div>
                <h2>Contract Source Code:</h2>
                <pre>{sourceCode}</pre>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
