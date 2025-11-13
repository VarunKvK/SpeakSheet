import { uploadToSupabase } from "@/lib/uploadToSupabase";
import ExcelJS from "exceljs";

export async function POST(req) {
  const { schema, prompt, user_id } = await req.json();
  if (!user_id || !schema?.length) {
    return Response.json(
      { error: "Missing schema or user ID" },
      { status: 400 }
    );
  }

  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Sheet");
    console.log(schema)
    const headers = schema.map((col) => ({
      header: col.columnName,
      key: col.columnName.toLowerCase(),
      width: 25,
    }));

    sheet.columns - headers;

    schema.forEach((col, index) => {
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
    const { publicUrl, filename } = await uploadToSupabase(
      buffer,
      user_id,
      `${uuidv4()}_speaksheet.xlsx`
    );

    return Response.json({
      success: true,
      url: publicUrl,
      filename,
    });
  } catch (error) {
    console.error("Excel generation error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
