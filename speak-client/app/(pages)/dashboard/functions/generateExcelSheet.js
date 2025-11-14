import { useId } from "react";

export async function generateExcel({ schema, userId }) {
  const excelResponse = await fetch("/api/build-excel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      schema,
      userId,
      //? Incase Files System is implemented add here
      //? Incase Files System is implemented add here
    }),
  });

  const excelData = await excelResponse.json();
  if (!excelResponse.ok)
    throw new Error(excelData.error || "Failed to build Excel");
  return excelData;
}
