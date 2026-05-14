import OpenAI from 'openai';

export async function callGroq(prompt) {
    if (!process.env.GROQ_API_KEY) throw new Error("GROQ_API_KEY missing");

    // Reuse the OpenAI SDK, but point it to Groq's URL
    const groq = new OpenAI({
        apiKey: process.env.GROQ_API_KEY,
        baseURL: "https://api.groq.com/openai/v1"
    });

    const response = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant", // Fast, free LLaMA 3.1 model (replaces decommissioned llama3-8b-8192)
        messages: [{ role: "user", content: prompt }],
    });

    return response.choices[0].message.content;
}