import { GoogleGenAI, Type } from "@google/genai";
import { AIDetectionResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function detectDiseaseFromImage(base64Image: string): Promise<AIDetectionResult> {
  const prompt = `Analyze this image of a chicken or its feces. 
    Identify potential avian diseases based on visual symptoms.
    Focus on common diseases like Newcastle, Coccidiosis, Gumboro, Fowl Typhoid.
    Return the analysis in French.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: prompt },
            { inlineData: { mimeType: "image/jpeg", data: base64Image } }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            diseaseName: { type: Type.STRING },
            severity: { type: Type.STRING, enum: ['low', 'medium', 'high', 'critical'] },
            confidence: { type: Type.NUMBER },
            advice: { type: Type.STRING },
            medications: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['diseaseName', 'severity', 'confidence', 'advice', 'medications']
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return result as AIDetectionResult;
  } catch (error) {
    console.error("AI Detection Error:", error);
    throw new Error("Erreur lors de l'analyse IA. Veuillez réessayer.");
  }
}
