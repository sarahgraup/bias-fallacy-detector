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

// NEW TYPES FOR LANGGRAPH WORKFLOW


/**
 * Article metadata extracted from URL or provided by user
 */
export interface IArticleMetadata {
  title?: string;
  author?: string;
  source?: string;
  publishDate?: string;
  url?: string;
}

/**
 * Detection made by LLM (extends base IDetection with LLM-specific fields)
 */
export interface ILLMDetection {
  type: TCognitivePatternType;
  name: string;
  description: string;
  sentence: string;
  sentenceIndex: number;
  quotedText: string; // The specific problematic phrase
  reasoning: string; // LLM's explanation of why this is biased
  confidence: number;
  isSubtle: boolean; // True if rule-based detector missed it
}

/**
 * Validated detection that combines rule-based and LLM results
 * Extends IDetection with validation metadata
 */
export interface IValidatedDetection extends IDetection {
  sentence: string;
  sentenceIndex: number;
  validationScore: number; // Confidence after validation (0.0-1.0)
  validationReasoning: string; // Why this was validated/adjusted
  isValidated: boolean; // True if LLM validated it
  sourceDetector: 'rule-based' | 'llm' | 'both'; // Where it came from
  quotedText?: string; // For LLM detections
}

/**
 * Human-friendly explanation of a bias/fallacy
 */
export interface IExplanation {
  biasOrFallacyName: string;
  simpleExplanation: string; // ELI5 explanation
  whyProblematic: string; // Why this is dangerous/manipulative
  inContext: string; // How it appears in this specific example
  alternativeFraming?: string; // How to express this more neutrally
}

/**
 * Analysis of emotional language in the article
 */
export interface IEmotionalLanguageAnalysis {
  fearWords: string[]; // Words that trigger fear/anxiety
  outrageTriggers: string[]; // Words that provoke anger
  loadedTerms: string[]; // Emotionally charged but presented as neutral
  overallEmotionalIntensity: number; // 0.0-1.0
}

/**
 * Analysis of source credibility
 */
export interface ISourceCredibility {
  sourcesListed: string[]; // What sources are cited
  sourceTypes: ('expert' | 'anonymous' | 'partisan' | 'primary')[]; // Types of sources
  balanceScore: number; // 0.0-1.0, where 1.0 is perfectly balanced
  concerns: string[]; // Issues with sources (e.g., "Only cites partisan sources")
}

/**
 * Overall article framing and bias analysis
 */
export interface IArticleAnalysis {
  overallTone: 'neutral' | 'left-leaning' | 'right-leaning' | 'heavily-biased';
  confidenceInTone: number; // 0.0-1.0
  primaryIntent: string; // What the author wants you to believe
  credibilityScore: number; // 0-10
  manipulationTechniques: string[]; // Rhetorical tricks used
  omittedPerspectives: string[]; // What viewpoints are missing
  framingCategory: string; // hero_villain_framing, us_vs_them, etc.
  emotionalLanguage: IEmotionalLanguageAnalysis;
  sourceCredibility: ISourceCredibility;
}

/**
 * Highlighted text segment with detection information
 */
export interface IHighlightedSegment {
  text: string;
  startIndex: number;
  endIndex: number;
  detections: IValidatedDetection[]; // All detections in this segment
  severity: 'low' | 'medium' | 'high'; // Based on confidence scores
}

/**
 * Final output of the bias detection workflow
 */
export interface IFinalOutput {
  detections: IValidatedDetection[]; // All validated detections
  explanations: IExplanation[]; // Human-friendly explanations
  articleAnalysis: IArticleAnalysis; // Overall article assessment
  highlightedText: IHighlightedSegment[]; // Text segments with annotations
  summary: string; // Executive summary
}

/**
 * LangGraph workflow state
 * This tracks all data as it flows through the workflow nodes
 */
export interface IBiasAnalysisState {
  // Input
  rawText: string;
  metadata?: IArticleMetadata;
  
  // Preprocessing results
  cleanedText: string;
  sentences: string[];
  
  // Detection results
  ruleBasedDetections: ISentenceDetection[]; // Your existing detector output
  llmDetections: ILLMDetection[]; // LLM-detected biases
  
  // Validation results
  validatedDetections: IValidatedDetection[]; // Merged and validated
  
  // Explanation results
  explanations: Map<string, IExplanation>; // Explanations by bias name
  
  // Article-level analysis
  articleAnalysis: IArticleAnalysis;
  
  // Final output
  output: IFinalOutput;
}

// HELPER TYPES

/**
 * Options for text cleaning
 */
export interface ITextCleanerOptions {
  removeUrls?: boolean;
  removePunctuation?: boolean;
  lowercase?: boolean;
}

/**
 * Options for text tokenization
 */
export interface ITextTokenizerOptions {
  language?: string;
}

/**
 * Input format for the bias detector API
 */
export interface IBiasDetectorInput {
  text?: string; // Direct text input
  url?: string; // URL to scrape
  file?: Buffer; // Uploaded file
  fileType?: string; // MIME type
  metadata?: IArticleMetadata; // Optional metadata
}

/**
 * Response format for the bias detector API
 */
export interface IBiasDetectorResponse {
  success: boolean;
  data?: IFinalOutput;
  error?: string;
  processingTime?: number; // ms
}