
export async function generateExcel({ schema, userId, file_read_data, file_schema }) {
  const excelResponse = await fetch("/api/build-excel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      schema,
      userId,
      file_schema,
      file_read_data
    }),
  });

  const excelData = await excelResponse.json();
  if (!excelResponse.ok)
    throw new Error(excelData.error || "Failed to build Excel");
  return excelData;
}

