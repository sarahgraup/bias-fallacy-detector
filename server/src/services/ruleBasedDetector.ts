import {
  IBiasOrFallacy, IBiasesFallaciesData, ICompiledBiasOrFallacy, IDetection, TCognitivePatternType, TDetectionFilter, EDetectionFilter, IPatternMatch,
} from '@/utils';


interface ICompiledData{
    biases: ICompiledBiasOrFallacy[];
    fallacies: ICompiledBiasOrFallacy[];
}

/**
 * RuleBasedDetector is responsible for identifying cognitive biases and logical fallacies
 * in text using pattern matching and contextual analysis. It uses regular expressions to match
 * patterns and calculates confidence scores based on matches and context clues.
 */
class RuleBasedDetector {
  private compiledData: ICompiledData;

  /**
   * Initialize the detector with patterns for biases and fallacies
   *
   * @param biasesFallaciesData - Configuration object containing bias and fallacy definitions
   *
   * @example
   * const data = {
   *   biases: [
   *     {
   *       name: "Confirmation Bias",
   *       description: "The tendency to favor information that confirms prior beliefs",
   *       patterns: ["knew this would happen", "confirms my beliefs"],
   *       context_clues: ["evidence", "proves"]
   *     }
   *   ],
   *   fallacies: [
   *     {
   *       name: "Ad Hominem",
   *       description: "Attacking the person instead of their argument",
   *       patterns: ["too young to understand"],
   *       context_clues: ["personal", "attack"]
   *     }
   *   ]
   * };
   *
   * const detector = new RuleBasedDetector(data);
   */

  constructor(biasesFallaciesData: IBiasesFallaciesData) {
    this.compiledData = {
      biases: this.compilePatterns(biasesFallaciesData.biases, 'bias'),
      fallacies: this.compilePatterns(biasesFallaciesData.fallacies, 'fallacy'),
    };
  }

  /**
   * compile string patterns into regexp objects for efficient matching
   * @param items - array of BiasOrFallacy objects containing pattern strings
   * @param type - whether type is bias or fallacy
   * @returns array of objects with original properties plus compiled RegExp patterns
   *
   *  * @example
   * // Input
   * const items = [
   *   {
   *     name: "Confirmation Bias",
   *     description: "Tendency to favor information that confirms prior beliefs",
   *     patterns: ["knew this would happen", "proves what I (said|thought)"],
   *     context_clues: ["evidence", "proves"]
   *   }
   * ];
   *
   * // Output (simplified)
   * [
   *   {
   *     name: "Confirmation Bias",
   *     description: "Tendency to favor information that confirms prior beliefs",
   *     patterns: ["knew this would happen", "proves what I (said|thought)"],
   *     context_clues: ["evidence", "proves"],
   *     compiledPatterns: [/knew this would happen/i, /proves what I (said|thought)/i]
   *   }
   * ]
   */

  private compilePatterns(
    items: IBiasOrFallacy[],
    type?: TCognitivePatternType,
  ): ICompiledBiasOrFallacy[] {
    return items.map((item) => ({
      ...item,
      compiledPatterns: item.patterns.map(
        (pattern) => new RegExp(pattern, 'i'),
      ),
    }));
  }

  /**
   * Tests sentence against compiled patterns to find matches
   *
   * @param sentence - The sentence to analyze
   * @param item - Bias or fallacy object with compiled patterns
   * @returns Array of pattern matches with details about match position and text
   *
   * @example
   * // Input
   * const sentence = "I knew this would happen with the new policy.";
   * const bias: CompiledBiasOrFallacy = {
   *   // ...other properties
   *   compiledPatterns: [/knew this would happen/i]
   * };
   *
   * // Output
   * const matches: PatternMatch[] = [
   *   {
   *     pattern: '/knew this would happen/i',
   *     matched: 'knew this would happen',
   *     index: 2,
   *     length: 21
   *   }
   * ]
   */
  private matchPatterns(
    sentence: string,
    item: ICompiledBiasOrFallacy,
  ): IPatternMatch[] {
    const matches: IPatternMatch[] = [];

    item.compiledPatterns.forEach((pattern) => {
      // regexp match
      const match = sentence.match(pattern);
      if (match && match.index !== undefined) {
        matches.push({
          pattern: pattern.toString(),
          matched: match[0],
          index: match.index,
          length: match[0].length,
        });
      }
    });
    return matches;
  }

