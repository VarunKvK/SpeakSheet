
export async function generateExcel({ schema, userId, file_read_data }) {
  const excelResponse = await fetch("/api/build-excel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      schema,
      userId,
      //? Incase Files System is implemented add here
      file_read_data
      //? Incase Files System is implemented add here
    }),
  });

  const excelData = await excelResponse.json();
  if (!excelResponse.ok)
    throw new Error(excelData.error || "Failed to build Excel");
  return excelData;
}

