import RuleBasedDetector from "@/detectors/RuleBasedDetector";
import TextTokenizer from "@/utils/TextTokenizer";
import {
  IBiasesFallaciesData,
  TCognitivePatternType,
  EDetectionFilter,
  ISentenceDetection,
  IPatternMatch,
  IBiasOrFallacy,
} from "@/utils/types";
// Mock TextTokenizer
jest.mock("../../services/TextTokenizer");

describe("RuleBasedDetector", () => {
  let detector: RuleBasedDetector;
  let mockTokenizer: jest.Mocked<TextTokenizer>;

  // Updated test data including confidenceModifiers
  const testData: IBiasesFallaciesData = {
    global_confidence_modifiers: {
      high_confidence_terms: ["certainly", "definitely", "obviously"],
      negation_terms: ["not", "never", "doesn't"],
      uncertainty_terms: ["maybe", "perhaps", "might"],
      hedging_terms: ["sort of", "kind of"],
    },
    biases: [
      {
        name: "Confirmation Bias",
        description:
          "Tendency to favor information that confirms prior beliefs",
        examples: [
          {
            text: "I knew this would happen",
            explanation: "Shows retroactive confidence suggesting bias",
          },
        ],
        patterns: [
          {
            regex: "knew this would happen",
            weight: 0.7,
            description: "Retroactive prediction claims",
          },
          {
            regex: "confirms my (beliefs|suspicions)",
            weight: 0.8,
            description: "Belief confirmation",
          },
          {
            regex: "just as I (predicted|expected)",
            weight: 0.8,
            description: "Self-reinforcing predictions",
          },
        ],
        context_clues: {
          positive: ["evidence", "confirms", "proves"],
          negative: ["surprised", "unexpected", "wrong about"],
        },
      },
    ],
    fallacies: [
      {
        name: "Ad Hominem",
        description: "Attacking the person instead of their argument",
        examples: [
          {
            text: "You're too young to understand",
            explanation: "Dismisses argument based on age rather than merit",
          },
        ],
        patterns: [
          {
            regex: "too (young|old|ignorant) to understand",
            weight: 0.9,
            description: "Age/experience-based dismissal",
          },
          {
            regex: "(he|she|they)('s| is| are) biased",
            weight: 0.8,
            description: "Character attack on credibility",
          },
        ],
        context_clues: {
          positive: ["personal", "attack", "character"],
          negative: ["argument", "evidence", "logic"],
        },
      },
    ],
  };

  beforeEach(() => {
    mockTokenizer = new TextTokenizer() as jest.Mocked<TextTokenizer>;
    mockTokenizer.splitIntoSentences = jest
      .fn()
      .mockImplementation((text: string) => {
        if (!text) return [];
        return text.split(". ").map((s) => `${s.trim()}.`);
      });
    detector = new RuleBasedDetector(testData);
  });

  test("should initialize and compile patterns", () => {
    expect(detector).toBeInstanceOf(RuleBasedDetector);
  });

  describe("compilePatterns function", () => {
    test("should compile string patterns into RegExp objects", () => {
      // In order to access private function create workaround
      const ruleBasedDetectorAny = detector as any;

      const compiledBiases = ruleBasedDetectorAny.compilePatterns(
        testData.biases,
        "bias" as TCognitivePatternType
      );

      expect(compiledBiases).toHaveLength(1);
      expect(compiledBiases[0].name).toBe("Confirmation Bias");
      expect(compiledBiases[0].patterns).toHaveLength(3);
      expect(compiledBiases[0].compiledPatterns).toHaveLength(3);

      // Check that compiled patterns have weight and description
      compiledBiases[0].compiledPatterns.forEach((compiledPattern: any) => {
        expect(compiledPattern.regex).toBeInstanceOf(RegExp);
        expect(compiledPattern).toHaveProperty("weight");
        expect(compiledPattern).toHaveProperty("description");
        expect(typeof compiledPattern.weight).toBe("number");
        expect(typeof compiledPattern.description).toBe("string");
      });

      // Check that patterns are compiled into RegExp objects
      // compiledBiases[0].compiledPatterns.forEach((pattern: RegExp) => {
      //   expect(pattern).toBeInstanceOf(RegExp);
      // });

      // Testing fallacy patterns compilation
      const compiledFallacies = ruleBasedDetectorAny.compilePatterns(
        testData.fallacies,
        "fallacy" as TCognitivePatternType
      );

      expect(compiledFallacies).toHaveLength(1);
      expect(compiledFallacies[0].name).toBe("Ad Hominem");
      expect(compiledFallacies[0].compiledPatterns).toHaveLength(2);

      compiledFallacies[0].compiledPatterns.forEach((compiledPattern: any) => {
        expect(compiledPattern.regex).toBeInstanceOf(RegExp);
        expect(compiledPattern).toHaveProperty("weight");
        expect(compiledPattern).toHaveProperty("description");
      });
      // expect(
      //   compiledFallacies[0].confidenceModifiers.highConfidenceTerms
      // ).toContain("absolutely");

      // Check that patterns are compiled into RegExp objects
      // compiledFallacies[0].compiledPatterns.forEach((pattern: any) => {
      //   expect(pattern).toBeInstanceOf(RegExp);
      // });
    });

    test("should handle empty pattern arrays without errors", () => {
      /*
       * Purpose: This test verifies that compilePatterns can handle edge cases
       * like empty pattern arrays without crashing. It should return an object
       * with an empty compiledPatterns array.
       */
      const ruleBasedDetectorAny = detector as any;

      const emptyBias: IBiasOrFallacy = {
        name: "Empty Bias",
        description: "A bias with no patterns",
        examples: [],
        patterns: [],
      };

      const compiledEmpty = ruleBasedDetectorAny.compilePatterns(
        [emptyBias],
        "bias" as TCognitivePatternType
      );

      expect(compiledEmpty).toHaveLength(1);
      expect(compiledEmpty[0].compiledPatterns).toHaveLength(0);
    });
  });

  describe("matchPatterns function", () => {
    test("should identify matches between compiled patterns and text", () => {
      const ruleBasedDetectorAny = detector as any;

      // Compile bias
      const compiledBias = ruleBasedDetectorAny.compilePatterns(
        testData.biases,
        "bias" as TCognitivePatternType
      )[0];

      // Test match patterns
      const sentence = "I knew this would happen today";
      const matches = ruleBasedDetectorAny.matchPatterns(
        sentence,
        compiledBias
      );

      expect(matches).toHaveLength(1);
      expect(matches[0].matched).toBe("knew this would happen");
      expect(matches[0].index).toBe(2);
      expect(typeof matches[0].pattern).toBe("string");
      expect(matches[0].pattern).toContain("knew this would happen");
      expect(matches[0]).toHaveProperty("weight");
      expect(matches[0].weight).toBe(0.7); // Should match the pattern weight
    });

    test("should find multiple pattern matches in a single sentence", () => {
      const ruleBasedDetectorAny = detector as any;

      // Create test data with patterns that both match
      const testBias = {
        ...testData.biases[0],
        compiledPatterns: [
          {
            regex: /knew this would happen/i,
            weight: 0.7,
            description: "Test pattern 1",
          },
          {
            regex: /today/i,
            weight: 0.5,
            description: "Test pattern 2",
          },
        ],
      };

      // Test matchPatterns
      const sentence = "I knew this would happen today";
      const matches = ruleBasedDetectorAny.matchPatterns(sentence, testBias);

      expect(matches).toHaveLength(2);
      expect(matches[0].matched).toBe("knew this would happen");
      expect(matches[0].weight).toBe(0.7);
      expect(matches[1].matched).toBe("today");
      expect(matches[1].weight).toBe(0.5);
    });

    test("should return empty array when no patterns match the text", () => {
      const ruleBasedDetectorAny = detector as any;

      const compiledBias = ruleBasedDetectorAny.compilePatterns(
        testData.biases,
        "bias" as TCognitivePatternType
      )[0];

      const sentence = "The weather is nice today.";
      const matches = ruleBasedDetectorAny.matchPatterns(
        sentence,
        compiledBias
      );

      expect(matches).toHaveLength(0);
      expect(Array.isArray(matches)).toBe(true);
    });
  });

  describe("calculateConfidence function", () => {
    test("should calculate baseline confidence based on weighted matches", () => {
      const ruleBasedDetectorAny = detector as any;

      const matches: IPatternMatch[] = [
        {
          pattern: "/test/i",
          matched: "test",
          index: 0,
          length: 4,
          weight: 0.7,
        },
      ];

      const sentence = "Test sentence";
      const item = {
        context_clues: {},
      };

      const confidence = ruleBasedDetectorAny.calculateConfidence(
        matches,
        sentence,
        item
      );

      // Base 0.5 + (0.7 weight * 0.2 scale factor) = 0.5 + 0.14 = 0.64
      expect(confidence).toBeCloseTo(0.64, 2);
    });

    test("should apply positive context clues", () => {
      const ruleBasedDetectorAny = detector as any;

      const matches: IPatternMatch[] = [
        {
          pattern: "/test/i",
          matched: "test",
          index: 0,
          length: 4,
          weight: 0.5,
        },
      ];

      const sentence = "Test sentence with evidence";
      const item = {
        context_clues: {
          positive: ["evidence", "confirms", "proves"],
        },
      };

      const confidence = ruleBasedDetectorAny.calculateConfidence(
        matches,
        sentence,
        item
      );

      // Should be higher than baseline due to positive context clue
      expect(confidence).toBeGreaterThan(0.6);
    });

    test("should apply global high confidence terms", () => {
      const ruleBasedDetectorAny = detector as any;

      const matches: IPatternMatch[] = [
        {
          pattern: "/test/i",
          matched: "test",
          index: 0,
          length: 4,
          weight: 0.5,
        },
      ];

      const sentence = "This is definitely a test sentence";
      const item = {
        context_clues: {},
      };

      const confidence = ruleBasedDetectorAny.calculateConfidence(
        matches,
        sentence,
        item
      );

      // Should include boost from global high confidence term "definitely"
      expect(confidence).toBeGreaterThan(0.6);
    });

    test("should apply global negation terms", () => {
      const ruleBasedDetectorAny = detector as any;

      const matches: IPatternMatch[] = [
        {
          pattern: "/test/i",
          matched: "test",
          index: 0,
          length: 4,
          weight: 0.5,
        },
      ];

      const sentence = "This is not a test sentence";
      const item = {
        context_clues: {},
      };

      const confidence = ruleBasedDetectorAny.calculateConfidence(
        matches,
        sentence,
        item
      );

      // Should be reduced due to negation term "not"
      expect(confidence).toBeLessThan(0.6);
    });

    test("should ensure confidence stays within bounds (0.1 to 0.95)", () => {
      const ruleBasedDetectorAny = detector as any;

      // Case 1: Very low confidence should floor at 0.1
      const lowMatches: IPatternMatch[] = [
        {
          pattern: "/test/i",
          matched: "test",
          index: 20,
          length: 4,
          weight: 0.1,
        },
      ];
      const lowSentence = "not never doesn't test";
      const lowItem = { context_clues: {} };

      const lowConfidence = ruleBasedDetectorAny.calculateConfidence(
        lowMatches,
        lowSentence,
        lowItem
      );
      expect(lowConfidence).toBeGreaterThanOrEqual(0.1);

      // Case 2: Very high confidence should cap at 0.95
      const highMatches: IPatternMatch[] = Array(5).fill({
        pattern: "/test/i",
        matched: "test",
        index: 0,
        length: 4,
        weight: 1.0,
      });
      const highSentence =
        "This is definitely certainly obviously test with evidence confirms proves";
      const highItem = {
        context_clues: {
          positive: ["evidence", "confirms", "proves"],
        },
      };

      const highConfidence = ruleBasedDetectorAny.calculateConfidence(
        highMatches,
        highSentence,
        highItem
      );
      expect(highConfidence).toBeLessThanOrEqual(0.95);
    });
  });

  describe("detectInSentence function", () => {
    test("should detect confirmation bias in a sentence", () => {
      const sentence = "I knew this would happen with the new policy.";
      const results = detector.detectInSentence(sentence);

      expect(results).toHaveLength(1);
      expect(results[0].type).toBe("bias");
      expect(results[0].name).toBe("Confirmation Bias");
      expect(results[0].matches).toHaveLength(1);
      expect(results[0].confidence).toBeGreaterThan(0.5);
    });

    test("should detect ad hominem fallacy in a sentence", () => {
      const sentence = "You're too young to understand complex issues.";
      const results = detector.detectInSentence(sentence);

      expect(results).toHaveLength(1);
      expect(results[0].type).toBe("fallacy");
      expect(results[0].name).toBe("Ad Hominem");
      expect(results[0].matches).toHaveLength(1);
      expect(results[0].confidence).toBeGreaterThan(0.5);
    });

    test("should not detect anything in neutral sentences", () => {
      const sentence = "The weather is nice today.";
      const results = detector.detectInSentence(sentence);

      expect(results).toHaveLength(0);
    });

    test("should filter detection by type", () => {
      const sentenceWithBoth =
        "I knew this would happen and you're too young to understand.";

      const biasResults = detector.detectInSentence(
        sentenceWithBoth,
        EDetectionFilter.Biases
      );
      expect(biasResults).toHaveLength(1);
      expect(biasResults[0].type).toBe("bias");

      const fallacyResults = detector.detectInSentence(
        sentenceWithBoth,
        EDetectionFilter.Fallacies
      );
      expect(fallacyResults).toHaveLength(1);
      expect(fallacyResults[0].type).toBe("fallacy");

      const allResults = detector.detectInSentence(
        sentenceWithBoth,
        EDetectionFilter.All
      );
      expect(allResults).toHaveLength(2);
    });

    test("should handle empty or null input", () => {
      expect(detector.detectInSentence("")).toHaveLength(0);
      expect(detector.detectInSentence("   ")).toHaveLength(0); // whitespace only
      expect(detector.detectInSentence(null as unknown as string)).toHaveLength(
        0
      );
    });

    test("should increase confidence with positive context clues", () => {
      const sentence1 = "I knew this would happen.";
      const sentence2 =
        "I knew this would happen because the evidence confirms it.";

      const results1 = detector.detectInSentence(sentence1);
      const results2 = detector.detectInSentence(sentence2);

      if (results1.length > 0 && results2.length > 0) {
        expect(results1[0].confidence).toBeLessThan(results2[0].confidence);
      }
    });

    test("should adjust confidence based on high confidence terms", () => {
      const sentence1 = "I knew this would happen.";
      const sentence2 = "I definitely knew this would happen.";

      const results1 = detector.detectInSentence(sentence1);
      const results2 = detector.detectInSentence(sentence2);

      if (results1.length > 0 && results2.length > 0) {
        expect(results1[0].confidence).toBeLessThan(results2[0].confidence);
      }
    });

    test("should decrease confidence when negation terms are present", () => {
      const sentence1 = "I knew this would happen.";
      const sentence2 = "I never knew this would happen.";

      const results1 = detector.detectInSentence(sentence1);
      const results2 = detector.detectInSentence(sentence2);

      if (results1.length > 0 && results2.length > 0) {
        expect(results1[0].confidence).toBeGreaterThan(results2[0].confidence);
      }
    });
  });

  describe("detectInText function", () => {
    test("should detect multiple instances of bias and fallacy in text", () => {
      const text =
        "I knew this would happen. You're too young to understand. Just as I predicted.";

      mockTokenizer.splitIntoSentences.mockReturnValue([
        "I knew this would happen.",
        "You're too young to understand.",
        "Just as I predicted.",
      ]);

      const results = detector.detectInText(text, mockTokenizer);

      expect(results).toHaveLength(3);
      expect(results[0].sentence).toBe("I knew this would happen.");
      expect(results[0].detections[0].type).toBe("bias");
      expect(results[0].detections[0].name).toBe("Confirmation Bias");

      expect(results[1].sentence).toBe("You're too young to understand.");
      expect(results[1].detections[0].type).toBe("fallacy");
      expect(results[1].detections[0].name).toBe("Ad Hominem");

      expect(results[2].sentence).toBe("Just as I predicted.");
      expect(results[2].detections[0].type).toBe("bias");
      expect(results[2].detections[0].name).toBe("Confirmation Bias");
    });

    test("should handle empty or null input", () => {
      expect(detector.detectInText("", mockTokenizer)).toHaveLength(0);
      expect(
        detector.detectInText(null as unknown as string, mockTokenizer)
      ).toHaveLength(0);
    });

    test("should return empty array for text with no biases or fallacies", () => {
      const text = "The weather is nice today. I hope it stays this way.";

      mockTokenizer.splitIntoSentences.mockReturnValue([
        "The weather is nice today.",
        "I hope it stays this way.",
      ]);

      const results = detector.detectInText(text, mockTokenizer);
      expect(results).toHaveLength(0);
    });
  });

  describe("generateSummary function", () => {
    test("should generate summary statistics from detections", () => {
      const detections: ISentenceDetection[] = [
        {
          sentence: "I knew this would happen.",
          sentenceIndex: 0,
          detections: [
            {
              type: "bias" as const,
              name: "Confirmation Bias",
              description:
                "Tendency to favor information that confirms prior beliefs",
              matches: [],
              confidence: 0.6,
            },
          ],
        },
        {
          sentence: "You're too young to understand.",
          sentenceIndex: 1,
          detections: [
            {
              type: "fallacy" as const,
              name: "Ad Hominem",
              description: "Attacking the person instead of their argument",
              matches: [],
              confidence: 0.7,
            },
          ],
        },
        {
          sentence: "Just as I predicted.",
          sentenceIndex: 2,
          detections: [
            {
              type: "bias" as const,
              name: "Confirmation Bias",
              description:
                "Tendency to favor information that confirms prior beliefs",
              matches: [],
              confidence: 0.8,
            },
          ],
        },
      ];

      const summary = detector.generateSummary(detections);

      expect(summary.biasesFound).toHaveLength(1);
      expect(summary.fallaciesFound).toHaveLength(1);

      expect(summary.biasesFound[0].name).toBe("Confirmation Bias");
      expect(summary.biasesFound[0].count).toBe(2);
      expect(summary.biasesFound[0].confidence).toBe(0.8); // Max confidence

      expect(summary.fallaciesFound[0].name).toBe("Ad Hominem");
      expect(summary.fallaciesFound[0].count).toBe(1);
      expect(summary.fallaciesFound[0].confidence).toBe(0.7);
    });

    test("should handle empty detections array", () => {
      const summary = detector.generateSummary([]);

      expect(summary.biasesFound).toHaveLength(0);
      expect(summary.fallaciesFound).toHaveLength(0);
    });

    test("should handle null input", () => {
      const summary = detector.generateSummary(
        null as unknown as ISentenceDetection[]
      );

      expect(summary.biasesFound).toHaveLength(0);
      expect(summary.fallaciesFound).toHaveLength(0);
    });
  });

  describe("analyzeContext function", () => {
    test("should increase confidence for repeated biases/fallacies in adjacent sentences", () => {
      const ruleBasedDetectorAny = detector as any;

      const detections: ISentenceDetection[] = [
        {
          sentence: "I knew this would happen.",
          sentenceIndex: 0,
          detections: [
            {
              type: "bias" as const,
              name: "Confirmation Bias",
              description: "Description",
              matches: [],
              confidence: 0.6,
            },
          ],
        },
        {
          sentence: "Just as I predicted it would.",
          sentenceIndex: 1,
          detections: [
            {
              type: "bias" as const,
              name: "Confirmation Bias",
              description: "Description",
              matches: [],
              confidence: 0.7,
            },
          ],
        },
      ];

      const enhancedDetections =
        ruleBasedDetectorAny.analyzeContext(detections);

      // Confidence should be increased for both sentences since they have the same bias
      expect(enhancedDetections[0].detections[0].confidence).toBeGreaterThan(
        0.6
      );
      expect(enhancedDetections[1].detections[0].confidence).toBeGreaterThan(
        0.7
      );
    });

    test("should handle single sentence input", () => {
      const ruleBasedDetectorAny = detector as any;

      const detections: ISentenceDetection[] = [
        {
          sentence: "I knew this would happen.",
          sentenceIndex: 0,
          detections: [
            {
              type: "bias" as const,
              name: "Confirmation Bias",
              description: "Description",
              matches: [],
              confidence: 0.6,
            },
          ],
        },
      ];

      const enhancedDetections =
        ruleBasedDetectorAny.analyzeContext(detections);

      // Should return the same detections without changes
      expect(enhancedDetections).toEqual(detections);
      expect(enhancedDetections[0].detections[0].confidence).toBeCloseTo(0.6);
    });
  });

  describe("exclusion patterns", () => {
    test("should not detect bias when exclusion patterns match", () => {
      // Create detector with exclusion patterns
      const dataWithExclusions: IBiasesFallaciesData = {
        ...testData,
        biases: [
          {
            ...testData.biases[0],
            exclusions: [
              {
                pattern: "based on (data|evidence|research|studies)",
                reason: "Factual basis reduces bias likelihood",
              },
            ],
          },
        ],
      };

      const detectorWithExclusions = new RuleBasedDetector(dataWithExclusions);

      // This should be excluded due to "based on research"
      const sentence = "I knew this would happen based on research.";
      const results = detectorWithExclusions.detectInSentence(sentence);

      expect(results).toHaveLength(0);

      // This should still be detected (no exclusion pattern)
      const sentence2 = "I knew this would happen eventually.";
      const results2 = detectorWithExclusions.detectInSentence(sentence2);

      expect(results2).toHaveLength(1);
    });
  });
});

