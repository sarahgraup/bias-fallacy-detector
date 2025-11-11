import {
  IBiasOrFallacy,
  IBiasesFallaciesData,
  ICompiledBiasOrFallacy,
  IDetection,
  TCognitivePatternType,
  TDetectionFilter,
  EDetectionFilter,
  IPatternMatch,
  ISentenceDetection,
  IAnalysisSummary,
  IGlobalConfidenceModifiers,
  ICompiledPattern,
  IBiasSpecificConfidenceModifiers,
} from "@utils/types";

import TextTokenizer from "../utils/TextTokenizer";
interface ICompiledData {
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
  private globalModifiers: IGlobalConfidenceModifiers;

  /**
   * Initialize the detector with patterns for biases and fallacies
   *
   * @param biasesFallaciesData - Configuration object containing bias and fallacy definitions
   *
   * @example
   * const data = {
   *   biases: [
   *     {
      "name": "Confirmation Bias",
      "description": "The tendency to search for, interpret, and recall information in a way that confirms one's preexisting beliefs or hypotheses.",
      "examples": [
        "This proves what I've been saying all along",
        "I knew this would happen",
        "I only read news sources that align with my views"
      ],
      "patterns": [
        "proves (what|that) (I|we) (said|thought|believed)",
        "knew this would happen",
        "just as I (said|predicted|expected)",
        "I only listen to (sources|people) that make sense"
      ],
      "context_clues":["evidence", "validates", "confirms", "all along", "as I suspected"],
      "confidence_modifiers":{
        "high_confidence_terms":["certainly", "definitely", "obviously"],
        "negation_terms":["not", "never", "doesn't"]
      }
    }
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
    this.globalModifiers =
      biasesFallaciesData.global_confidence_modifiers || {};
    this.compiledData = {
      biases: this.compilePatterns(biasesFallaciesData.biases, "bias"),
      fallacies: this.compilePatterns(biasesFallaciesData.fallacies, "fallacy"),
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
    type?: TCognitivePatternType
  ): ICompiledBiasOrFallacy[] {
    return items.map((item) => ({
      ...item,
      compiledPatterns: item.patterns.map(
        (patternObj): ICompiledPattern => ({
          regex: new RegExp(patternObj.regex, "i"),
          weight: patternObj.weight,
          description: patternObj.description,
        })
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
    item: ICompiledBiasOrFallacy
  ): IPatternMatch[] {
    const matches: IPatternMatch[] = [];

    item.compiledPatterns.forEach((pattern) => {
      // regexp match
      const match = sentence?.match(pattern.regex);
      if (match && match.index !== undefined) {
        matches.push({
          pattern: pattern.regex.toString(),
          matched: match[0],
          index: match.index,
          length: match[0].length,
          weight: pattern.weight,
        });
      }
    });
    return matches;
  }

  /**
   * Check if sentence matches exclusion patterns
   */
  private isExcluded(sentence: string, item: ICompiledBiasOrFallacy): boolean {
    if (!item.exclusions) return false;

    return item.exclusions.some((exclusion) => {
      const exclusionRegex = new RegExp(exclusion.pattern, "i");
      return exclusionRegex.test(sentence);
    });
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
    filter: TDetectionFilter = "all"
  ): IDetection[] {
    if (!sentence || sentence.trim().length === 0) return [];

    const results: IDetection[] = [];

    // check for biases if requested
    if (filter === EDetectionFilter.All || filter === EDetectionFilter.Biases) {
      this.compiledData.biases.forEach((bias) => {
        const biasMatches = this.matchPatterns(sentence, bias);
        if (biasMatches.length > 0 && !this.isExcluded(sentence, bias)) {
          results.push({
            type: "bias",
            name: bias.name,
            description: bias.description,
            matches: biasMatches,
            confidence: this.calculateConfidence(biasMatches, sentence, bias),
          });
        }
      });
    }

    if (
      filter === EDetectionFilter.All ||
      filter === EDetectionFilter.Fallacies
    ) {
      this.compiledData.fallacies.forEach((fallacy) => {
        const fallacyMatches = this.matchPatterns(sentence, fallacy);
        if (fallacyMatches.length > 0 && !this.isExcluded(sentence, fallacy)) {
          results.push({
            type: "fallacy",
            name: fallacy.name,
            description: fallacy.description,
            matches: fallacyMatches,
            confidence: this.calculateConfidence(
              fallacyMatches,
              sentence,
              fallacy
            ),
          });
        }
      });
    }
    return results;
  }

