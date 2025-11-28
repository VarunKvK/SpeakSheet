export async function googleSheetsFlow(googleToken, schema, fileSchema, readfile) {
  console.log("Processing Google Sheets...");

  // 1. Determine Sources
  // Columns: If file exists, respect file structure. Otherwise use generated structure.
  const columnSource = (fileSchema && fileSchema.columns) ? fileSchema : schema;
  
  // Formulas: Always prefer the AI-generated 'schema' for formulas, 
  // because 'fileSchema' usually just describes the raw uploaded file.
  const formulaSource = (schema && schema.formulas) ? schema : columnSource;

  // 2. Validation
  if (!columnSource || !columnSource.columns) {
    throw new Error("No valid schema found");
  }

  // --- SEPARATE FORMULAS ---
  // Ensure we are reading from the correct source (formulaSource)
  const allFormulas = formulaSource.formulas || [];
  
  const rowLevelFormulas = allFormulas.filter(f => f.type === 'formula' || f.formulaTemplate);
  const summaryFormulas = allFormulas.filter(f => f.type !== 'formula' && !f.formulaTemplate);


  // 3. Create Spreadsheet
  const res = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${googleToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ properties: { title: "SpeakSheet Export" } }),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || "Failed to create spreadsheet");
  const { spreadsheetId } = json;


  // 4. Prepare Headers
  const standardHeaders = columnSource.columns.map(col => col.columnName);
  const calculatedHeaders = rowLevelFormulas.map(f => f.columnName);
  const finalHeaders = [...standardHeaders, ...calculatedHeaders]; // Merge existing cols + new formula cols


  // 5. Write Headers (Row 1)
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${googleToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ values: [finalHeaders] }),
    }
  );


  // 6. Write Data Rows
  let rowCount = 0;

  if (readfile && Array.isArray(readfile) && readfile.length > 0) {
    // --- SCENARIO A: User Uploaded Data ---
    rowCount = readfile.length;

    const values = readfile.map((row, index) => {
      // A. Get Standard Data
      const rowData = standardHeaders.map(h => row[h] ?? "");
      
      // B. Generate Formula Data
      const currentRowNum = index + 2; // Row 1 is header, Data starts at 2
      
      const formulaData = rowLevelFormulas.map(f => {
        if (f.formulaTemplate) {
          // Example: "=IF(C##>20000)" -> "=IF(C2>20000)"
          return f.formulaTemplate.replace(/##/g, currentRowNum.toString());
        }
        return "";
      });

      return [...rowData, ...formulaData];
    });
    
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A2:append?valueInputOption=USER_ENTERED`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${googleToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ values }),
      }
    );

  } else {
    // --- SCENARIO B: No File (Prompt Only) ---
    // We write ONE dummy row so the formulas appear in Row 2
    rowCount = 1;
    const currentRowNum = 2;

    // Empty data for standard columns
    const emptyRowData = standardHeaders.map(() => ""); 

    // Formulas for calculated columns
    const formulaData = rowLevelFormulas.map(f => {
        if (f.formulaTemplate) {
          return f.formulaTemplate.replace(/##/g, currentRowNum.toString());
        }
        return "";
    });

    const singleRow = [...emptyRowData, ...formulaData];

    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A2:append?valueInputOption=USER_ENTERED`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${googleToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ values: [singleRow] }),
      }
    );
  }


  // 7. Write Summary Formulas (Bottom of Sheet)
  if (summaryFormulas.length > 0) {
    const formulaRows = [];
    formulaRows.push([]); // Spacer
    formulaRows.push(["SUMMARY STATISTICS"]); 

    summaryFormulas.forEach(f => {
      formulaRows.push([f.label, f.excelFormula]);
    });

    // Start appending after the data rows + 2 buffer
    const startRow = rowCount + 2;

    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A${startRow}:append?valueInputOption=USER_ENTERED`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${googleToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ values: formulaRows }),
      }
    );
  }

  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
}