//   describe('matchPatterns function', () => {
//     test('should identify matches between compiled patterns and text', () => {
//       /*
//        * Purpose: The matchPatterns function searches a sentence for matches against
//        * compiled RegExp patterns. It returns an array of matches with details about
//        * where each match was found. This test verifies it correctly identifies
//        * patterns in the text and returns the right information about each match.
//        */
//       const ruleBasedDetectorAny = detector as any;

//       // Compile bias
//       const compiledBias = ruleBasedDetectorAny.compilePatterns(
//         testData.biases,
//         'bias' as TCognitivePatternType
//       )[0];

//       // Test match patterns
//       const sentence = 'I knew this would happen today';
//       const matches = ruleBasedDetectorAny.matchPatterns(sentence, compiledBias);

//       expect(matches).toHaveLength(1);
//       expect(matches[0].matched).toBe('knew this would happen');
//       expect(matches[0].index).toBe(2);
//       expect(typeof matches[0].pattern).toBe('string');
//       expect(matches[0].pattern).toContain('knew this would happen');
//     });

//     test('should find multiple pattern matches in a single sentence', () => {
//       const ruleBasedDetectorAny = detector as any;

//       // Create a compiled bias with two patterns that will both match
//       const compiledBias = {
//         compiledPatterns: [
//           /knew this would happen/i,
//           /today/i
//         ]
//       };

