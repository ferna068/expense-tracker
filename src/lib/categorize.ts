import OpenAI from "openai";

const client = new OpenAI();

export async function suggestCategory(
  text: string,
  categoryNames: string[]
): Promise<string | null> {
  if (!categoryNames.length || !text.trim()) return null;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Eres un clasificador de gastos. Dada la descripción de un gasto y una lista de categorías disponibles, devuelve únicamente el nombre de la categoría que mejor coincida. Si ninguna coincide bien, devuelve la categoría llamada 'Otros' si existe; de ​​lo contrario, devuelve la que más se aproxime. Devuelve solo el nombre de la categoría, sin puntuación ni explicación."
        },
        {
          role: "user",
          content: `Categories: ${categoryNames.join(", ")}\n\nExpense description: ${text}`,
        },
      ],
      max_tokens: 20,
    });

    const suggested = response.choices[0].message.content?.trim() ?? null;
    if (!suggested) return null;

    // Must match one of the provided names (case-insensitive)
    return (
      categoryNames.find((n) => n.toLowerCase() === suggested.toLowerCase()) ??
      categoryNames.find((n) => n === "Otros") ??
      null
    );
  } catch {
    return null;
  }
}
