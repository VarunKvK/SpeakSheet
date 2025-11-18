export async function generateSchema({ prompt }) {
  const res = await fetch("/api/schema", {
    method: "POST",
    body: JSON.stringify({ prompt }),
    headers: { "Content-Type": "application/json" },
  });

  const { schema: rawSchema } = await res.json();
  if (!res.ok) throw new Error("Schema API failed");
  try {
    const cleaned = rawSchema
    .replace(/^```json/, "")
    .replace(/^```/, "")
    .replace(/```$/, "")
    .trim();
    const parsed = JSON.parse(cleaned);
    if (!parsed.columns || !Array.isArray(parsed.columns)) {
      throw new Error("Schema is missing columns");
    }

    return parsed;
  } catch (err) {
    console.error("Failed to parse schema:", err);
    throw new Error("Invalid schema format returned by AI");
  }
}