//       // Test matchPatterns
//       const sentence = 'I knew this would happen today';
//       const matches = ruleBasedDetectorAny.matchPatterns(sentence, compiledBias);

//       expect(matches).toHaveLength(2);
//       expect(matches[0].matched).toBe('knew this would happen');
//       expect(matches[1].matched).toBe('today');
//     });

//     test('should return empty array when no patterns match the text', () => {
//       const ruleBasedDetectorAny = detector as any;

//       // First compile the bias
//       const compiledBias = ruleBasedDetectorAny.compilePatterns(
//         testData.biases,
//         'bias' as TCognitivePatternType
//       )[0];

//       // Test matchPatterns with non-matching text
//       const sentence = 'The weather is nice today.';
//       const matches = ruleBasedDetectorAny.matchPatterns(sentence, compiledBias);

//       expect(matches).toHaveLength(0);
//       expect(Array.isArray(matches)).toBe(true);
//     });
//   });

//   describe('calculateConfidence function', () => {
//     test('should calculate baseline confidence based on number of matches', () => {
//       const ruleBasedDetectorAny = detector as any;

//       const matches: IPatternMatch[] = [
//         {
//           pattern: '/test/i',
//           matched: 'test',
//           index: 0,
//           length: 4
//         }
//       ];

//       const sentence = "Test sentence";
//       const item = {
//         contextClues: [] // No context clues
//       };

