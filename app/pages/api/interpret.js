import axios from 'axios';
import openai from 'openai';

const { apiKey: etherscanApiKey } = process.env;
const { apiKey: openaiApiKey } = process.env;

const getContractSourceCode = async (contractAddress) => {
  // TODO You can add a caching mechanism here if needed
  const cachedCode = false
  if (cachedCode) {
    return cachedCode;
  } else {
    try {
      // Define the Etherscan API endpoint for contract source code
      const etherscanUrl = `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${contractAddress}&apikey=${etherscanApiKey}`;

      // Send a GET request to Etherscan API
      const response = await axios.get(etherscanUrl);

      // Check if the request was successful
      if (response.status === 200) {
        const data = response.data;
        if (data.status === "1" && data.result.length > 0) {
          const sourceCode = data.result[0].SourceCode;
          db[contractAddress] = sourceCode;
          return sourceCode;
        } else {
          return "Contract source code not found on Etherscan.";
        }
      } else {
        return "Failed to fetch contract source code from Etherscan.";
      }
    } catch (error) {
      return `Error: ${error.message}`;
    }
  }
};

const extractSourceCode = (inputText) => {
  // Split the input text into lines
  const lines = inputText.split('\n');

  // Initialize an empty array to store lines of source code
  const sourceCodeLines = [];

  // Iterate through the lines
  for (const line of lines) {
    // Check if the line contains the end comment
    if (line.includes("GNU GENERAL PUBLIC LICENSE")) {
      break; // Stop when the end comment is found
    }
    sourceCodeLines.push(line); // Add the line to the source code
  }

  // Combine the source code lines into a single string
  const sourceCode = sourceCodeLines.join('\n');

  return sourceCode;
};

export default async function handler(req, res) {
  const { contractAddress } = req.query;

  if (!contractAddress) {
    res.status(400).json({ error: 'Contract address is required' });
    return;
  }

  try {
    const rawSource = await getContractSourceCode(contractAddress);
    const sourceCode = extractSourceCode(rawSource)

    const systemPrompt = "You are a web3 developer skilled in explaining complex smart contracts in natural language";
    // Define the prompt for OpenAI
    const prompt = `Please interpret the following Solidity contract source code:\n\n${sourceCode}`;

    // Initialize the OpenAI client
    openai.apiKey = openaiApiKey;

    // Call the OpenAI GPT-3.5 model to interpret the code
    const response = await openai.ChatCompletion.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
    });

    // Get the interpretation
    const interpretation = response.choices[0].message.content;

    res.status(200).json({ sourceCode, interpretation });
  } catch (error) {
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
}