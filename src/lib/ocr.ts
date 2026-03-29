import OpenAI from "openai";

export interface ParsedReceipt {
  amount: number | null;
  date: Date | null;
  merchant: string | null;
  description: string | null;
}

const client = new OpenAI();

export async function analyzeReceipt(
  imageBuffer: Buffer,
  mimeType: string
): Promise<{ ocrText: string; parsed: ParsedReceipt }> {
  const base64Image = imageBuffer.toString("base64");

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${base64Image}`,
              detail: "low",
            },
          },
          {
            type: "text",
            text: `Analyze this receipt image and extract the following information. Return a JSON object with these exact fields:
- "rawText": the full text visible in the receipt as a single string
- "amount": the total amount paid as a number (null if not found)
- "date": the purchase date in YYYY-MM-DD format (null if not found)
- "merchant": the store or business name (null if not found)
- "description": a brief 1-line description of what was purchased (null if not found)

Return only the JSON object, no markdown fences.`,
          },
        ],
      },
    ],
    max_tokens: 600,
  });

  const content = response.choices[0].message.content ?? "{}";

  let data: {
    rawText?: string;
    amount?: number | null;
    date?: string | null;
    merchant?: string | null;
    description?: string | null;
  } = {};

  try {
    data = JSON.parse(content);
  } catch {
    // Fallback: treat the whole response as raw text
    data = { rawText: content };
  }

  return {
    ocrText: data.rawText ?? content,
    parsed: {
      amount: typeof data.amount === "number" ? data.amount : null,
      date: data.date ? new Date(data.date) : null,
      merchant: data.merchant ?? null,
      description: data.description ?? null,
    },
  };
}