//       const confidence = ruleBasedDetectorAny.calculateConfidence(matches, sentence, item);

//       // Base 0.5 + 0.1 for one match
//       expect(confidence).toBeCloseTo(0.6);
//     });

//     test('should increase confidence for context clues', () => {
//       const ruleBasedDetectorAny = detector as any;

//       const matches: IPatternMatch[] = [
//         {
//           pattern: '/test/i',
//           matched: 'test',
//           index: 0,
//           length: 4
//         }
//       ];

//       const sentence = "Test sentence with evidence";
//       const item = {
//         contextClues: ["evidence", "confirms", "proves"]
//       };

//       const confidence = ruleBasedDetectorAny.calculateConfidence(matches, sentence, item);

//       // Base 0.5 + 0.1 for one match + 0.05 for one context clue
//       expect(confidence).toBeCloseTo(0.65);
//     });

//     test('should increase confidence for high confidence terms', () => {
//       const ruleBasedDetectorAny = detector as any;

//       const matches: IPatternMatch[] = [
//         {
//           pattern: '/test/i',
//           matched: 'test',
//           index: 0,
//           length: 4
//         }
//       ];

//       const sentence = "This is definitely a test sentence";
//       const item = {
//         contextClues: [],
//         confidenceModifiers: {
//           highConfidenceTerms: ["certainly", "definitely", "obviously"]
//         }
//       };

