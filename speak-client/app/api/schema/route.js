import { GoogleGenAI } from "@google/genai";

export async function POST(req) {
  const { prompt } = await req.json();
  try {
    const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);
    const systemPrompt = `
        You are a spreadsheet schema + analytics assistant. Based on the user's natural language description of a spreadsheet, generate a JSON object definitions suitable for creating a Google Sheets table.
      
        Based on the user's description of a spreadsheet, generate a JSON object with the following structure:

        {
          "columns": [
            {
              "columnName": string,
              "type": one of "text", "number", "date", "dropdown",
              "options": [] (only if type is "dropdown")
            },
            ...
          ],
          "formulas": [
            {
              "label": "string label to display beside the formula",
              "excelFormula": "Raw Excel Formula string",
              "columnName": "string label of the columName that need to be taken"
            }
          ]
        }

        Only include formulas if the user prompt mentions any kind of computation, summary, aggregation, total, etc.

        Respond ONLY with valid JSON — no explanation or markdown.

        User Prompt: ${prompt}
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
