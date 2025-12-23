
import { GoogleGenAI, Type } from "@google/genai";
import { DetectionResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are an AI Content Analyst. Your goal is to help users understand if a piece of media (image or video) was likely created by generative AI or if it appears to be a real, authentic capture.

GUIDELINES:
1. **Look for AI Artifacts**: Scan for common generative patterns like warped anatomy, impossible textures, lighting inconsistencies, or "perfect" smoothing.
2. **Be Objective**: Real photos have imperfections, grain, and consistent physics. AI often fails at complex fine details like text or intricate backgrounds.
3. **Be Helpful**: Explain your findings clearly. If you are unsure, explain why.
4. **Visual Cues**: Provide bounding boxes [ymin, xmin, ymax, xmax] (0-1000 scale) for specific visual indicators of AI generation.
5. **Human-Readable Title**: Generate a very short (3-5 words) descriptive title of what is shown in the media (e.g., "A green tree in a field", "Person working on laptop", "Portrait of a golden retriever").

OUTPUT RULES:
- Provide a confidence score (0-100) reflecting how likely the content is AI-generated.
- If no artifacts are found, return an empty list of annotatedArtifacts.
- Keep the technical analysis easy to understand for everyday users.
`;

export const analyzeMedia = async (
  base64Data: string,
  mimeType: string
): Promise<DetectionResult> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: "Examine this media carefully. Provide a descriptive 3-5 word title for it and determine if it looks AI-generated.",
          },
        ],
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isLikelyAI: {
              type: Type.BOOLEAN,
              description: "True if the content is likely AI-generated.",
            },
            confidenceScore: {
              type: Type.NUMBER,
              description: "Confidence score between 0 and 100.",
            },
            suggestedTitle: {
              type: Type.STRING,
              description: "A short descriptive title for the image/video content.",
            },
            verdict: {
              type: Type.STRING,
              description: "A short result title like 'Likely AI' or 'Appears Real'.",
            },
            reasoning: {
              type: Type.STRING,
              description: "A simple explanation of the result.",
            },
            artifactsFound: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of visual patterns noticed.",
            },
            annotatedArtifacts: {
              type: Type.ARRAY,
              description: "List of visual markers with bounding boxes.",
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING, description: "Short label (e.g. 'Warped Texture')" },
                  description: { type: Type.STRING, description: "Why this looks like AI." },
                  box_2d: { 
                    type: Type.ARRAY, 
                    items: { type: Type.NUMBER },
                    description: "Bounding box [ymin, xmin, ymax, xmax]."
                  }
                },
                required: ["label", "description", "box_2d"]
              }
            },
            technicalAnalysis: {
              type: Type.STRING,
              description: "A brief breakdown of lighting and details.",
            },
          },
          required: ["isLikelyAI", "confidenceScore", "suggestedTitle", "verdict", "reasoning", "artifactsFound", "annotatedArtifacts", "technicalAnalysis"],
        },
      },
    });

    if (!response.text) {
      throw new Error("No response received.");
    }

    return JSON.parse(response.text) as DetectionResult;
  } catch (error) {
    console.error("Analysis failed:", error);
    throw new Error("Could not complete the check. Please try again.");
  }
};