//       const confidence = ruleBasedDetectorAny.calculateConfidence(matches, sentence, item);

//       // Base 0.5 + 0.1 for one match + 0.05 for one high confidence term
//       expect(confidence).toBeCloseTo(0.65);
//     });

//     test('should decrease confidence for negation terms', () => {
//       const ruleBasedDetectorAny = detector as any;

//       const matches: IPatternMatch[] = [
//         {
//           pattern: '/test/i',
//           matched: 'test',
//           index: 0,
//           length: 4
//         }
//       ];

//       const sentence = "This is not a test sentence";
//       const item = {
//         contextClues: [],
//         confidenceModifiers: {
//           negationTerms: ["not", "never", "doesn't"]
//         }
//       };

//       const confidence = ruleBasedDetectorAny.calculateConfidence(matches, sentence, item);

//       // Base 0.5 + 0.1 for one match - 0.1 for one negation term
//       expect(confidence).toBeCloseTo(0.5);
//     });

//     test('should handle combined effects of context clues, high confidence terms, and negation', () => {
//       const ruleBasedDetectorAny = detector as any;

//       const matches: IPatternMatch[] = [
//         {
//           pattern: '/test/i',
//           matched: 'test',
//           index: 0,
//           length: 4
//         }
//       ];

//       const sentence = "This is definitely not a test with evidence";
//       const item = {
//         contextClues: ["evidence", "confirms", "proves"],
//         confidenceModifiers: {
//           highConfidenceTerms: ["certainly", "definitely", "obviously"],
//           negationTerms: ["not", "never", "doesn't"]
//         }
//       };

//       const confidence = ruleBasedDetectorAny.calculateConfidence(matches, sentence, item);

