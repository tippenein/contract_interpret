import axios from 'axios';
import OpenAI from 'openai';
import { kv } from "@vercel/kv";
import Error from 'next/error';
import { extractSourceCode } from './utils';
import { makePrompt, makeSystemPrompt } from './prompt';

const { ETHERSCAN_API_KEY: etherscanApiKey } = process.env;
const { OPENAI_API_KEY: openaiApiKey } = process.env;

export const maxDuration = 60; // This function can run for a maximum of 60 seconds

// example with compiled source https://etherscan.io/address/0x2ec705d306b51e486b1bc0d6ebee708e0661add1#code

const USE_OPENAI_CACHE = false
enum Blockchain {
  Ethereum = 'ethereum',
  Stacks = 'stacks',
  Unknown = 'unknown'
}

function identifyTransactionId(id: string): Blockchain {
  if (id.length === 42) { // 2 characters for '0x' + 40 characters for the address
    return Blockchain.Ethereum;
  } else if (id.includes('.')) {
    return Blockchain.Stacks;
  } else {
    return Blockchain.Unknown;
  }
}

const getStacksSource = async (res: any, contractAddress: any) => {
  const hiroUrl = `https://api.mainnet.hiro.so/extended/v1/contract/${contractAddress}`

  // Send a GET request to Etherscan API
  console.log("before url")
  const response = await axios.get(hiroUrl);
  console.log("after url")

  const notFound = `No valid contract found at the address '${contractAddress}'`;
  if (response.status === 200) {
    const data = response.data;
    if (data.source_code) {
      const sourceCode = data.source_code;

      console.log("source")
      return sourceCode;
    } else {
      res.status(400).json({ error: notFound});
    }
  } else {
    res.status(response.status).json({ error: notFound});
  }
}

const getEthSource = async (res: any, contractAddress: any) => {
  const etherscanUrl = `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${contractAddress}&apikey=${etherscanApiKey}`;

  // Send a GET request to Etherscan API
  const response = await axios.get(etherscanUrl);

  const notFound = `No valid contract found at the address '${contractAddress}'`;
  // Check if the request was successful
  if (response.status === 200) {
    const data = response.data;
    console.log(data.status)
    if (data.status === "1" && data.result.length > 0) {
      const sourceCode = data.result[0].SourceCode;
      return sourceCode;
    } else {
      res.status(400).json({ error: notFound});
    }
  } else {
    res.status(response.status).json({ error: notFound});
  }
}

const getContractSourceCode = async (res: any, contractAddress: any) => {
  const cachedCode = await kv.get(contractAddress)
  const blockchain = identifyTransactionId(contractAddress)
  if (cachedCode) {
    return { rawSource: cachedCode, blockchain };
  } else {
    let rawSource;
    try {
      switch (blockchain) {
        case Blockchain.Ethereum:
          rawSource = await getEthSource(res, contractAddress);
          await kv.set(contractAddress, rawSource)
          break;
        case Blockchain.Stacks:
          rawSource = await getStacksSource(res, contractAddress);
          await kv.set(contractAddress, rawSource)
          break;
        default:
          res.status(400).json({ error: 'Unsupported blockchain' });
          return;
      }
      return { rawSource, blockchain }
    } catch (error: any) {
      res.status(500).json({ error: `Error: ${error.message}`});;
    }
  }
};

const interpret = async (res: any, contractAddress:any, sourceCode: any) => {
  // key for fetching a cached openai interpretation
  const interpretedKey = "intrp-" + contractAddress;

  console.log("in interpret")
  const cachedInterpretation = await kv.get(interpretedKey)

  if (cachedInterpretation && USE_OPENAI_CACHE) {
    console.log("using cached interpretation")
    return cachedInterpretation;
  } else {
    try {
      // Initialize the OpenAI client
      const openai = new OpenAI({
        apiKey: openaiApiKey
      });

      // Call the OpenAI to interpret the code
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        // stream: true,
        messages: [
          { role: "system", content: makeSystemPrompt() },
          { role: "user", content: makePrompt(sourceCode)},
        ],
      });
      console.log("response", response)
      // Get the interpretation
      const interpretation = response.choices[0].message.content;
      kv.set(interpretedKey, interpretation)
      return interpretation
    } catch (error: any) {
      console.log("error", error)
      res.status(500).json({ error: `Server error: ${error.message}` });
    }

  }
}

async function handler(req: any, res: any) {
  const { address: contractAddress } = req.body;
  if (!contractAddress) {
    res.status(400).json({ error: 'Contract address is required' });
    return;
  }

  try {
    const result = await getContractSourceCode(res, contractAddress);
    if (!result) {
      throw new global.Error('Could not get contract source code');
    }
    const {rawSource, blockchain} = result;
    const sourceCode = extractSourceCode(rawSource)
    const interpretation = await interpret(res, contractAddress, sourceCode)
    res.status(200).json({ requestedContractAddress: contractAddress, blockchain, sourceCode, interpretation });
  } catch (error: any) {
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
}

export default handler;