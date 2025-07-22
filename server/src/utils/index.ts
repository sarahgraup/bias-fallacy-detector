/**
 * Defines the possible types of cognitive patterns that can be detected
 */
export type TCognitivePatternType = "bias" | "fallacy";

/**
 * Interface for pattern with weight and description
 */
export interface IPatternWithWeight {
  regex: string;
  weight: number;
  description: string;
}

/**
 * Interface for example with explanation
 */
export interface IExampleWithExplanation {
  text: string;
  explanation: string;
}

/**
 * Interface for exclusion patterns
 */
export interface IExclusion {
  pattern: string;
  reason: string;
}

/**
 * Interface for context clues with positive and negative categories
 */
export interface IContextClues {
  positive?: string[];
  negative?: string[];
}

/**
 * Interface for global confidence modifiers
 */
export interface IGlobalConfidenceModifiers {
  high_confidence_terms?: string[];
  negation_terms?: string[];
  uncertainty_terms?: string[];
  hedging_terms?: string[];
}

/**
 * Interface for bias-specific confidence modifiers
 */
export interface IBiasSpecificConfidenceModifiers {
  bias_specific_terms?: string[];
  high_confidence_terms?: string[];
  negation_terms?: string[];
  uncertainty_terms?: string[];
}

/**
 * Base interface for a bias or fallacy definition
 */
export interface IBiasOrFallacy {
  name: string;
  description: string;
  examples: IExampleWithExplanation[];
  patterns: IPatternWithWeight[];
  context_clues?: IContextClues;
  confidence_modifiers?: IBiasSpecificConfidenceModifiers;
  exclusions?: IExclusion[];
}

/**
 * Interface for compiled pattern with weight and description
 */
export interface ICompiledPattern {
  regex: RegExp;
  weight: number;
  description: string;
}

/**
 * Interface for a bias or fallacy with compiled regular expressions
 */
export interface ICompiledBiasOrFallacy
  extends Omit<IBiasOrFallacy, "patterns"> {
  patterns: IPatternWithWeight[]; // Keep original patterns for reference
  compiledPatterns: ICompiledPattern[];
}

/**
 * Interface for the configuration data containing biases and fallacies
 */
export interface IBiasesFallaciesData {
  global_confidence_modifiers?: IGlobalConfidenceModifiers;
  biases: IBiasOrFallacy[];
  fallacies: IBiasOrFallacy[];
}

/**
 * Interface for the internal compiled data structure
 */
export interface ICompiledData {
  biases: ICompiledBiasOrFallacy[];
  fallacies: ICompiledBiasOrFallacy[];
}

// Types for pattern matching
export interface IPatternMatch {
  pattern: string;
  matched: string;
  index: number;
  length: number;
  weight?: number; // Add weight to track which pattern matched
}

// represents detected cognitive pattern (bias or fallacy)
export interface IDetection {
  type: "bias" | "fallacy";
  name: string;
  description: string;
  matches: IPatternMatch[];
  confidence: number;
}

/**
 * Represents a sentence with detected cognitive patterns
 */
export interface ISentenceDetection {
  sentence: string;
  sentenceIndex: number;
  detections: IDetection[];
}

/**
 * Types of detection filters
 */
export type TDetectionFilter = "all" | "biases" | "fallacies";

/**
 * Summary of detected biases or fallacies
 */
export interface IPatternSummary {
  name: string;
  description: string;
  count: number;
  confidence: number;
}

/**
 * Complete analysis summary
 */
export interface IAnalysisSummary {
  biasesFound: IPatternSummary[];
  fallaciesFound: IPatternSummary[];
}

/**
 * Enum for different detection filter types
 */
export enum EDetectionFilter {
  All = "all",
  Biases = "biases",
  Fallacies = "fallacies",
}

export enum ECognitivePatternType {
  Bias = "bias",
  Fallacy = "fallacy",
}
// /**
//  * Defines the possible types of cognitive patterns that can be detected
//  */
// export type TCognitivePatternType = 'bias' | 'fallacy';

// export interface IConfidenceModifiers {
//   highConfidenceTerms?: string[];
//   negationTerms?: string[];
// }

// /**
//  * Base interface for a bias or fallacy definition
//  */
// export interface IBiasOrFallacy {
//   name: string;
//   description: string;
//   examples: string[];
//   patterns: string[];
//   contextClues: string[];
//   confidenceModifiers?: IConfidenceModifiers;

// }

// /**
//  * Interface for a bias or fallacy with compiled regular expressions
//  */
// export interface ICompiledBiasOrFallacy extends IBiasOrFallacy {
//   compiledPatterns: RegExp[];
// }

// /**
//  * Interface for the configuration data containing biases and fallacies
//  */
// export interface IBiasesFallaciesData {
//   biases: IBiasOrFallacy[];
//   fallacies: IBiasOrFallacy[];
// }

// /**
//  * Interface for the internal compiled data structure
//  */
// export interface CompiledData {
//   biases: ICompiledBiasOrFallacy[];
//   fallacies: ICompiledBiasOrFallacy[];
// }

// // Types for pattern matching
// export interface IPatternMatch {
//   pattern: string;
//   matched: string;
//   index: number;
//   length: number;
// }

// // represents detected cognitive pattern (bias or fallacy)
// export interface IDetection {
//   type: 'bias' | 'fallacy';
//   name: string;
//   description: string;
//   matches: IPatternMatch[];
//   confidence: number;
// }

// /**
//  * Represents a sentence with detected cognitive patterns
//  */
// export interface ISentenceDetection {
//   sentence: string;
//   sentenceIndex: number;
//   detections: IDetection[];
// }

// /**
//  * Types of detection filters
//  */
// export type TDetectionFilter = 'all' | 'biases' | 'fallacies';

// /**
//  * Summary of detected biases or fallacies
//  */
// export interface IPatternSummary {
//   name: string;
//   description: string;
//   count: number;
//   confidence: number;
// }

// /**
//  * Complete analysis summary
//  */
// export interface IAnalysisSummary {
//   biasesFound: IPatternSummary[];
//   fallaciesFound: IPatternSummary[];
// }

// /**
//  * Enum for different detection filter types
//  */
// export enum EDetectionFilter {
//     All = 'all',
//     Biases = 'biases',
//     Fallacies = 'fallacies'
// }

// export enum ECognitivePatternType {
//   Bias = 'bias',
//   Fallacy = 'fallacy',
// }