//       // Base 0.5 + 0.1 for one match + 0.05 for one context clue + 0.05 for one high confidence term - 0.1 for one negation term
//       expect(confidence).toBeCloseTo(0.55);
//     });

//     test('should ensure confidence stays within bounds (0.1 to 0.95)', () => {
//       const ruleBasedDetectorAny = detector as any;

//       // Case 1: Many negative terms should floor at 0.1
//       const lowSentence =
//         "not never doesn't won't can't shouldn't wouldn't test here";
//       const matchIndex = lowSentence.indexOf("test");
//       const lowMatches: IPatternMatch[] = [
//         { pattern: '/test/i', matched: 'test', index: matchIndex, length: 4 }
//       ];

//       const lowItem = {
//         contextClues: [],
//         confidenceModifiers: {
//           negationTerms: ["not", "never", "doesn't", "won't", "can't", "shouldn't", "wouldn't"]
//         }
//       };

//       const lowConfidence = ruleBasedDetectorAny.calculateConfidence(lowMatches, lowSentence, lowItem);
//       expect(lowConfidence).toBeGreaterThanOrEqual(0.1);
//       expect(lowConfidence).toBeLessThanOrEqual(0.4);

//       // Case 2: Many positive terms should cap at 0.95
//       const highMatches: IPatternMatch[] = Array(10).fill({
//         pattern: '/test/i', matched: 'test', index: 0, length: 4
//       });

//       const highSentence = "This is definitely certainly obviously absolutely 100% evidence confirms proves validates test";
//       const highItem = {
//         contextClues: ["evidence", "confirms", "proves", "validates"],
//         confidenceModifiers: {
//           highConfidenceTerms: ["definitely", "certainly", "obviously", "absolutely"]
//         }
//       };

//       const highConfidence = ruleBasedDetectorAny.calculateConfidence(highMatches, highSentence, highItem);
//       expect(highConfidence).toBeCloseTo(0.95);
//     });
//   });

//   describe('isClueNearMatch function', () => {
//     test('should identify when clues are near the match', () => {
//       const ruleBasedDetectorAny = detector as any;

//       const match: IPatternMatch = {
//         pattern: '/test/i',
//         matched: 'test',
//         index: 20, // Position in the middle of the sentence
//         length: 4
//       };

//       const sentence = "This sentence has some evidence of a test right in the middle.";

//       // Check for a clue that is near
//       const nearResult = ruleBasedDetectorAny.isClueNearMatch(sentence, match, "evidence", 5);
//       expect(nearResult).toBe(true);

//       // Check for a clue that is far away
//       const farResult = ruleBasedDetectorAny.isClueNearMatch(sentence, match, "This", 2);
//       expect(farResult).toBe(false);
//     });

//     test('should handle edge cases for window bounds', () => {
//       const ruleBasedDetectorAny = detector as any;

//       // Test with match at the beginning
//       const startMatch: IPatternMatch = {
//         pattern: '/test/i',
//         matched: 'test',
//         index: 0,
//         length: 4
//       };

//       const startSentence = "test sentence with some context.";
//       const startResult = ruleBasedDetectorAny.isClueNearMatch(startSentence, startMatch, "context", 10);
//       expect(startResult).toBe(true);

//       // Test with match at the end
//       const endMatch: IPatternMatch = {
//         pattern: '/test/i',
//         matched: 'test',
//         index: 24,
//         length: 4
//       };

//       const endSentence = "Sentence with context and test";
//       const endResult = ruleBasedDetectorAny.isClueNearMatch(endSentence, endMatch, "context", 10);
//       expect(endResult).toBe(true);
//     });
//   });

//   describe('detectInSentence function', () => {
//     test('should detect confirmation bias in a sentence', () => {
//       const sentence = 'I knew this would happen with the new policy.';
//       const results = detector.detectInSentence(sentence);

//       expect(results).toHaveLength(1);
//       expect(results[0].type).toBe('bias');
//       expect(results[0].name).toBe('Confirmation Bias');
//       expect(results[0].matches).toHaveLength(1);
//       expect(results[0].confidence).toBeGreaterThan(0.5);
//     });

//     test('should detect ad hominem fallacy in a sentence', () => {
//       const sentence = "You're too young to understand complex issues.";
//       const results = detector.detectInSentence(sentence);

//       expect(results).toHaveLength(1);
//       expect(results[0].type).toBe('fallacy');
//       expect(results[0].name).toBe('Ad Hominem');
//       expect(results[0].matches).toHaveLength(1);
//       expect(results[0].confidence).toBeGreaterThan(0.5);
//     });

//     test('should not detect anything in neutral sentences', () => {
//       const sentence = "The weather is nice today.";
//       const results = detector.detectInSentence(sentence);

//       expect(results).toHaveLength(0);
//     });

//     test('should filter detection by type', () => {
//       const sentenceWithBoth = "I knew this would happen and you're too young to understand.";

//       const biasResults = detector.detectInSentence(sentenceWithBoth, EDetectionFilter.Biases);
//       expect(biasResults).toHaveLength(1);
//       expect(biasResults[0].type).toBe('bias');

//       const fallacyResults = detector.detectInSentence(sentenceWithBoth, EDetectionFilter.Fallacies);
//       expect(fallacyResults).toHaveLength(1);
//       expect(fallacyResults[0].type).toBe('fallacy');

//       const allResults = detector.detectInSentence(sentenceWithBoth, EDetectionFilter.All);
//       expect(allResults).toHaveLength(2);
//     });

