export const readFile = jest.fn().mockImplementation((path, options) => {
  if (path.includes("biases_fallacies.json")) {
    return Promise.resolve(
      JSON.stringify({
        biases: [
          {
            name: "Confirmation Bias",
            description:
              "The tendency to search for, interpret, and recall information in a way that confirms one's preexisting beliefs or hypotheses.",
            examples: [
              "This proves what I've been saying all along",
              "I knew this would happen",
            ],
            patterns: [
              "proves (what|that) (I|we) (said|thought|believed)",
              "knew this would happen",
              "just as I (said|predicted|expected)",
            ],
            context_clues: ["evidence", "validates", "confirms"],
          },
        ],
        fallacies: [
          {
            name: "Ad Hominem",
            description:
              "Attacking your opponent's character or personal traits instead of engaging with their argument.",
            examples: [
              "You're too young to understand this",
              "He's biased because he works for them",
            ],
            patterns: [
              "too (young|old|ignorant|stupid) to understand",
              "(he|she|they)('s| is| are) biased",
              "what would you know about",
            ],
            context_clues: ["attack", "personal", "character"],
          },
        ],
      })
    );
  }
  return Promise.reject(new Error(`File not found: ${path}`));
});

export default {
  readFile,
};
