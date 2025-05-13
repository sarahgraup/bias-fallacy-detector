/**
 * Defines the possible types of cognitive patterns that can be detected
 */
export type TCognitivePatternType = "bias" | "fallacy";

/**
 * Base interface for a bias or fallacy definition
 */
export interface IBiasOrFallacy {
  name: string;
  description: string;
  examples: string[];
  patterns: string[];
  context_clues: string[];
}

/**
 * Interface for a bias or fallacy with compiled regular expressions
 */
export interface ICompiledBiasOrFallacy extends IBiasOrFallacy {
  compiledPatterns: RegExp[];
}


/**
 * Interface for the configuration data containing biases and fallacies
 */
export interface IBiasesFallaciesData {
  biases: IBiasOrFallacy[];
  fallacies: IBiasOrFallacy[];
}

/**
 * Interface for the internal compiled data structure
 */
export interface CompiledData {
  biases: ICompiledBiasOrFallacy[];
  fallacies: ICompiledBiasOrFallacy[];
}

// Types for pattern matching
export interface IPatternMatch {
  pattern: string;
  matched: string;
  index: number;
  length: number;
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
    All = 'all',
    Biases = 'biases',
    Fallacies = 'fallacies'
}

export enum ECognitivePatternType {
  Bias = "bias",
  Fallacy = "fallacy",
}