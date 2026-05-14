import { CohereClient } from 'cohere-ai';

export async function callCohere(prompt) {
    if (!process.env.COHERE_API_KEY) throw new Error("COHERE_API_KEY missing");

    const cohere = new CohereClient({
        token: process.env.COHERE_API_KEY,
    });

    const response = await cohere.chat({
        message: prompt,
        model: "command-r-plus-08-2024", // command-r was removed Sept 2025; using command-r-plus-08-2024
    });

    return response.text;
}