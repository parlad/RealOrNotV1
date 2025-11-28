import { GoogleGenAI, Type } from "@google/genai";
import { DetectionResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are a deterministic, strict Digital Forensics Expert. Your job is to classify media as "AI-Generated" or "Authentic" with high consistency.

PROTOCOL:
1.  **Scan for Fatal Flaws**: Look immediately for impossible physics, nonsensical text, extra fingers, or melted textures.
2.  **Analyze Texture**: Real photos have noise and grain. AI often has "plastic" smoothing or illogical high-frequency details.
3.  **Check Lighting**: Do shadows match the light source?
4.  **Consistency Check**: If the image is a generic landscape/object with no obvious artifacts, favor "Authentic". Only flag "AI-Generated" if there is positive evidence (artifacts), not just a "feeling".

OUTPUT RULES:
- If you find specific artifacts (e.g., warped hands), confidence should be > 80%.
- If you find no specific artifacts, verdict must be "Likely Authentic" with low confidence in AI generation (e.g., < 20%).
- **annotatedArtifacts**: You MUST provide 2D bounding boxes [ymin, xmin, ymax, xmax] (0-1000 scale) for every artifact listed.
- **description**: For every artifact, provide a short, specific sentence explaining WHY it looks fake (e.g., "Fingers blend into the coffee cup handle.").
- Do not hallucinate artifacts. If none are found, return an empty list.
`;

export const analyzeMedia = async (
  base64Data: string,
  mimeType: string
): Promise<DetectionResult> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: "Analyze this image strictly. Is it AI? List clear visual evidence with bounding boxes if yes.",
          },
        ],
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0, // CRITICAL: Zero temperature for maximum determinism
        topP: 0.95,
        topK: 40,
        seed: 42, // CRITICAL: Fixed seed to ensure same input = same output
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isLikelyAI: {
              type: Type.BOOLEAN,
              description: "True if the content is likely AI-generated, false otherwise.",
            },
            confidenceScore: {
              type: Type.NUMBER,
              description: "Confidence score between 0 and 100.",
            },
            verdict: {
              type: Type.STRING,
              description: "A short verdict title like 'Highly Likely AI-Generated' or 'Likely Authentic'.",
            },
            reasoning: {
              type: Type.STRING,
              description: "A concise paragraph explaining the main reasons for the verdict.",
            },
            artifactsFound: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of specific visual artifacts or indicators found.",
            },
            annotatedArtifacts: {
              type: Type.ARRAY,
              description: "List of visual artifacts with bounding boxes.",
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING, description: "Short label for the artifact (e.g. 'Distorted Hand')" },
                  description: { type: Type.STRING, description: "Specific explanation of the visual flaw." },
                  box_2d: { 
                    type: Type.ARRAY, 
                    items: { type: Type.NUMBER },
                    description: "Bounding box [ymin, xmin, ymax, xmax] normalized to 0-1000."
                  }
                },
                required: ["label", "description", "box_2d"]
              }
            },
            technicalAnalysis: {
              type: Type.STRING,
              description: "A deeper technical breakdown of lighting, texture, and physics consistency.",
            },
          },
          required: ["isLikelyAI", "confidenceScore", "verdict", "reasoning", "artifactsFound", "annotatedArtifacts", "technicalAnalysis"],
        },
      },
    });

    if (!response.text) {
      throw new Error("No response text received from Gemini.");
    }

    const result = JSON.parse(response.text) as DetectionResult;
    return result;
  } catch (error) {
    console.error("Analysis failed:", error);
    throw new Error("Failed to analyze the media. Please try again.");
  }
};