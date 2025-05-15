import RuleBasedDetector from '@/services/RuleBasedDetector';
import TextTokenizer from '@/services/TextTokenizer';
import { IBiasesFallaciesData, TCognitivePatternType } from '@/utils';

// mock TextTokenizer
jest.mock('../../services/TextTokenizer');

describe('RuleBasedDetector', () => {
  let detector: RuleBasedDetector;
  let mockTokenizer: jest.Mocked<TextTokenizer>;

  const testData: IBiasesFallaciesData = {
    biases: [
      {
        name: 'Confirmation Bias',
        description:
          'Tendency to favor information that confirms prior beliefs',
        examples: ['I knew this would happen'],
        patterns: [
          'knew this would happen',
          'confirms my (beliefs|suspicions)',
          'just as I (predicted|expected)',
        ],
        contextClues: ['evidence', 'confirms', 'proves'],
      },
    ],
    fallacies: [
      {
        name: 'Ad Hominem',
        description: 'Attacking the person instead of their argument',
        examples: ['You\'re too young to understand'],
        patterns: [
          'too (young|old|ignorant) to understand',
          '(he|she|they)(\'s| is| are) biased',
        ],
        contextClues: ['personal', 'attack', 'character'],
      },
    ],
  };

  beforeEach(() => {
    mockTokenizer = new TextTokenizer() as jest.Mocked<TextTokenizer>;
    mockTokenizer.splitIntoSentences = jest
      .fn()
      .mockImplementation((text: string) => {
        if (!text) return [];
        return text.split('. ').map((s) => `${s.trim()}.`);
      });
    detector = new RuleBasedDetector(testData);
  });

  describe('compilePatterns function', () => {
    test('should compile string patterns into RegExp objects', () => {
      // in order to access private function create workaround

      const ruleBasedDetectorAny = detector as any;

      const compiledBiases = ruleBasedDetectorAny.compilePatterns(
        testData.biases,
        'bias' as TCognitivePatternType,
      );

      expect(compiledBiases).toHaveLength(1);
      expect(compiledBiases[0].name).toBe('Confirmation Bias');
      expect(compiledBiases[0].patterns).toHaveLength(3);

      // check that patterns are compiled into RegExp objects
      compiledBiases[0].compiledPatterns.forEach((pattern: RegExp) => {
        expect(pattern).toBeInstanceOf(RegExp);
      });

      // testing fallacy patterns compilation
      const compiledFallacies = ruleBasedDetectorAny.compilePatterns(
        testData.fallacies,
        'fallacy' as TCognitivePatternType,
      );

      expect(compiledFallacies).toHaveLength(1);
      expect(compiledFallacies[0].name).toBe('Ad Hominem');
      expect(compiledFallacies[0].compiledPatterns).toHaveLength(2);

      // Check that patterns are compiled into RegExp objects
      compiledFallacies[0].compiledPatterns.forEach((pattern: any) => {
        expect(pattern).toBeInstanceOf(RegExp);
      });
    });

    test('should handle empty pattern arrays without errors', () => {
      /*
       * Purpose: This test verifies that compilePatterns can handle edge cases
       * like empty pattern arrays without crashing. It should return an object
       * with an empty compiledPatterns array.
       */
      const ruleBasedDetectorAny = detector as any;

      const emptyBias = {
        name: 'Empty Bias',
        description: 'A bias with no patterns',
        examples: [],
        patterns: [],
        contextClues: [],
      };

      const compiledEmpty = ruleBasedDetectorAny.compilePatterns(
        [emptyBias],
        'bias' as TCognitivePatternType,
      );

      expect(compiledEmpty).toHaveLength(1);
      expect(compiledEmpty[0].compiledPatterns).toHaveLength(0);
    });
  });

  describe('matchPatterns function', () => {
    test('should identify matches between compiled patterns and text', () => {
      /*
             * Purpose: The matchPatterns function searches a sentence for matches against
             * compiled RegExp patterns. It returns an array of matches with details about
             * where each match was found. This test verifies it correctly identifies
             * patterns in the text and returns the right information about each match.
             */

      const ruleBasedDetectorAny = detector as any;

      // compile bias
      const compiledBias = ruleBasedDetectorAny.compilePatterns(testData.biases, 'bias' as TCognitivePatternType)[0];

      // test match patterns
      const sentence = 'I knew this would happen today';
      const matches = ruleBasedDetectorAny.matchPatterns(sentence, compiledBias);

      expect(matches).toHaveLength(1);
      expect(matches[0].matched).toBe('knew this would happen');
      expect(matches[0].index).toBe(2);
      expect(typeof matches[0].pattern).toBe('string');
      expect(matches[0].pattern).toContain('knew this would happen');
    });
  });

  test('should initialize and compile patterns', () => {
    expect(detector).toBeInstanceOf(RuleBasedDetector);
  });

  test('should detect confirmation bias in a sentence', () => {
    const sentence = 'I knew this would happen with the new policy.';
    const results = detector.detectInSentence(sentence);

    expect(results).toHaveLength(1);
    expect(results[0].type).toBe('bias');
    expect(results[0].name).toBe('Confirmation Bias');
    expect(results[0].matches).toHaveLength(1);
    expect(results[0].confidence).toBeGreaterThan(0.5);
  });
});
