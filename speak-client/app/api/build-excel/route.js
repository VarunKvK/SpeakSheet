import { supabase } from "@/lib/supabaseClient";
import { v4 as uuidv4 } from "uuid";
import ExcelJS from "exceljs";

// Converts "A:A" → "A2:A50" for clean data range detection
function replaceFullColumnRefs(formulaText, rowCount) {
  return formulaText.replace(/([A-Z]+):\1/g, (_, col) => `${col}2:${col}${rowCount}`);
}

// Convert number to Excel column letter
function getColumnLetter(index) {
  let letter = "";
  while (index >= 0) {
    letter = String.fromCharCode((index % 26) + 65) + letter;
    index = Math.floor(index / 26) - 1;
  }
  return letter;
}

export async function POST(req) {
  const { file_schema, schema, userId, file_read_data } = await req.json();

  if (!userId || !schema?.columns) {
    return Response.json({ error: "Missing schema or user ID" }, { status: 400 });
  }

  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Sheet");

    const parsedSchema = typeof schema === "string" ? JSON.parse(schema) : schema;
    const columnsFromSchema = parsedSchema.columns || [];
    const formulas = parsedSchema.formulas || [];

    // Separate row-level formulas vs summary formulas
    const rowFormulaColumns = formulas.filter(f => f?.type === "formula" && f.formulaTemplate);
    const summaryFormulas = formulas.filter(f => f.label && f.excelFormula);

    // Merge all columns
    const allColumns = [...columnsFromSchema, ...rowFormulaColumns];

    // Define headers
    sheet.columns = allColumns.map(col => ({
      header: col.columnName,
      key: col.columnName,
      width: 25,
    }));

    // Add dropdown validations
    allColumns.forEach((col, index) => {
      if (col.type === "dropdown" && Array.isArray(col.options)) {
        sheet.getColumn(index + 1).eachCell((cell, rowNumber) => {
          if (rowNumber > 1) {
            cell.dataValidation = {
              type: "list",
              allowBlank: true,
              formulae: [`"${col.options.join(",")}"`],
            };
          }
        });
      }
    });

    // Map original file columns
    const getMappedColumnSource = (columnName) => {
      const match = file_schema?.columns?.find(col => col.columnName === columnName);
      return match?.mapFrom || columnName;
    };

    // Add data rows
    let rowCount = 1;
    if (Array.isArray(file_read_data)) {
      file_read_data.forEach((row, rowIndex) => {
        const excelRow = [];

        allColumns.forEach((col) => {
          const rowNum = rowIndex + 2;

          if (col.type === "formula" && col.formulaTemplate) {
            const formula = col.formulaTemplate.replace(/##/g, rowNum);
            excelRow.push({ formula, result: null });
          } else {
            const sourceColumn = getMappedColumnSource(col.columnName);
            excelRow.push(row[sourceColumn] ?? "");
          }
        });

        sheet.addRow(excelRow);
        rowCount++;
      });
    }

    // Insert summary formulas
    if (summaryFormulas.length > 0) {
      const formulaStartRow = rowCount + 1;

      summaryFormulas.forEach((formula, index) => {
        const rowNumber = formulaStartRow + index;

        const labelCell = sheet.getCell(`A${rowNumber}`);
        const targetIndex = allColumns.findIndex(c => c.columnName === formula.columnName);
        const colLetter = getColumnLetter(targetIndex !== -1 ? targetIndex : 1);

        // ✅ Avoid circular reference by placing formula in next column
        const formulaColLetter = getColumnLetter(targetIndex + 1);
        const formulaCell = sheet.getCell(`${formulaColLetter}${rowNumber}`);

        labelCell.value = formula.label || `Formula ${index + 1}`;
        labelCell.font = { bold: true };
        labelCell.alignment = { vertical: "middle", horizontal: "left" };

        const formulaText = replaceFullColumnRefs(formula.excelFormula, rowCount);
        formulaCell.value = { formula: formulaText, result: null };
        formulaCell.font = { bold: true };
        formulaCell.alignment = { vertical: "middle", horizontal: "left" };

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

    workbook.calcProperties.fullCalcOnLoad = true;
    const buffer = await workbook.xlsx.writeBuffer();

    const fileName = `${uuidv4()}_speaksheet.xlsx`;
    const filePath = `${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("sheets")
      .upload(filePath, buffer, {
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from("sheets")
      .getPublicUrl(filePath);

    return Response.json({
      success: true,
      url: publicUrlData?.publicUrl || null,
    });

  } catch (error) {
    console.error("Excel generation error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}