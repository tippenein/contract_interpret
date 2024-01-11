// 10k token max, so we limit source code to 9.5k
const MAX_TOKENS = 9500

export const makePrompt = (sourceCode: string): string => {
    const limitedSourceCode = limitSourceCodeTokens(sourceCode);
    return (
       `Give a synopsis of the general functionality described in the following smart contract source code:\n\n` +
       `${limitedSourceCode}\n\n` +
       `Please respond in markdown format and be concise. Don't explain the individual error codes, constants, etc.. Explain the overall meaning and function of the contract`
    );
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