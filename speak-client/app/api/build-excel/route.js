import { supabase } from "@/lib/supabaseClient";
import { v4 as uuidv4 } from "uuid";
import ExcelJS from "exceljs";


function replaceFullColumnRefs(formulaText, rowCount) {
  return formulaText.replace(/([A-Z]+):\1/g, (_, col) => `${col}2:${col}${rowCount}`);
}

function getColumnLetter(index) {
  let letter = "";
  while (index >= 0) {
    letter = String.fromCharCode((index % 26) + 65) + letter;
    index = Math.floor(index / 26) - 1;
  }
  return letter;
}

// API Route (Next.js App Router)
export async function POST(req) {
  const { file_schema ,schema, userId, file_read_data } = await req.json();
  if (!userId || !schema) {
    return Response.json(
      { error: "Missing file_schema or schema or user ID" },
      { status: 400 }
    );
  }

  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Sheet");

    // Parse schema if it's a string
    let parsedSchema = schema;
    if (typeof parsedSchema === "string") {
      try {
        parsedSchema = JSON.parse(schema);
      } catch (err) {
        return Response.json(
          { error: "Invalid schema format" },
          { status: 400 }
        );
      }
    }

    if (!Array.isArray(parsedSchema.columns)) {
      return Response.json(
        { error: "Schema must be an array" },
        { status: 400 }
      );
    }

    if (!parsedSchema.columns || !Array.isArray(parsedSchema.columns)) {
      return Response.json({ error: "Malformed schema structure" }, { status: 400 });
    }

    const columns = parsedSchema.columns;
    const formulas = Array.isArray(parsedSchema.formulas) ? parsedSchema.formulas : [];

    // Define headers from schema
    const headers = columns.map((col) => ({
      header: col.columnName,
      key: col.columnName,
      width: 25,
    }));

    sheet.columns = headers;

    // Add dropdown validations if defined
    columns.forEach((col, index) => {
      if (col.type === "dropdown" && Array.isArray(col.options)) {
        sheet.getColumn(index + 1).eachCell((cell) => {
          cell.dataValidation = {
            type: "list",
            allowBlank: true,
            formulae: [`"${col.options.join(",")}"`],
          };
        });
      }
    });

    // 🔁 Matching logic function for input data keys
    const getMappedColumnSource = (columnName) => {
      const match = file_schema?.columns?.find(col => col.columnName === columnName);
      return match && match.mapFrom ? match.mapFrom : columnName;
    };

    let rowCount = 1; // Header is row 1
    if (Array.isArray(file_read_data)) {
      file_read_data.forEach((row) => {
        const rowValues = {};

        columns.forEach((col) => {
          const targetColumn = col.columnName;
          const sourceColumn = getMappedColumnSource(targetColumn); 
          rowValues[targetColumn] = row[sourceColumn] ?? "";
        });

        sheet.addRow(rowValues);
        rowCount++;
      });
    }

    if (Array.isArray(formulas) && formulas.length > 0) {
      const formulaStartRow = rowCount + 1; // Start after last data row

      formulas.forEach((formula, index) => {
        const rowNumber = formulaStartRow + index;

        const labelCell = sheet.getCell(`A${rowNumber}`);
        const targetIndex = columns.findIndex(c => c.columnName === formula.columnName);
        const colLetter = getColumnLetter(targetIndex);
        const formulaCell = sheet.getCell(`${colLetter}${rowNumber}`);
        
        labelCell.value = formula.label || `Formula ${index + 1}`;
        labelCell.font = { bold: true };
        labelCell.alignment = { vertical: "middle", horizontal: "left" };
        
        const formulaText = replaceFullColumnRefs(formula.excelFormula, rowCount);
        formulaCell.value = { formula: formulaText, result: 0 };
        formulaCell.font = { bold: true };
        formulaCell.alignment = { vertical: "middle", horizontal: "left" };

        // Optional: styling
        labelCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFEFFAFD" }
        };
        formulaCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFEFFA" }
        };
      });
    }

    // Generate Excel file buffer
    workbook.calcProperties.fullCalcOnLoad = true;
    const buffer = await workbook.xlsx.writeBuffer();

    // Upload to Supabase Storage
    const fileName = `${uuidv4()}_speaksheet.xlsx`;
    const filePath = `${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("sheets")
      .upload(filePath, buffer, {
        contentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error", uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("sheets")
      .getPublicUrl(filePath);

    const file_url = publicUrlData?.publicUrl;

    return Response.json({
      success: true,
      url: file_url,
    });
  } catch (error) {
    console.error("Excel generation error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
