import { env } from "../../config/env.js";
import knowledgeBase from "../../data/knowledge-base.json" with { type: "json" };

interface KnowledgeBaseEntry {
  category: string;
  question: string;
  answer: string;
  keywords: string[];
}

interface GeminiModel {
  name: string;
  supportedGenerationMethods?: string[];
}

export interface TextQueryResult {
  content: string;
  confidence: number;
  modelUsed: string;
  source: "knowledge_base" | "gemini" | "fallback";
}

let resolvedGeminiModelPromise: Promise<string> | null = null;

function normalize(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function findKnowledgeBaseMatch(query: string) {
  const normalized = normalize(query);
  const tokens = new Set(normalized.split(" ").filter(Boolean));
  let bestMatch: { entry: KnowledgeBaseEntry; score: number } | null = null;

  for (const entry of knowledgeBase as KnowledgeBaseEntry[]) {
    const matchedKeywords = entry.keywords.filter((keyword) => tokens.has(normalize(keyword)));
    const score = matchedKeywords.length / entry.keywords.length;

    if (!bestMatch || score > bestMatch.score) {
      bestMatch = {
        entry,
        score
      };
    }
  }

  return bestMatch;
}

function calculateConfidence(content: string, source: TextQueryResult["source"]) {
  if (source === "knowledge_base") {
    return 92;
  }

  if (source === "fallback") {
    return 58;
  }

  let confidence = 84;
  const normalized = content.toLowerCase();

  if (normalized.includes("may") || normalized.includes("might") || normalized.includes("possibly")) {
    confidence -= 8;
  }

  if (normalized.includes("consult") || normalized.includes("expert") || normalized.includes("officer")) {
    confidence -= 6;
  }

  if (content.length < 180) {
    confidence -= 10;
  }

  return Math.max(45, Math.min(95, confidence));
}

function buildFallbackResponse(query: string) {
  return [
    `Question received: ${query.trim()}.`,
    "1. Inspect the crop carefully and remove the most affected leaves or branches if the damage is localized.",
    "2. Avoid overwatering and avoid applying extra fertilizer until the cause is clear.",
    "3. If you can, capture a clear photo and note when the problem started, how fast it is spreading, and whether insects are visible.",
    "4. If the issue is spreading quickly, treat it as urgent and seek officer support."
  ].join(" ");
}

async function resolveGeminiModel() {
  if (resolvedGeminiModelPromise) {
    return resolvedGeminiModelPromise;
  }

  resolvedGeminiModelPromise = (async () => {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${env.GEMINI_API_KEY}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini model discovery failed: ${response.status} ${errorText}`);
    }

    const data = (await response.json()) as { models?: GeminiModel[] };
    const supportedModels = (data.models ?? []).filter((model) =>
      model.supportedGenerationMethods?.includes("generateContent")
    );

    const preferredNames = [
      "models/gemini-2.5-flash",
      "models/gemini-2.0-flash",
      "models/gemini-1.5-flash",
      "models/gemini-1.5-flash-8b"
    ];

    for (const preferredName of preferredNames) {
      const match = supportedModels.find((model) => model.name === preferredName);
      if (match) {
        return match.name;
      }
    }

    const flashModel = supportedModels.find((model) => model.name.includes("flash"));
    if (flashModel) {
      return flashModel.name;
    }

    const firstSupported = supportedModels[0];
    if (!firstSupported) {
      throw new Error("No Gemini models with generateContent support were returned for this API key.");
    }

    return firstSupported.name;
  })();

  return resolvedGeminiModelPromise;
}

async function generateWithGemini(query: string) {
  const modelName = await resolveGeminiModel();
  const prompt = `You are an agricultural advisor helping farmers in India. Respond in simple English. Keep the answer under 180 words. Use numbered steps. Focus on practical field advice. Mention when to seek expert help. Farmer question: ${query}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini request failed for ${modelName}: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string;
        }>;
      };
    }>;
  };

  const content = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("\n").trim();
  if (!content) {
    throw new Error("Gemini returned an empty response.");
  }

  return {
    content,
    modelUsed: modelName.replace("models/", "")
  };
}

export async function processTextQuery(query: string): Promise<TextQueryResult> {
  const kbMatch = findKnowledgeBaseMatch(query);
  if (kbMatch && kbMatch.score >= 0.4) {
    return {
      content: kbMatch.entry.answer,
      confidence: calculateConfidence(kbMatch.entry.answer, "knowledge_base"),
      modelUsed: "knowledge-base",
      source: "knowledge_base"
    };
  }

  if (!env.GEMINI_API_KEY) {
    const fallback = buildFallbackResponse(query);
    return {
      content: fallback,
      confidence: calculateConfidence(fallback, "fallback"),
      modelUsed: "fallback",
      source: "fallback"
    };
  }

  try {
    const geminiResult = await generateWithGemini(query);
    return {
      content: geminiResult.content,
      confidence: calculateConfidence(geminiResult.content, "gemini"),
      modelUsed: geminiResult.modelUsed,
      source: "gemini"
    };
  } catch (error) {
    console.error("Gemini text generation failed", error);
    const fallback = buildFallbackResponse(query);
    return {
      content: fallback,
      confidence: calculateConfidence(fallback, "fallback"),
      modelUsed: "fallback",
      source: "fallback"
    };
  }
}
