import OpenAI from "openai";
import { appConfig } from "@/lib/app-config";

async function generateWithGemini(prompt: string) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return {
      suggestions: [
        {
          type: "AI Not Configured",
          priority: "Low",
          title: "Gemini API key missing",
          problem: "GEMINI_API_KEY is not configured.",
          action: "Add GEMINI_API_KEY in your environment variables."
        }
      ]
    };
  }

const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        responseMimeType: "application/json"
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API failed: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{\"suggestions\":[]}";
  return JSON.parse(text);
}

async function generateWithOpenAI(prompt: string) {
  if (!process.env.OPENAI_API_KEY) {
    return {
      suggestions: [
        {
          type: "AI Not Configured",
          priority: "Low",
          title: "OpenAI API key missing",
          problem: "OPENAI_API_KEY is not configured.",
          action: "Add OPENAI_API_KEY in your environment variables."
        }
      ]
    };
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content:
          "You are an e-commerce profitability advisor. Return valid JSON only."
      },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" }
  });

  return JSON.parse(response.choices[0]?.message?.content || "{\"suggestions\":[]}");
}

export async function generateAISuggestions({
  analysis,
  plan = "FREE"
}: {
  analysis: any;
  plan?: string;
}) {
  const isPaid = plan !== "FREE";
  const language = isPaid ? appConfig.ai.paidLanguage : appConfig.ai.freeLanguage;
  const style = isPaid ? appConfig.ai.paidStyle : appConfig.ai.freeStyle;

  const prompt = JSON.stringify({
    role: "You are ProfitLens, an AI profit advisor for e-commerce businesses.",
    instruction:
      "Analyze this e-commerce profit report. Return valid JSON only in this exact shape: {\"suggestions\":[{\"type\":\"\",\"priority\":\"High|Medium|Low\",\"title\":\"\",\"problem\":\"\",\"action\":\"\"}]}",
    language,
    style,
    rules: isPaid
      ? [
          "Give advanced, specific, business-ready suggestions.",
          "Mention products, profit issues, price actions, ad-spend actions, return fixes, and promotion opportunities.",
          "Use English and Hinglish where useful."
        ]
      : [
          "Give simple suggestions only.",
          "Use English only.",
          "Keep each action short."
        ],
    analysis
  });

  const provider = process.env.AI_PROVIDER || appConfig.ai.defaultProvider;

  if (provider === "openai") {
    return generateWithOpenAI(prompt);
  }

  return generateWithGemini(prompt);
}
