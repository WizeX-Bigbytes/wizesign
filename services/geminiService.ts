import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';

// Initialize Gemini Client
// Note: In a production app, these calls should ideally go through a backend to protect the API key.
// For this frontend-only demo, we use the process.env.API_KEY directly.

export const generateConsentContent = async (
  procedure: string,
  patientName: string,
  doctorName: string,
  clinicName: string
): Promise<string> => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please set process.env.API_KEY.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Create a professional medical consent form for the following procedure: "${procedure}".
    
    Context:
    - Patient Name: ${patientName}
    - Doctor Name: ${doctorName}
    - Clinic/Hospital: ${clinicName}
    
    Requirements:
    - Return ONLY the body text of the consent form. Do not include placeholders like [Date] or [Signature Line] as those are handled by the UI.
    - Write in a clear, professional, yet understandable tone.
    - Structure it with Markdown headers (##) for sections like "Procedure Description", "Risks", "Benefits", "Alternatives", and "Consent Statement".
    - Ensure the "Consent Statement" is the final section and explicitly states that the patient understands the terms.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    return response.text || "Failed to generate content.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating consent form. Please try again or write manually.";
  }
};