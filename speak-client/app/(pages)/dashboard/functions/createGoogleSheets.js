export async function googleSheetsFlow(googleToken, schema, fileSchema, readfile) {
  console.log("Google Token:", googleToken);
  console.log("FileSchema:", fileSchema);
  console.log("Schema:", schema);
  console.log("Readfile:", readfile);

  // 1. Determine which schema to use
  // Logic: If fileSchema exists (file uploaded), use it. Otherwise use generated schema (prompt only).
  const activeSchema = (fileSchema && fileSchema.columns) ? fileSchema : schema;

  // 2. Validation: Ensure we found a valid schema
  if (!activeSchema || !activeSchema.columns) {
    throw new Error("No valid schema found to generate spreadsheet");
  }

  // 3. Create spreadsheet
  const res = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${googleToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ properties: { title: "SpeakSheet Export" } }),
  });

  const json = await res.json();
  if (!res.ok) {
    console.error("Google Sheets API error:", json);
    throw new Error(json.error?.message || "Failed to create spreadsheet");
  }

  const { spreadsheetId } = json;

  // 4. Extract Headers from the ACTIVE schema
  const headers = activeSchema.columns.map(col => col.columnName);

  // 5. Write Headers (Row 1)
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${googleToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: [headers] }),
    }
  );

  // 6. Data rows (Only if readfile exists and has data)
  // Note: This works because if 'fileSchema' is used, the headers match the keys in 'readfile'.
  if (readfile && Array.isArray(readfile) && readfile.length > 0) {
    
    const values = readfile.map(row => headers.map(h => row[h] ?? ""));
    
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A2:append?valueInputOption=USER_ENTERED`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${googleToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ values }),
      }
    );
  }

  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
}