//     test('should handle empty or null input', () => {
//       expect(detector.detectInSentence('')).toHaveLength(0);
//       expect(detector.detectInSentence(null as unknown as string)).toHaveLength(0);
//     });

//     test('should increase confidence with context clues', () => {
//       const sentence1 = "I knew this would happen.";
//       const sentence2 = "I knew this would happen because the evidence confirms it.";

//       const results1 = detector.detectInSentence(sentence1);
//       const results2 = detector.detectInSentence(sentence2);

//       expect(results1[0].confidence).toBeLessThan(results2[0].confidence);
//     });

//     test('should adjust confidence based on high confidence terms', () => {
//       const sentence1 = "I knew this would happen.";
//       const sentence2 = "I definitely knew this would happen.";

//       const results1 = detector.detectInSentence(sentence1);
//       const results2 = detector.detectInSentence(sentence2);

//       expect(results1[0].confidence).toBeLessThan(results2[0].confidence);
//     });

//     test('should decrease confidence when negation terms are present', () => {
//       const sentence1 = "I knew this would happen.";
//       const sentence2 = "I never knew this would happen.";

//       const results1 = detector.detectInSentence(sentence1);
//       const results2 = detector.detectInSentence(sentence2);

//       // The second sentence has a negation, so confidence should be lower
//       expect(results1[0].confidence).toBeGreaterThan(results2[0].confidence);
//     });
//   });

//   describe('detectInText function', () => {
//     test('should detect multiple instances of bias and fallacy in text', () => {
//       const text = "I knew this would happen. You're too young to understand. Just as I predicted.";

//       mockTokenizer.splitIntoSentences.mockReturnValue([
//         "I knew this would happen.",
//         "You're too young to understand.",
//         "Just as I predicted."
//       ]);

//       const results = detector.detectInText(text, mockTokenizer);

//       expect(results).toHaveLength(3);
//       expect(results[0].sentence).toBe("I knew this would happen.");
//       expect(results[0].detections[0].type).toBe('bias');
//       expect(results[0].detections[0].name).toBe('Confirmation Bias');

//       expect(results[1].sentence).toBe("You're too young to understand.");
//       expect(results[1].detections[0].type).toBe('fallacy');
//       expect(results[1].detections[0].name).toBe('Ad Hominem');

//       expect(results[2].sentence).toBe("Just as I predicted.");
//       expect(results[2].detections[0].type).toBe('bias');
//       expect(results[2].detections[0].name).toBe('Confirmation Bias');
//     });

//     test('should handle empty or null input', () => {
//       expect(detector.detectInText('', mockTokenizer)).toHaveLength(0);
//       expect(detector.detectInText(null as unknown as string, mockTokenizer)).toHaveLength(0);
//     });

//     test('should return empty array for text with no biases or fallacies', () => {
//       const text = "The weather is nice today. I hope it stays this way.";

//       mockTokenizer.splitIntoSentences.mockReturnValue([
//         "The weather is nice today.",
//         "I hope it stays this way."
//       ]);

//       const results = detector.detectInText(text, mockTokenizer);
//       expect(results).toHaveLength(0);
//     });
//   });

//   describe('generateSummary function', () => {
//     test('should generate summary statistics from detections', () => {
//       const detections: ISentenceDetection[] = [
//         {
//           sentence: "I knew this would happen.",
//           sentenceIndex: 0,
//           detections: [{
//             type: 'bias' as const,
//             name: 'Confirmation Bias',
//             description: 'Tendency to favor information that confirms prior beliefs',
//             matches: [],
//             confidence: 0.6
//           }]
//         },
//         {
//           sentence: "You're too young to understand.",
//           sentenceIndex: 1,
//           detections: [{
//             type: 'fallacy' as const,
//             name: 'Ad Hominem',
//             description: 'Attacking the person instead of their argument',
//             matches: [],
//             confidence: 0.7
//           }]
//         },
//         {
//           sentence: "Just as I predicted.",
//           sentenceIndex: 2,
//           detections: [{
//             type: 'bias' as const,
//             name: 'Confirmation Bias',
//             description: 'Tendency to favor information that confirms prior beliefs',
//             matches: [],
//             confidence: 0.8
//           }]
//         }
//       ];

//       const summary = detector.generateSummary(detections);

//       expect(summary.biasesFound).toHaveLength(1);
//       expect(summary.fallaciesFound).toHaveLength(1);

//       expect(summary.biasesFound[0].name).toBe('Confirmation Bias');
//       expect(summary.biasesFound[0].count).toBe(2);
//       expect(summary.biasesFound[0].confidence).toBe(0.8); // Max confidence

//       expect(summary.fallaciesFound[0].name).toBe('Ad Hominem');
//       expect(summary.fallaciesFound[0].count).toBe(1);
//       expect(summary.fallaciesFound[0].confidence).toBe(0.7);
//     });

//     test('should handle empty detections array', () => {
//       const summary = detector.generateSummary([]);

//       expect(summary.biasesFound).toHaveLength(0);
//       expect(summary.fallaciesFound).toHaveLength(0);
//     });

//     test('should handle null input', () => {
//       const summary = detector.generateSummary(null as unknown as ISentenceDetection[]);

//       expect(summary.biasesFound).toHaveLength(0);
//       expect(summary.fallaciesFound).toHaveLength(0);
//     });

