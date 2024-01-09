export const extractSourceCode = (inputText: string): string => {
  // Split the input text into lines
  const lines = inputText.split('\n');

  // Initialize an empty array to store lines of source code
  const sourceCodeLines: string[] = [];

  console.log(",lines")
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
