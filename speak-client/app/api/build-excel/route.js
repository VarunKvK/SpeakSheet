import { supabase } from "@/lib/supabaseClient";
import { v4 as uuidv4 } from "uuid";
import ExcelJS from "exceljs";

// API Route (Next.js App Router)
export async function POST(req) {
  const { schema, userId, file_read_data } = await req.json();

  if (!userId || !schema?.length) {
    return Response.json(
      { error: "Missing schema or user ID" },
      { status: 400 }
    );
  }

  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Sheet");

    // Parse schema if it's a string
    let parsedSchema = schema;
    if (typeof schema === "string") {
      try {
        parsedSchema = JSON.parse(schema);
      } catch (err) {
        return Response.json(
          { error: "Invalid schema format" },
          { status: 400 }
        );
      }
    }

    if (!Array.isArray(parsedSchema)) {
      return Response.json(
        { error: "Schema must be an array" },
        { status: 400 }
      );
    }

    // Define headers from schema
    const headers = parsedSchema.map((col) => ({
      header: col.columnName,
      key: col.columnName,
      width: 25,
    }));

    sheet.columns = headers;

    // Add dropdown validations if defined
    parsedSchema.forEach((col, index) => {
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

    // ✅ Add rows from uploaded file if exists
    if (Array.isArray(file_read_data)) {
      file_read_data.forEach((row) => {
        const rowValues = {};

        parsedSchema.forEach((col) => {
          const key = col.columnName;
          rowValues[key] = row[key] ?? "";
        });

        sheet.addRow(rowValues);
      });
    }

    // Generate Excel file buffer
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