  /**
   * Analyzes single sentence to detect biases and/or fallacies
   *
   * @param sentence- sentence to analyze
   * @param filter - optional param to specifiy which types to detect ('all', 'biases', or 'fallacies')
   * @returns array of detected biases and fallacies with match details and confidence scores
   *
   * @example
   * // Input
   * const sentence = "I knew this would happen with the new policy.";
   *
   * // Output
   * const results: Detection[] = [
   *   {
   *     type: 'bias',
   *     name: 'Confirmation Bias',
   *     description: 'Tendency to favor information that confirms prior beliefs',
   *     matches: [
   *       {
   *         pattern: '/knew this would happen/i',
   *         matched: 'knew this would happen',
   *         index: 2,
   *         length: 21
   *       }
   *     ],
   *     confidence: 0.6
   *   }
   * ]
   */

  detectInSentence(
    sentence: string,
    filter: TDetectionFilter = 'all',
  ): IDetection[] {
    const results: IDetection[] = [];

    // check for biases if requested
    if (filter === EDetectionFilter.All || filter === EDetectionFilter.Biases) {
      this.compiledData.biases.forEach((bias) => {
        const biasMatches = this.matchPatterns(sentence, bias);
        if (biasMatches.length > 0) {
          results.push({
            type: 'bias',
            name: bias.name,
            description: bias.description,
            matches: biasMatches,
            confidence: this.calculateConfidence(biasMatches, sentence, bias),
          });
        }
      });
    }

    if (
      filter === EDetectionFilter.All
      || filter === EDetectionFilter.Fallacies
    ) {
      this.compiledData.fallacies.forEach((fallacy) => {
        const fallacyMatches = this.matchPatterns(sentence, fallacy);
        if (fallacyMatches.length > 0) {
          results.push({
            type: 'fallacy',
            name: fallacy.name,
            description: fallacy.description,
            matches: fallacyMatches,
            confidence: this.calculateConfidence(
              fallacyMatches,
              sentence,
              fallacy,
            ),
          });
        }
      });
    }
    return results;
  }

  /**
   * calculates confidence score for detection based on matches and context clues
   *
   * @param matches - Array of pattern matches found in sentence
   * @param sentence - original sentence being analyzed
   * @param item - bias or fallacy being matched
   * @returns a confidence score between 0.5 and 0.95
   *
   * @example
   * // Inputs
   * const matches = [
   *   {
   *     pattern: '/knew this would happen/i',
   *     matched: 'knew this would happen',
   *     index: 2,
   *     length: 21
   *   }
   * ];
   * const sentence = "I knew this would happen because the evidence confirms it.";
   * const bias = {
   *   // ...other properties
   *   context_clues: ["evidence", "confirms"],
   *    "confidence_modifiers":{
        "high_confidence_terms":["certainly", "definitely", "obviously"],
        "negation_terms":["not", "never", "doesn't"]
      }
   * };
   *
   * // Output: 0.7 (0.5 base + 0.1 for one match + 0.05*2 for two context clues)
   */
  private calculateConfidence(
    matches: IPatternMatch[],
    sentence: string,
    item: ICompiledBiasOrFallacy,
  ): number {
    let confidence = 0.5; // base

    // increase confidence based on number of matches
    confidence += matches.length * 0.1;

    // check for context clues to increase confidence
    if (item.contextClues && item.contextClues.length > 0) {
      const clueMatches = item.contextClues.filter((clue) => sentence.toLowerCase().includes(clue.toLowerCase()));

      confidence += clueMatches.length * 0.05;
    }
    // check for high confidence terms
    if (item.confidenceModifiers?.highConfidenceTerms) {
      const highConfidenceMatches = item.confidenceModifiers.highConfidenceTerms.filter((term) => sentence.toLowerCase().includes(term.toLowerCase()));
      confidence += highConfidenceMatches.length * 0.05;
    }

    if (item.confidenceModifiers?.negationTerms) {
      const negationMatches = item.confidenceModifiers.negationTerms.filter(
        (term) => sentence.toLowerCase().includes(term.toLowerCase()),
      );
      confidence -= negationMatches.length * 0.1;
    }
    // ensure confidence doesnt go below 0.1n

    return Math.min(Math.max(0.1, confidence), 0.95);
  }

  // private isClueNearMatch(sentence: string, match: IPatternMatch, clue: string, windowSize: number = 5): boolean{
  //   const matchStart = match.index;
  //   const matchEnd = match.index + match.length;
  // }
}

export default RuleBasedDetector;
