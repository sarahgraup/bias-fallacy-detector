// src/workflows/BiasDetectionWorkflow.ts

import { StateGraph, START, END } from "@langchain/langgraph";
import { IBiasAnalysisState, IBiasesFallaciesData } from "@utils/types";
import RuleBasedDetector from "@detectors/RuleBasedDetector";
import { LLMDetector } from "@detectors/LLMDetector";
import { ValidationAgent } from "@agents/ValidationAgent";
import { ExplanationAgent } from "@agents/ExplanationAgent";
import { FramingAnalysisAgent } from "@agents/FramingAnalysisAgent";
import TextTokenizer from "@utils/TextTokenizer";
import { TextCleaner } from "@utils/TextCleaner";

/**
 * Node name constants for type safety
 */
const NODES = {
  PRE_PROCESS: "preprocess",
  RULE_BASED_DETECTION: "ruleBasedDetection",
  LLM_DETECTION: "llmDetection",
  VALIDATION: "validation",
  ANALYZE_FRAMING: "analyzeFraming",
  GENERATE_EXPLANATIONS: "generateExplanations",
  FORMAT_OUTPUT: "formatOutput",
    CONTENT_WRITER: "contentWriter",
  
} as const;

export class BiasDetectionWorkflow {
  private workflow: any;
  private biasesConfig: IBiasesFallaciesData; //stores json

  constructor(biasesConfig: IBiasesFallaciesData) {
    this.biasesConfig = biasesConfig;
    this.buildWorkflow(); //builds langgraph
  }

  /**
   * Build the LangGraph workflow
   */
  private buildWorkflow() {
    // Define the state channels
    const graphBuilder = new StateGraph<IBiasAnalysisState>({
      channels: {
        rawText: null,
        metadata: null,
        cleanedText: null,
        sentences: null,
        ruleBasedDetections: null,
        llmDetections: null,
        validatedDetections: null,
        explanations: null,
        articleAnalysis: null,
        output: null,
      },
    });

    // Add nodes
    graphBuilder.addNode("preprocess", this.preprocessNode.bind(this));
    graphBuilder.addNode(
      "ruleBasedDetection",
      this.ruleBasedDetectionNode.bind(this)
    );
    graphBuilder.addNode("llmDetection", this.llmDetectionNode.bind(this));
    graphBuilder.addNode("validation", this.validationNode.bind(this));
    graphBuilder.addNode(
      "generateExplanations",
      this.explanationNode.bind(this)
    );
    graphBuilder.addNode("analyzeFraming", this.framingAnalysisNode.bind(this));
    graphBuilder.addNode("formatOutput", this.formatOutputNode.bind(this));

    // Define edges (workflow)
    graphBuilder.addEdge(START, NODES.PRE_PROCESS as any);
    graphBuilder.addEdge(
      NODES.PRE_PROCESS as any,
      NODES.RULE_BASED_DETECTION as any
    );
    graphBuilder.addEdge(NODES.PRE_PROCESS as any, NODES.LLM_DETECTION as any);
    graphBuilder.addEdge(
      NODES.RULE_BASED_DETECTION as any,
      NODES.VALIDATION as any
    );
    graphBuilder.addEdge(NODES.LLM_DETECTION as any, NODES.VALIDATION as any);
    graphBuilder.addEdge(
      NODES.VALIDATION as any,
      NODES.GENERATE_EXPLANATIONS as any
    );
    graphBuilder.addEdge(
      NODES.GENERATE_EXPLANATIONS as any,
      NODES.ANALYZE_FRAMING as any
    );
    graphBuilder.addEdge(
      NODES.ANALYZE_FRAMING as any,
      NODES.FORMAT_OUTPUT as any
    );
    graphBuilder.addEdge(NODES.FORMAT_OUTPUT as any, END);

    // Compile the workflow
    this.workflow = graphBuilder.compile();
  }

  /**
   * entry point
   */
  async analyze(rawText: string, metadata?: any): Promise<any> {
    console.log("🚀 Starting bias detection workflow...\n");

    const initialState: IBiasAnalysisState = {
      rawText,
      metadata,
      cleanedText: "",
      sentences: [],
      ruleBasedDetections: [],
      llmDetections: [],
      validatedDetections: [],
      explanations: new Map(),
      articleAnalysis: {} as any,
      output: {} as any,
    };

    //execute workflow
    const result = await this.workflow.invoke(initialState);

    console.log("\n✨ Analysis complete!\n");

    return result.output;
  }

  /**
   * NODE 1: Preprocess text
   */
  private async preprocessNode(
    state: IBiasAnalysisState
  ): Promise<Partial<IBiasAnalysisState>> {
    console.log("📝 Preprocessing text...");

    const cleaner = new TextCleaner({
      removeUrls: false, // Keep URLs for context
      removePunctuation: false,
      lowercase: false, // Keep original casing for analysis
    });

    const tokenizer = new TextTokenizer();

    const cleanedText = cleaner.clean(state.rawText);
    const sentences = tokenizer.splitIntoSentences(state.rawText);

    return {
      cleanedText,
      sentences,
    };
  }

