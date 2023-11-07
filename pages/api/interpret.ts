import axios from 'axios';
import OpenAI from 'openai';
import { kv } from "@vercel/kv";
import Error from 'next/error';

const { apiKey: etherscanApiKey } = process.env;
const { apiKey: openaiApiKey } = process.env;

// example with compiled source https://etherscan.io/address/0x2ec705d306b51e486b1bc0d6ebee708e0661add1#code

const USE_OPENAI_CACHE = true
enum Blockchain {
  Ethereum = 'Ethereum',
  Stacks = 'Stacks',
  Unknown = 'Unknown'
}

function identifyTransactionId(id: string): Blockchain {
  if (id.length === 42) { // 2 characters for '0x' + 40 characters for the address
    // example Eth contract with source
    // 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
    return Blockchain.Ethereum;
  } else if (id.includes('.')) {
    // example Stacks contract
    // SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-oracle-v2-2
    return Blockchain.Stacks;
  } else {
    return Blockchain.Unknown;
  }
}

const getStacksSource = async (res: any, contractAddress: any) => {
  const hiroUrl = `https://api.mainnet.hiro.so/extended/v1/contract/${contractAddress}`

  // Send a GET request to Etherscan API
  const response = await axios.get(hiroUrl);

  const notFound = `No valid contract found at the address '${contractAddress}'`;
  if (response.status === 200) {
    const data = response.data;
    if (data.source_code) {
      const sourceCode = data.source_code;
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
    console.log("cached code", cachedCode)
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

const extractSourceCode = (inputText: string): string => {
  // Split the input text into lines
  const lines = inputText.split('\n');

  // Initialize an empty array to store lines of source code
  const sourceCodeLines: string[] = [];

  // Iterate through the lines
  for (const line of lines) {
    // Check if the line contains the end comment
    if (line.includes("GNU GENERAL PUBLIC LICENSE")) {
      break;
    }
    sourceCodeLines.push(line);
  }

  // Combine the source code lines into a single string
  const sourceCode = sourceCodeLines.join('\n');

  return sourceCode;
};

const interpret = async (res: any, contractAddress:any, sourceCode: any) => {
  // key for fetching a cached openai interpretation
  const interpretedKey = "intrp-" + contractAddress;

  const cachedInterpretation = await kv.get(interpretedKey)

  if (cachedInterpretation && USE_OPENAI_CACHE) {
    console.log("using cached interpretation")
    return cachedInterpretation;
  } else {
    const systemPrompt = "You are a web3 developer skilled in explaining complex smart contracts in natural language";
    // Define the prompt for OpenAI
    const prompt = `Please interpret the following Solidity contract source code:\n\n${sourceCode}\n\nPlease respond in markdown format`;
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
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
      });

      // Get the interpretation
      const interpretation = response.choices[0].message.content;
      kv.set(interpretedKey, interpretation)
      return interpretation
    } catch (error: any) {
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
    res.status(200).json({ blockchain, sourceCode, interpretation });
  } catch (error: any) {
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
}

export default handler;