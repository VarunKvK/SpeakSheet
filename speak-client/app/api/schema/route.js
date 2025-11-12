import { GoogleGenAI } from "@google/genai";

export async function POST(req) {
  const { prompt } = await req.json();
  try {
    const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);
    const systemPrompt = `
        You are a schema generation assistant. Based on the user's natural language description of a spreadsheet, generate a JSON array of column definitions suitable for creating a Google Sheets table.
      
        Each column should be represented as an object with the following fields:
        - columnName: string (the name of the column)
        - type: one of "text", "number", "date", or "dropdown"
        - options: array of strings (only required if type is "dropdown")
      
        Respond ONLY with a valid JSON array. Do not include any explanation or markdown formatting.
        User Prompt:${prompt}
        `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: systemPrompt,
    });
    const text = response.text;
    return Response.json({ schema: text });
  } catch (err) {
    console.error("Gemini error:", err);
    return Response.json(
      { error: "Schema generation failed" },
      { status: 500 }
    );
  }
}
