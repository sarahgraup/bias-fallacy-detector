// src/agents/ExplanationAgent.ts

import { ChatOpenAI } from "@langchain/openai";
import {
  IExplanation,
  IValidatedDetection,
  IBiasesFallaciesData,
} from "../utils/types";
import { config } from "@utils/config";

/**
 * Takes validated detections
For each unique bias, generates explanation
Uses bias descriptions from JSON
Returns Map of explanations
 */
export class ExplanationAgent {
  private llm: ChatOpenAI;
  private biasesConfig: IBiasesFallaciesData;

  constructor(biasesConfig: IBiasesFallaciesData) {
    this.llm = new ChatOpenAI({
        modelName: config.models.primary,
        temperature: config.models.temperatures.balanced,
        maxTokens: config.models.maxTokens.standard,
    });
    this.biasesConfig = biasesConfig;
  }

  /**
   * Generate human-friendly explanations for each detected bias/fallacy
   */
  async generateExplanations(
    detections: IValidatedDetection[]
  ): Promise<Map<string, IExplanation>> {
    const explanations = new Map<string, IExplanation>();

    // Group detections by bias/fallacy name to avoid duplicate explanations
    const uniqueBiases = Array.from(new Set(detections.map((d) => d.name)));

    for (const biasName of uniqueBiases) {
      // Get all detections of this bias type
      const biasDetections = detections.filter((d) => d.name === biasName);

      // Get the highest confidence example
      const bestExample = biasDetections.reduce((best, current) =>
        current.confidence > best.confidence ? current : best
      );

      const explanation = await this.explainBias(biasName, bestExample);
      explanations.set(biasName, explanation);
    }

    return explanations;
  }

  /**
   * Generate explanation for a specific bias with real-world context
   */
  private async explainBias(
    biasName: string,
    example: IValidatedDetection
  ): Promise<IExplanation> {
    // Get config information about this bias
    const biasConfig = this.getBiasConfig(biasName);

    const prompt = `Explain this cognitive bias/logical fallacy in simple, accessible language.

BIAS/FALLACY: ${biasName}
DEFINITION: ${biasConfig?.description || "No definition available"}

REAL EXAMPLE FROM TEXT:
Sentence: "${example.sentence}"
Problematic phrase: "${
      example.matches?.[0]?.matched || example.quotedText || ""
    }"

Create an explanation with 3 parts:

1. SIMPLE EXPLANATION (1-2 sentences, ELI5 style)
   - What is this bias in plain English?
   
2. WHY IT'S PROBLEMATIC (1-2 sentences)
   - What's the danger or manipulation happening?
   
3. IN THIS CONTEXT (2-3 sentences)
   - How does it appear in THIS specific example?
   - Why is THIS specific usage biased/fallacious?

4. ALTERNATIVE FRAMING (optional, 1-2 sentences)
   - How could this be expressed more neutrally?

Return ONLY valid JSON:
{
  "simpleExplanation": "...",
  "whyProblematic": "...",
  "inContext": "...",
  "alternativeFraming": "..."
}`;

    try {
      const response = await this.llm.invoke(prompt);
      const content = response.content
        .toString()
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      const parsed = JSON.parse(content);

      return {
        biasOrFallacyName: biasName,
        simpleExplanation: parsed.simpleExplanation,
        whyProblematic: parsed.whyProblematic,
        inContext: parsed.inContext,
        alternativeFraming: parsed.alternativeFraming,
      };
    } catch (error) {
      console.error(`Error generating explanation for ${biasName}:`, error);

      // Fallback to basic explanation
      return {
        biasOrFallacyName: biasName,
        simpleExplanation:
          biasConfig?.description || "A cognitive bias was detected.",
        whyProblematic:
          "This can lead to distorted reasoning and manipulation.",
        inContext: `This bias appears in: "${example.sentence}"`,
        alternativeFraming: undefined,
      };
    }
  }

  /**
   * Get bias configuration
   */
  private getBiasConfig(name: string) {
    return (
      this.biasesConfig.biases.find((b) => b.name === name) ||
      this.biasesConfig.fallacies.find((f) => f.name === name)
    );
  }
}
