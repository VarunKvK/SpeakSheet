import { GoogleGenAI } from "@google/genai";

export async function POST(req) {
  const { prompt,filePreviewData} = await req.json();
  try {
    const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);
    const systemPrompt = `
        You are a spreadsheet schema and file analysis assistant.

        You are given:
        - A user's natural language prompt explaining what kind of spreadsheet they want
        - A sample of data from a file the user uploaded

        Task:
        - Analyze the file sample to understand column meanings, formats, and data structure
        - Match file columns to the user's request (e.g. "Amount" should match "Salary")
        - Return:
        {
            "columns": [
            {
                "columnName": string,                     // From prompt
                "mapFrom": string | null,                 // Column name in uploaded file
                "type": one of "text", "number", "date", "dropdown",
                "options": []                             // Only for dropdowns
            }
            ],
            "formulas": [
            {
                "label": string,
                "excelFormula": string
            }
            ]
        }

        Respond only with valid JSON. Do not include any commentary, explanation, or explanations.

        User Prompt:
        ${prompt}

        Uploaded File Sample:
        ${JSON.stringify(filePreviewData).slice(0, 4000)}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: systemPrompt,
    });
    const rawSchema = response.text;
    const cleaned = rawSchema
    .replace(/^```json/, "")
    .replace(/^```/, "")
    .replace(/```$/, "")
    .trim();
    const parsed = JSON.parse(cleaned);
    return Response.json(parsed);
  } catch (err) {
    console.error("Gemini error:", err);
    return Response.json(
      { error: "Schema generation failed" },
      { status: 500 }
    );
  }
}


// prompt:Track employee data: Name, Department, Salary , Experience, Start Date. Average both Salary and Experience separately and then calculate the average of it. 