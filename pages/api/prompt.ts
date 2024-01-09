const MAX_TOKENS = 9500

export const makePrompt = (sourceCode: string): string => {
    return `Give a synopsis of the general functionality described in the following smart contract source code:\n\n${limitSourceCodeTokens(sourceCode)}\n\nPlease respond in markdown format and be concise.`;
}


export const makeSystemPrompt = () => {
    return "You are a web3 developer skilled in explaining complex smart contracts in natural language";
}

const limitSourceCodeTokens = (sourceCode: string): string => {
    const words = sourceCode.split(' ');
    let limitedSourceCode = '';
    let tokenCount = 0;

    for (let word of words) {
      const wordLength = word.length;
      if (tokenCount + wordLength <= MAX_TOKENS) {
        limitedSourceCode += `${word} `;
        tokenCount += wordLength;
      } else {
        break;
      }
    }

    return limitedSourceCode.trim();
   };