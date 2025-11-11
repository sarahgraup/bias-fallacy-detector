// src/agents/FramingAnalysisAgent.ts

import { ChatOpenAI } from "@langchain/openai";
import { IArticleAnalysis, IArticleMetadata } from "../utils/types";
import { config } from "@utils/config";

/**
 * - Takes full article text
- Takes all validated detections
- Asks ai for big-picture analysis
- Returns overall assessment
 */
export class FramingAnalysisAgent {
  private llm: ChatOpenAI;

  constructor() {
    this.llm = new ChatOpenAI({
        modelName: config.models.primary,
          temperature: config.models.temperatures.analytical,
          maxTokens: config.models.maxTokens.standard,
    });
  }

  /**
   * Analyze overall article framing, bias, and intent
   */
  async analyzeArticleFraming(
    fullText: string,
    metadata: IArticleMetadata | undefined,
    detections: any[]
  ): Promise<IArticleAnalysis> {
    // Summarize detections for context
    const detectionSummary = this.summarizeDetections(detections);

    const prompt = `You are analyzing a news article for bias, framing, and manipulation techniques.

ARTICLE METADATA:
${
  metadata
    ? `
Title: ${metadata.title || "Unknown"}
Source: ${metadata.source || "Unknown"}
Author: ${metadata.author || "Unknown"}
Date: ${metadata.publishDate || "Unknown"}
`
    : "No metadata available"
}

ARTICLE TEXT:
"""
${fullText}
"""

DETECTED BIASES/FALLACIES:
${detectionSummary}

ANALYSIS REQUIRED:

1. OVERALL TONE (choose one):
   - neutral: Balanced, factual reporting
   - left-leaning: Favors progressive/liberal perspectives
   - right-leaning: Favors conservative perspectives
   - heavily-biased: Strong advocacy, not journalism

2. PRIMARY INTENT:
   - What is the author trying to convince you of?
   - Is this informing, persuading, or manipulating?

3. CREDIBILITY SCORE (0-10):
   - 10 = Highly credible, balanced, fact-based
   - 5 = Mixed credibility, some bias evident
   - 0 = Not credible, propaganda-level manipulation

4. MANIPULATION TECHNIQUES:
   - List specific rhetorical tricks used
   - Examples: fear-mongering, appeals to emotion, loaded language, false balance, etc.

5. OMITTED PERSPECTIVES:
   - What important viewpoints or context are missing?
   - What questions aren't being asked?

6. EMOTIONAL LANGUAGE ANALYSIS:
   - List fear words: (words that trigger anxiety/fear)
   - List outrage triggers: (words that provoke anger)
   - List loaded terms: (emotionally charged but presented as neutral)
   - Overall emotional intensity: (0.0-1.0, where 1.0 is highly emotional)

7. SOURCE CREDIBILITY:
   - What sources are cited?
   - Are they credible, balanced, anonymous, partisan?
   - Source balance score: (0.0-1.0, where 1.0 is perfectly balanced)
   - List any concerns about sources

8. FRAMING CATEGORY:
   Choose the dominant framing technique:
   - hero_villain_framing
   - us_vs_them
   - fear_mongering
   - outrage_bait
   - sympathy_exploitation
   - oversimplification
   - false_balance
   - neutral_reporting

Return ONLY valid JSON:
{
  "overallTone": "neutral|left-leaning|right-leaning|heavily-biased",
  "confidenceInTone": 0.85,
  "primaryIntent": "description of what author wants you to believe",
  "credibilityScore": 7,
  "manipulationTechniques": ["technique1", "technique2"],
  "omittedPerspectives": ["perspective1", "perspective2"],
  "framingCategory": "category",
  "emotionalLanguage": {
    "fearWords": ["word1", "word2"],
    "outrageTriggers": ["word1", "word2"],
    "loadedTerms": ["term1", "term2"],
    "overallEmotionalIntensity": 0.6
  },
  "sourceCredibility": {
    "sourcesListed": ["source1", "source2"],
    "sourceTypes": ["expert", "anonymous", "partisan", "primary"],
    "balanceScore": 0.7,
    "concerns": ["concern1", "concern2"]
  }
}`;

    try {
      const response = await this.llm.invoke(prompt);
      const content = response.content
        .toString()
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      const parsed = JSON.parse(content);

      return parsed as IArticleAnalysis;
    } catch (error) {
      console.error("Error in framing analysis:", error);

      // Return default analysis
      return {
        overallTone: "neutral",
        confidenceInTone: 0.5,
        primaryIntent: "Unable to determine",
        credibilityScore: 5,
        manipulationTechniques: [],
        omittedPerspectives: [],
        framingCategory: "neutral_reporting",
        emotionalLanguage: {
          fearWords: [],
          outrageTriggers: [],
          loadedTerms: [],
          overallEmotionalIntensity: 0.5,
        },
        sourceCredibility: {
          sourcesListed: [],
          sourceTypes: [],
          balanceScore: 0.5,
          concerns: [],
        },
      };
    }
  }

  /**
   * Summarize detections for the analysis prompt
   */
  private summarizeDetections(detections: any[]): string {
    if (detections.length === 0) return "No biases or fallacies detected.";

    const counts: Record<string, number> = {};
    detections.forEach((d) => {
      counts[d.name] = (counts[d.name] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => `- ${name}: ${count} instance(s)`)
      .join("\n");
  }
}
