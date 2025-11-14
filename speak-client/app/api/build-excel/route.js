import { supabase } from "@/lib/supabaseClient";
import { uploadToSupabase } from "@/lib/uploadToSupabase";
import ExcelJS from "exceljs";
import { v4 as uuidv4 } from "uuid";

export async function POST(req) {
  //? Incase Files System is implemented add here
  //? Incase Files System is implemented add here
  const { schema, userId } = await req.json();
  if (!userId || !schema?.length) {
    return Response.json(
      { error: "Missing schema or user ID" },
      { status: 400 }
    );
  }

  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Sheet");
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

    const headers = parsedSchema.map((col) => ({
      header: col.columnName,
      key: col.columnName.toLowerCase(),
      width: 25,
    }));

    sheet.columns = headers;

    parsedSchema.map((col, index) => {
      if (col.type === "dropdown" && col.options?.length) {
        sheet.getColumn(index + 1).eachCell((cell) => {
          cell.dataValidation = {
            type: "list",
            allowBlank: true,
            formulae: [`"${col.options.join(",")}"`],
          };
        });
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = `${uuidv4()}_speaksheet.xlsx`;
    const filePath = `${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("sheets")
      .upload(filePath, buffer, {
        contentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // 4. Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("sheets")
      .getPublicUrl(filePath);

    const file_url = publicUrlData.publicUrl;

    return Response.json({
      success: true,
      url: file_url,
    });
  } catch (error) {
    console.error("Excel generation error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
