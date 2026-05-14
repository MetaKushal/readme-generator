import { GoogleGenAI } from '@google/genai';

export async function callGemini(prompt) {
    if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY missing");

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    return response.text;
}