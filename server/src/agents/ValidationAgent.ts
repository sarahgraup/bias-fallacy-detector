// // src/agents/ValidationAgent.ts
// src/agents/ValidationAgent.ts

import { ChatOpenAI } from '@langchain/openai';
import { 
  ISentenceDetection, 
  ILLMDetection, 
  IValidatedDetection 
} from '@utils/types';
import { config } from '@utils/config';

export class ValidationAgent {
  private llm: ChatOpenAI;

  constructor() {
    this.llm = new ChatOpenAI({
      modelName: config.models.primary,
      temperature: config.models.temperatures.analytical,
      maxTokens: 4000, // Increased for batch processing
    });
  }

  /**
   * Validate all detections in ONE API call (batch validation)
   * This avoids rate limits by consolidating multiple validations
   */
  async validateDetections(
    ruleBasedDetections: ISentenceDetection[],
    llmDetections: ILLMDetection[],
    fullText: string
  ): Promise<IValidatedDetection[]> {
    // Flatten rule-based detections
    const flatRuleBased = this.flattenRuleBasedDetections(ruleBasedDetections);
    
    // Flatten LLM detections
    const flatLLM = llmDetections.map(d => ({
      ...d,
      sourceDetector: 'llm' as const,
    }));

    // Combine all detections
    const allDetections = [...flatRuleBased, ...flatLLM];

    if (allDetections.length === 0) {
      return [];
    }

    console.log(`   Validating ${allDetections.length} detection(s) in batch...`);

    // ✅ VALIDATE ALL AT ONCE (1 API call instead of 10!)
    const prompt = `You are validating ${allDetections.length} potential bias/fallacy detections from an article.

FULL TEXT:
"""
${fullText}
"""

DETECTIONS TO VALIDATE:
${allDetections.map((d, i) => `
${i + 1}. **${d.name}** (${d.type})
   Sentence: "${d.sentence}"
   ${d.reasoning ? `Reasoning: ${d.reasoning}` : ''}
   ${d.quotedText ? `Quoted: "${d.quotedText}"` : ''}
   Source: ${d.sourceDetector}
   Initial Confidence: ${(d.confidence * 100).toFixed(0)}%
`).join('\n')}

TASK: For EACH detection above, determine if it's a TRUE POSITIVE or FALSE POSITIVE.

A detection is a TRUE POSITIVE if:
- It accurately represents the named bias/fallacy
- The context supports the claim
- It's not taken out of context

A detection is a FALSE POSITIVE if:
- It's a misidentification
- The pattern match is coincidental
- Context shows it's NOT actually biased

Return ONLY valid JSON (no markdown, no backticks):
{
  "validations": [
    {
      "index": 0,
      "isValid": true,
      "reasoning": "This clearly demonstrates confirmation bias because..."
    },
    {
      "index": 1,
      "isValid": false,
      "reasoning": "This is not actually ad hominem, it's a legitimate criticism of..."
    }
  ]
}`;

    try {
      const response = await this.llm.invoke(prompt);
      const content = response.content.toString()
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      const parsed = JSON.parse(content);
      
      // Map results back to detections
      const validated: IValidatedDetection[] = [];
      
      parsed.validations.forEach((v: any) => {
        if (v.isValid && allDetections[v.index]) {
          validated.push({
            ...allDetections[v.index],
            isValidated: true,
            validationReasoning: v.reasoning,
            validationScore: 0.85, // High confidence since validated by AI
          });
        }
      });

      console.log(`   ${validated.length}/${allDetections.length} detection(s) validated as true positives`);
      return validated;
      
    } catch (error) {
      console.error('Batch validation error:', error);
      
      // Fallback: return high-confidence detections without validation
      console.log('   Using fallback validation (confidence threshold)');
      return allDetections
        .filter(d => d.confidence >= 0.65)
        .map(d => ({
          ...d,
          isValidated: true,
          validationReasoning: 'Auto-validated based on high confidence (fallback)',
          validationScore: d.confidence,
        }));
    }
  }

  /**
   * Flatten rule-based detections into a flat array
   */
  private flattenRuleBasedDetections(
    detections: ISentenceDetection[]
  ): Array<any> {
    return detections.flatMap(sd =>
      sd.detections.map(d => ({
        ...d,
        sentence: sd.sentence,
        sentenceIndex: sd.sentenceIndex,
        sourceDetector: 'rule-based' as const,
        reasoning: `Pattern match: ${d.matches?.[0]?.matched || 'detected'}`,
      }))
    );
  }
}
// import { ChatOpenAI } from '@langchain/openai';
// import { config } from '@utils/config';
// import { 
//   ISentenceDetection, 
//   ILLMDetection, 
//   IValidatedDetection 
// } from '@utils/types';