  /**
   * Analyzes full text for biases and fallacies by breaking it into sentences
   *
   * @param text- text to analyze
   * @param tokenizer - TextTokenizer instance to split text into sent4ences
   * @returns Array of sentence detection results with bias and fallacy information
   *
   * @example
   * //input
   * const text = "I knew this would happen. You're too young to understand.";
   *
   * //output
   * [
   *   {
   *     sentence: "I knew this would happen.",
   *     sentenceIndex: 0,
   *     detections: [
   *       {
   *         type: 'bias',
   *         name: 'Confirmation Bias',
   *         description: '...',
   *         matches: [...],
   *         confidence: 0.6
   *       }
   *     ]
   *   },
   *   {
   *     sentence: "You're too young to understand.",
   *     sentenceIndex: 1,
   *     detections: [
   *       {
   *         type: 'fallacy',
   *         name: 'Ad Hominem',
   *         description: '...',
   *         matches: [...],
   *         confidence: 0.6
   *       }
   *     ]
   *   }
   * ]
   */
  detectInText(text: string, tokenizer: TextTokenizer): ISentenceDetection[] {
    if (!text) return [];

    const sentences = tokenizer.splitIntoSentences(text);
    const results: ISentenceDetection[] = [];

    sentences.forEach((sentence, index) => {
      const sentenceResults = this.detectInSentence(sentence);
      if (sentenceResults.length > 0) {
        results.push({
          sentence,
          sentenceIndex: index,
          detections: sentenceResults,
        });
      }
    });

    // return results;
    return this.analyzeContext(results);
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
    item: ICompiledBiasOrFallacy
  ): number {
    let confidence = 0.5; // base

    let weightedScore = 0;
    matches.forEach((match) => {
      const weight = match.weight || 0.5; //fallback weight
      weightedScore += weight;
    });

    // increase confidence based on number of matches
    confidence += Math.min(weightedScore * 0.2, 0.4); //cap contribution at 0.4

    //apply context clues
    confidence = this.applyContextClues(confidence, sentence, matches, item);

    //apply global confidence modifiers
    confidence = this.applyGlobalModifiers(confidence, sentence, matches);

    //apply bias-specific modifiers if they exist
    if (item.confidence_modifiers) {
      confidence = this.applyBiasSpecificModifiers(
        confidence,
        sentence,
        matches,
        item.confidence_modifiers
      );
    }

    // confidence += matches.length * 0.1;

    // // check for context clues to increase confidence
    // if (item.contextClues && item.contextClues.length > 0) {
    //   const clueMatches = item.contextClues.filter(
    //     (clue) =>
    //       matches.some((match) => this.isClueNearMatch(sentence, match, clue))
    //     // sentence.toLowerCase().includes(clue.toLowerCase())
    //   );

    //   confidence += clueMatches.length * 0.05;
    // }
    // // check for high confidence terms
    // if (item.confidenceModifiers?.highConfidenceTerms) {
    //   const highConfidenceMatches =
    //     item.confidenceModifiers.highConfidenceTerms.filter((term) =>
    //       sentence.toLowerCase().includes(term.toLowerCase())
    //     );
    //   confidence += highConfidenceMatches.length * 0.05;
    // }

    // if (item.confidenceModifiers?.negationTerms) {
    //   const negationMatches = item.confidenceModifiers.negationTerms.filter(
    //     (term) =>
    //       // sentence.toLowerCase().includes(term.toLowerCase())
    //       matches.some((match) => this.isClueNearMatch(sentence, match, term))
    //   );
    //   confidence -= negationMatches.length * 0.1;
    // }
    // ensure confidence doesnt go below 0.1n

    return Math.min(Math.max(0.1, confidence), 0.95);
  }

