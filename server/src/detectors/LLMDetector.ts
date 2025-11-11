import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ILLMDetection, IBiasesFallaciesData, ISentenceDetection } from "@utils/types";
import { config } from "@utils/config";

/**
 * Takes JSON config for bias definitions
Uses AI to find subtle biases
Avoids duplicating what rule-based found
Returns AI-detected biases with reasoning
 */
export class LLMDetector {
  private llm: ChatOpenAI;
  private biasesConfig: IBiasesFallaciesData;

  constructor(biasesConfig: IBiasesFallaciesData) {
    this.llm = new ChatOpenAI({
      modelName: config.models.primary,
      temperature: config.models.temperatures.analytical,
      maxTokens: config.models.maxTokens.standard,
    });
    this.biasesConfig = biasesConfig;
  }
    
  /**
   * Detect subtle biases and fallacies that pattern matching might miss
   */
  async detectSubtleBiases(
    text: string,
    sentences: string[],
    ruleBasedDetections: ISentenceDetection[]
  ): Promise<ILLMDetection[]> {
    // Create a summary of what was already found
    const alreadyDetected = ruleBasedDetections
      .flatMap(sd => sd.detections.map(d => d.name))
      .filter((v, i, a) => a.indexOf(v) === i); // unique

    // Build bias context from config
    const biasContext = this.buildBiasContext();

    const prompt = `You are an expert in rhetoric, cognitive biases, and logical fallacies.

TASK: Analyze this text for cognitive biases and logical fallacies, especially SUBTLE ones that simple pattern matching would miss.

TEXT TO ANALYZE:
"""
${text}
"""

BIAS/FALLACY REFERENCE:
${biasContext}

ALREADY DETECTED (by pattern matching):
${alreadyDetected.join(', ') || 'None'}

INSTRUCTIONS:
1. Find biases/fallacies NOT caught by pattern matching (subtle, implicit, contextual)
2. For each detection, identify:
   - The specific sentence (quote it exactly)
   - Which bias/fallacy it represents
   - WHY it's biased (your reasoning)
   - Confidence score (0.0 to 1.0)

FOCUS ON:
- Implicit assumptions that favor one perspective
- Emotionally loaded language masquerading as neutral reporting
- Cherry-picked facts or selective omission of context
- False balance or false equivalence
- Subtle appeals to emotion, authority, or popularity
- Framing techniques that manipulate perception

Return ONLY valid JSON (no markdown, no backticks):
{
  "detections": [
    {
      "sentence": "exact sentence from text",
      "sentenceIndex": 0,
      "biasOrFallacyName": "name from reference list",
      "type": "bias or fallacy",
      "quotedText": "specific problematic phrase",
      "reasoning": "why this is biased/fallacious",
      "confidence": 0.85,
      "isSubtle": true
    }
  ]
}`;

    try {
      const response = await this.llm.invoke(prompt);
      const content = response.content.toString();
      
      // Clean up potential markdown formatting
      const cleanedContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      const parsed = JSON.parse(cleanedContent);
      
      // Map to ILLMDetection type format
      return parsed.detections.map((d: any) => ({
        type: d.type,
        name: d.biasOrFallacyName,
        description: this.getDescriptionForBias(d.biasOrFallacyName),
        sentence: d.sentence,
        sentenceIndex: d.sentenceIndex,
        quotedText: d.quotedText,
        reasoning: d.reasoning,
        confidence: d.confidence,
        isSubtle: d.isSubtle
      }));
    } catch (error) {
      console.error('Error in LLM detection:', error);
      return [];
    }
  }

  /**
   * Build context about biases for the LLM
   */
  private buildBiasContext(): string {
    const biasDescriptions = this.biasesConfig.biases.map(b => 
      `- **${b.name}**: ${b.description}`
    ).join('\n');

    const fallacyDescriptions = this.biasesConfig.fallacies.map(f =>
      `- **${f.name}**: ${f.description}`
    ).join('\n');

    return `COGNITIVE BIASES:\n${biasDescriptions}\n\nLOGICAL FALLACIES:\n${fallacyDescriptions}`;
  }

  /**
   * Get description for a bias/fallacy name
   */
  private getDescriptionForBias(name: string): string {
    const bias = this.biasesConfig.biases.find(b => b.name === name);
    if (bias) return bias.description;

    const fallacy = this.biasesConfig.fallacies.find(f => f.name === name);
    if (fallacy) return fallacy.description;

    return 'Description not found';
  }

}