  /**
   * NODE 2: Rule-based detection (fast pattern matching)
   */
  private async ruleBasedDetectionNode(
    state: IBiasAnalysisState
  ): Promise<Partial<IBiasAnalysisState>> {
    console.log("🔍 Running rule-based detection...");

    //pass json config to rulebaseddetector
    const detector = new RuleBasedDetector(this.biasesConfig);
    const tokenizer = new TextTokenizer();

    const detections = detector.detectInText(state.rawText, tokenizer);

    console.log(
      `   Found ${detections.length} sentence(s) with potential biases/fallacies`
    );

    return {
      ruleBasedDetections: detections,
    };
  }

  /**
   * NODE 3: LLM detection (deep contextual analysis)
   */
  private async llmDetectionNode(
    state: IBiasAnalysisState
  ): Promise<Partial<IBiasAnalysisState>> {
    console.log("🤖 Running LLM deep analysis...");

    const llmDetector = new LLMDetector(this.biasesConfig);

    const llmDetections = await llmDetector.detectSubtleBiases(
      state.rawText,
      state.sentences || [],
      state.ruleBasedDetections || []
    );

    console.log(`   Found ${llmDetections.length} additional subtle bias(es)`);

    return {
      llmDetections,
    };
  }

  /**
   * NODE 4: Validation (cross-validate both approaches)
   */
  private async validationNode(
    state: IBiasAnalysisState
  ): Promise<Partial<IBiasAnalysisState>> {
    console.log("✅ Validating detections...");

    const validator = new ValidationAgent();

    const validatedDetections = await validator.validateDetections(
      state.ruleBasedDetections || [],
      state.llmDetections || [],
      state.rawText
    );

    console.log(`   ${validatedDetections.length} detection(s) validated`);

    return {
      validatedDetections,
    };
  }

  /**
   * NODE 5: Generate explanations
   */
  private async explanationNode(
    state: IBiasAnalysisState
  ): Promise<Partial<IBiasAnalysisState>> {
    console.log("💡 Generating explanations...");

    const explanationAgent = new ExplanationAgent(this.biasesConfig);

    const explanations = await explanationAgent.generateExplanations(
      state.validatedDetections || []
    );

    console.log(`   Generated ${explanations.size} explanation(s)`);

    return {
      explanations,
    };
  }

  /**
   * NODE 6: Analyze article framing
   */
  private async framingAnalysisNode(
    state: IBiasAnalysisState
  ): Promise<Partial<IBiasAnalysisState>> {
    console.log("📊 Analyzing article framing...");

    const framingAgent = new FramingAnalysisAgent();

    const articleAnalysis = await framingAgent.analyzeArticleFraming(
      state.rawText,
      state.metadata,
      state.validatedDetections || []
    );

    console.log(`   Overall tone: ${articleAnalysis.overallTone}`);
    console.log(`   Credibility score: ${articleAnalysis.credibilityScore}/10`);

    return {
      articleAnalysis,
    };
  }

  /**
   * NODE 7: Format final output
   */
  private async formatOutputNode(
    state: IBiasAnalysisState
  ): Promise<Partial<IBiasAnalysisState>> {
    console.log("📦 Formatting output...");

    // Create highlighted segments
    const highlightedText = this.createHighlightedSegments(
      state.rawText,
      state.validatedDetections || []
    );

    // Generate summary
    const summary = this.generateSummary(state);

    // Convert explanations Map to array
    const explanationsArray = Array.from(state.explanations?.values() || []);

    return {
      output: {
        detections: state.validatedDetections || [],
        explanations: explanationsArray,
        articleAnalysis: state.articleAnalysis!,
        highlightedText,
        summary,
      },
    };
  }

  /**
   * Create highlighted text segments with detection info
   */
  private createHighlightedSegments(text: string, detections: any[]): any[] {
    const segments: any[] = [];

    detections.forEach((detection) => {
      const sentence = detection.sentence;
      const sentenceIndex = text.indexOf(sentence);

      if (sentenceIndex !== -1) {
        // Determine severity based on confidence and type
        let severity: "low" | "medium" | "high" = "low";
        if (detection.confidence >= 0.8) severity = "high";
        else if (detection.confidence >= 0.6) severity = "medium";

        segments.push({
          text: sentence,
          startIndex: sentenceIndex,
          endIndex: sentenceIndex + sentence.length,
          detections: [detection],
          severity,
        });
      }
    });

    return segments.sort((a, b) => a.startIndex - b.startIndex);
  }

  /**
   * Generate executive summary
   */
  private generateSummary(state: IBiasAnalysisState): string {
    const detectionCount = state.validatedDetections?.length || 0;
    const tone = state.articleAnalysis?.overallTone || "unknown";
    const credibility = state.articleAnalysis?.credibilityScore || 0;

    const biasCount =
      state.validatedDetections?.filter((d) => d.type === "bias").length || 0;
    const fallacyCount =
      state.validatedDetections?.filter((d) => d.type === "fallacy").length ||
      0;

    return (
      `This article shows ${tone} framing with a credibility score of ${credibility}/10. ` +
      `Analysis detected ${detectionCount} instance(s) of bias or fallacy: ` +
      `${biasCount} cognitive bias(es) and ${fallacyCount} logical fallacy(ies). ` +
      `${
        state.articleAnalysis?.primaryIntent
          ? `Primary intent: ${state.articleAnalysis.primaryIntent}`
          : ""
      }`
    );
  }
}
