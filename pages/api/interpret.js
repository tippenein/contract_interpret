import axios from 'axios';
import openai from 'openai';

const { apiKey: etherscanApiKey } = process.env;
const { apiKey: openaiApiKey } = process.env;

const getContractSourceCode = async (contractAddress) => {
  // TODO add redis
  const cachedCode = false
  if (cachedCode) {
    return cachedCode;
  } else {
    try {
      // Define the Etherscan API endpoint for contract source code
      console.log(etherscanApiKey)
      const etherscanUrl = `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${contractAddress}&apikey=${etherscanApiKey}`;

      // Send a GET request to Etherscan API
      const response = await axios.get(etherscanUrl);

      // Check if the request was successful
      if (response.status === 200) {
        const data = response.data;
        console.log(data.status)
        if (data.status === "1" && data.result.length > 0) {
          const sourceCode = data.result[0].SourceCode;
          // db[contractAddress] = sourceCode;
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
      break;
    }
    sourceCodeLines.push(line);
  }

  // Combine the source code lines into a single string
  const sourceCode = sourceCodeLines.join('\n');

  return sourceCode;
};

async function handler(req, res) {
  const { address: contractAddress } = req.body;
  if (!contractAddress) {
    res.status(400).json({ error: 'Contract address is required' });
    return;
  }

  try {
    const rawSource = await getContractSourceCode(contractAddress);
    const sourceCode = extractSourceCode(rawSource)
    console.log(sourceCode)

    const systemPrompt = "You are a web3 developer skilled in explaining complex smart contracts in natural language";
    // Define the prompt for OpenAI
    const prompt = `Please interpret the following Solidity contract source code:\n\n${sourceCode}`;

    // Initialize the OpenAI client
    openai.apiKey = openaiApiKey;
    console.log(openaiApiKey)

    // Call the OpenAI to interpret the code
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

export default handler;
// export const config = {
//   api: {
//     bodyParser: false, // Defaults to true. Setting this to false disables body parsing and allows you to consume the request body as stream or raw-body.
//     responseLimit: false, // Determines how much data should be sent from the response body. It is automatically enabled and defaults to 4mb.
//     externalResolver: true, // Disables warnings for unresolved requests if the route is being handled by an external resolver like Express.js or Connect. Defaults to false.
//   },
// }