// /**
//  * Takes detections from BOTH sources
// Merges them into one list
// Uses AI to validate each detection
// Filters out false positives
// Returns only validated detections
//  */
// export class ValidationAgent {
//   private llm: ChatOpenAI;

//   constructor() {
//     this.llm = new ChatOpenAI({
//       modelName: config.models.primary,
//       temperature: config.models.temperatures.analytical,
//       maxTokens: config.models.maxTokens.standard,
//     });

//   }

//   /**
//    * Merge and validate detections from both detectors
//    */
//   async validateDetections(
//     ruleBasedDetections: ISentenceDetection[], // Your existing type
//     llmDetections: ILLMDetection[],
//     fullText: string
//   ): Promise<IValidatedDetection[]> {
    
//     // Convert ISentenceDetection to flat array
//     const flatRuleBased = ruleBasedDetections.flatMap(sd =>
//       sd.detections.map(d => ({
//         ...d, // Spread IDetection fields
//         sentence: sd.sentence,
//         sentenceIndex: sd.sentenceIndex,
//         sourceDetector: 'rule-based' as const
//       }))
//     );

//     // Convert LLM detections to same format
//     const flatLLM = llmDetections.map(d => ({
//       type: d.type,
//       name: d.name,
//       description: d.description,
//       matches: [], // LLM doesn't have pattern matches
//       confidence: d.confidence,
//       sentence: d.sentence,
//       sentenceIndex: d.sentenceIndex,
//       quotedText: d.quotedText,
//       sourceDetector: 'llm' as const
//     }));

//     // Combine all
//     const allDetections = [...flatRuleBased, ...flatLLM];

//     // Validate in batches by sentence
//     const validated: IValidatedDetection[] = [];
//     const bySentence = this.groupBySentence(allDetections);

//     for (const [_, detections] of Object.entries(bySentence)) {
//       const results = await this.validateSentenceDetections(
//         detections,
//         fullText
//       );
//       validated.push(...results);
//     }

//     return validated;
//   }

//   private async validateSentenceDetections(
//     detections: any[],
//     fullText: string
//   ): Promise<IValidatedDetection[]> {
    
//     const sentence = detections[0].sentence;

//     const prompt = `Validate these bias/fallacy detections. Reduce false positives.

// SENTENCE: "${sentence}"

// DETECTIONS:
// ${detections.map((d, i) => `${i}. ${d.name} (${d.confidence.toFixed(2)} confidence)`).join('\n')}

// For each: is it valid? Adjusted confidence? Return JSON:
// {
//   "validations": [
//     {"detectionIndex": 0, "isValid": true, "adjustedConfidence": 0.82, "reasoning": "..."}
//   ]
// }`;

//     try {
//       const response = await this.llm.invoke(prompt);
//       const content = response.content.toString()
//         .replace(/```json\n?/g, '')
//         .replace(/```\n?/g, '')
//         .trim();
      
//       const parsed = JSON.parse(content);

//       return parsed.validations
//         .filter((v: any) => v.isValid)
//         .map((v: any): IValidatedDetection => {
//           const detection = detections[v.detectionIndex];
//           return {
//             ...detection,
//             confidence: v.adjustedConfidence,
//             validationScore: v.adjustedConfidence,
//             validationReasoning: v.reasoning,
//             isValidated: true
//           };
//         });
//     } catch (error) {
//       console.error('Validation error:', error);
//       // Fallback: return high-confidence detections
//       return detections
//         .filter(d => d.confidence >= 0.6)
//         .map(d => ({
//           ...d,
//           validationScore: d.confidence,
//           validationReasoning: 'Auto-validated (LLM validation failed)',
//           isValidated: false
//         }));
//     }
//   }

//   private groupBySentence(detections: any[]): Record<number, any[]> {
//     return detections.reduce((acc, d) => {
//       const idx = d.sentenceIndex || 0;
//       if (!acc[idx]) acc[idx] = [];
//       acc[idx].push(d);
//       return acc;
//     }, {});
//   }
// }