  /**
   * Apply context clues to adjust confidence
   */
  private applyContextClues(
    confidence: number,
    sentence: string,
    matches: IPatternMatch[],
    item: ICompiledBiasOrFallacy
  ): number {
    // Positive context clues increase confidence
    if (item.context_clues?.positive) {
      const positiveClues = item.context_clues.positive.filter((clue) =>
        matches.some((match) => this.isClueNearMatch(sentence, match, clue))
      );
      confidence += positiveClues.length * 0.05;
    }

    // Negative context clues decrease confidence
    if (item.context_clues?.negative) {
      const negativeClues = item.context_clues.negative.filter((clue) =>
        matches.some((match) => this.isClueNearMatch(sentence, match, clue))
      );
      confidence -= negativeClues.length * 0.05;
    }

    return confidence;
  }

  /**
   * Apply global confidence modifiers
   */
  private applyGlobalModifiers(
    confidence: number,
    sentence: string,
    matches: IPatternMatch[]
  ): number {
    const lowerSentence = sentence.toLowerCase();

    // Global high confidence terms
    if (this.globalModifiers.high_confidence_terms) {
      const highConfidenceMatches =
        this.globalModifiers.high_confidence_terms.filter((term) =>
          lowerSentence.includes(term.toLowerCase())
        );
      confidence += highConfidenceMatches.length * 0.05;
    }

    // Global negation terms (near matches)
    if (this.globalModifiers.negation_terms) {
      const negationMatches = this.globalModifiers.negation_terms.filter(
        (term) =>
          matches.some((match) => this.isClueNearMatch(sentence, match, term))
      );
      confidence -= negationMatches.length * 0.1;
    }

    // Global uncertainty terms
    if (this.globalModifiers.uncertainty_terms) {
      const uncertaintyMatches = this.globalModifiers.uncertainty_terms.filter(
        (term) => lowerSentence.includes(term.toLowerCase())
      );
      confidence -= uncertaintyMatches.length * 0.03;
    }

    // Global hedging terms
    if (this.globalModifiers.hedging_terms) {
      const hedgingMatches = this.globalModifiers.hedging_terms.filter((term) =>
        lowerSentence.includes(term.toLowerCase())
      );
      confidence -= hedgingMatches.length * 0.02;
    }

    return confidence;
  }

  /**
   * Apply bias-specific confidence modifiers
   */
  private applyBiasSpecificModifiers(
    confidence: number,
    sentence: string,
    matches: IPatternMatch[],
    modifiers: IBiasSpecificConfidenceModifiers
  ): number {
    const lowerSentence = sentence.toLowerCase();

    // Bias-specific terms (like "in hindsight" for Hindsight Bias)
    if (modifiers.bias_specific_terms) {
      const specificMatches = modifiers.bias_specific_terms.filter((term) =>
        lowerSentence.includes(term.toLowerCase())
      );
      confidence += specificMatches.length * 0.07; // Higher boost for specific terms
    }

    // Override global terms if specified for this bias
    if (modifiers.high_confidence_terms) {
      const highConfidenceMatches = modifiers.high_confidence_terms.filter(
        (term) => lowerSentence.includes(term.toLowerCase())
      );
      confidence += highConfidenceMatches.length * 0.05;
    }

    if (modifiers.negation_terms) {
      const negationMatches = modifiers.negation_terms.filter((term) =>
        matches.some((match) => this.isClueNearMatch(sentence, match, term))
      );
      confidence -= negationMatches.length * 0.1;
    }

    if (modifiers.uncertainty_terms) {
      const uncertaintyMatches = modifiers.uncertainty_terms.filter((term) =>
        lowerSentence.includes(term.toLowerCase())
      );
      confidence -= uncertaintyMatches.length * 0.03;
    }

    return confidence;
  }