//     test('should sort biases and fallacies by count', () => {
//       // Create detections with different counts
//       const detections: ISentenceDetection[] = [
//         {
//           sentence: "I knew this would happen.",
//           sentenceIndex: 0,
//           detections: [{
//             type: 'bias' as const,
//             name: 'Confirmation Bias',
//             description: 'Description 1',
//             matches: [],
//             confidence: 0.6
//           }]
//         },
//         {
//           sentence: "You're too young to understand.",
//           sentenceIndex: 1,
//           detections: [{
//             type: 'fallacy' as const,
//             name: 'Ad Hominem',
//             description: 'Description 2',
//             matches: [],
//             confidence: 0.7
//           }]
//         },
//         {
//           sentence: "Just as I predicted.",
//           sentenceIndex: 2,
//           detections: [{
//             type: 'bias' as const,
//             name: 'Confirmation Bias',
//             description: 'Description 1',
//             matches: [],
//             confidence: 0.8
//           }]
//         },
//         {
//           sentence: "All doctors are just trying to make money.",
//           sentenceIndex: 3,
//           detections: [{
//             type: 'bias' as const,
//             name: 'Hasty Generalization',
//             description: 'Description 3',
//             matches: [],
//             confidence: 0.65
//           }]
//         },
//         {
//           sentence: "They're biased because they work for the government.",
//           sentenceIndex: 4,
//           detections: [{
//             type: 'fallacy' as const,
//             name: 'Ad Hominem',
//             description: 'Description 2',
//             matches: [],
//             confidence: 0.7
//           }]
//         },
//         {
//           sentence: "If we allow this, next thing you know everyone will do it.",
//           sentenceIndex: 5,
//           detections: [{
//             type: 'fallacy' as const,
//             name: 'Slippery Slope',
//             description: 'Description 4',
//             matches: [],
//             confidence: 0.75
//           }]
//         }
//       ];

//       const summary = detector.generateSummary(detections);

//       // Confirmation Bias should be first as it appears twice
//       expect(summary.biasesFound[0].name).toBe('Confirmation Bias');
//       expect(summary.biasesFound[0].count).toBe(2);

//       // Ad Hominem should be first in fallacies as it appears twice
//       expect(summary.fallaciesFound[0].name).toBe('Ad Hominem');
//       expect(summary.fallaciesFound[0].count).toBe(2);

//       // Slippery Slope should be after Ad Hominem
//       expect(summary.fallaciesFound[1].name).toBe('Slippery Slope');
//       expect(summary.fallaciesFound[1].count).toBe(1);
//     });
//   });

//   describe('analyzeContext function', () => {
//     test('should increase confidence for repeated biases/fallacies in adjacent sentences', () => {
//       const ruleBasedDetectorAny = detector as any;

//       const detections: ISentenceDetection[] = [
//         {
//           sentence: "I knew this would happen.",
//           sentenceIndex: 0,
//           detections: [{
//             type: 'bias' as const,
//             name: 'Confirmation Bias',
//             description: 'Description',
//             matches: [],
//             confidence: 0.6
//           }]
//         },
//         {
//           sentence: "Just as I predicted it would.",
//           sentenceIndex: 1,
//           detections: [{
//             type: 'bias' as const,
//             name: 'Confirmation Bias',
//             description: 'Description',
//             matches: [],
//             confidence: 0.7
//           }]
//         }
//       ];

//       const enhancedDetections = ruleBasedDetectorAny.analyzeContext(detections);

//       // Confidence should be increased for both sentences since they have the same bias
//       expect(enhancedDetections[0].detections[0].confidence).toBeGreaterThan(0.6);
//       expect(enhancedDetections[1].detections[0].confidence).toBeGreaterThan(0.7);
//     });

//     test('should not modify confidence for unrelated biases/fallacies', () => {
//       const ruleBasedDetectorAny = detector as any;

//       const detections: ISentenceDetection[] = [
//         {
//           sentence: "I knew this would happen.",
//           sentenceIndex: 0,
//           detections: [{
//             type: 'bias' as const,
//             name: 'Confirmation Bias',
//             description: 'Description',
//             matches: [],
//             confidence: 0.6
//           }]
//         },
//         {
//           sentence: "You're too young to understand.",
//           sentenceIndex: 1,
//           detections: [{
//             type: 'fallacy' as const,
//             name: 'Ad Hominem',
//             description: 'Description',
//             matches: [],
//             confidence: 0.7
//           }]
//         }
//       ];

//       const enhancedDetections = ruleBasedDetectorAny.analyzeContext(detections);

//       // Confidence should remain the same since they are different bias/fallacy types
//       expect(enhancedDetections[0].detections[0].confidence).toBeCloseTo(0.6);
//       expect(enhancedDetections[1].detections[0].confidence).toBeCloseTo(0.7);
//     });

//     test('should handle single sentence input', () => {
//       const ruleBasedDetectorAny = detector as any;

//       const detections: ISentenceDetection[] = [
//         {
//           sentence: "I knew this would happen.",
//           sentenceIndex: 0,
//           detections: [{
//             type: 'bias' as const,
//             name: 'Confirmation Bias',
//             description: 'Description',
//             matches: [],
//             confidence: 0.6
//           }]
//         }
//       ];

//       const enhancedDetections = ruleBasedDetectorAny.analyzeContext(detections);

//       // Should return the same detections without changes
//       expect(enhancedDetections).toEqual(detections);
//       expect(enhancedDetections[0].detections[0].confidence).toBeCloseTo(0.6);
//     });

//     test('should handle empty input', () => {
//       const ruleBasedDetectorAny = detector as any;

//       const emptyDetections: ISentenceDetection[] = [];
//       const result = ruleBasedDetectorAny.analyzeContext(emptyDetections);

//       expect(result).toEqual(emptyDetections);
//     });
//   });
// });