  /**
   * Generates a summary of all biases and fallacies detected across all sentences
   *
   * @param detections - Array of sentence detection results
   * @returns Summary object with aggregated bias and fallacy counts and confidence scores
   *
   * @example
   * //Input: Array of SentenceDetection objects (from detectInText)
   *
   * //Output
   * {
   *   biasesFound: [
   *     {
   *       name: "Confirmation Bias",
   *       description: "Tendency to favor information that confirms prior beliefs",
   *       count: 2,
   *       confidence: 0.8
   *     }
   *   ],
   *   fallaciesFound: [
   *     {
   *       name: "Ad Hominem",
   *       description: "Attacking the person instead of their argument",
   *       count: 1,
   *       confidence: 0.7
   *     }
   *   ]
   * }
   *
   */
  generateSummary(detections: ISentenceDetection[]): IAnalysisSummary {
    if (!detections || detections.length === 0) {
      return { biasesFound: [], fallaciesFound: [] };
    }

    // Group by bias/fallacy type
    const biasesByName: Record<
      string,
      { count: number; confidence: number; description: string }
    > = {};
    const fallaciesByName: Record<
      string,
      { count: number; confidence: number; description: string }
    > = {};

    detections.forEach((detection) => {
      detection.detections.forEach((item) => {
        if (item.type === "bias") {
          if (!biasesByName[item.name]) {
            biasesByName[item.name] = {
              count: 0,
              confidence: 0,
              description: item.description,
            };
          }
          biasesByName[item.name].count += 1;
          biasesByName[item.name].confidence = Math.max(
            biasesByName[item.name].confidence,
            item.confidence
          );
        } else {
          if (!fallaciesByName[item.name]) {
            fallaciesByName[item.name] = {
              count: 0,
              confidence: 0,
              description: item.description,
            };
          }
          fallaciesByName[item.name].count += 1;
          fallaciesByName[item.name].confidence = Math.max(
            fallaciesByName[item.name].confidence,
            item.confidence
          );
        }
      });
    });

    // Convert to arrays sorted by count
    const biasesFound = Object.entries(biasesByName)
      .map(([name, data]) => ({
        name,
        description: data.description,
        count: data.count,
        confidence: data.confidence,
      }))
      .sort((a, b) => b.count - a.count);

    const fallaciesFound = Object.entries(fallaciesByName)
      .map(([name, data]) => ({
        name,
        description: data.description,
        count: data.count,
        confidence: data.confidence,
      }))
      .sort((a, b) => b.count - a.count);

    return { biasesFound, fallaciesFound };
  }

  /**
   * Checks if a context clue is near a matched pattern
   *
   * @param sentence - The sentence being analyzed
   * @param match - The matched pattern information
   * @param clue - The context clue to look for
   * @param windowSize - Number of words to check before and after the match
   * @returns Boolean indicating if the clue is within proximity of the match
   */
  private isClueNearMatch(
    sentence: string,
    match: IPatternMatch,
    clue: string,
    windowSize: number = 5
  ): boolean {
    const matchStart = match.index;
    const matchEnd = match.index + match.length;

    // Calculate a window around the match
    const contextStart = Math.max(0, matchStart - windowSize * 5); // Approximate 5 chars per word
    const contextEnd = Math.min(sentence.length, matchEnd + windowSize * 5);

    // Extract the context window
    const context = sentence.substring(contextStart, contextEnd).toLowerCase();

    // Check if the clue is in this context window
    return context.includes(clue.toLowerCase());
  }

  /**
   * Checks for contextual relationships between adjacent detections
   * to improve confidence scoring and reduce false positives
   */
  private analyzeContext(
    detections: ISentenceDetection[]
  ): ISentenceDetection[] {
    if (detections.length <= 1) return detections;

    const enhancedDetections = [...detections];

    // Look at adjacent sentences for reinforcing context
    for (let i = 0; i < enhancedDetections.length - 1; i++) {
      const current = enhancedDetections[i];
      const next = enhancedDetections[i + 1];

      // If the same bias/fallacy appears in consecutive sentences, increase confidence
      current.detections.forEach((currentDetection) => {
        const matchingNextDetection = next.detections.find(
          (d) =>
            d.type === currentDetection.type && d.name === currentDetection.name
        );

        if (matchingNextDetection) {
          // Boost confidence of both detections as they reinforce each other
          currentDetection.confidence = Math.min(
            0.95,
            currentDetection.confidence + 0.05
          );
          matchingNextDetection.confidence = Math.min(
            0.95,
            matchingNextDetection.confidence + 0.05
          );
        }
      });
    }

    return enhancedDetections;
  }
}

export default RuleBasedDetector;
