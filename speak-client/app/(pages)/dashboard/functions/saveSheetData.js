export async function saveSheetData({ userId, prompt, fileUrl, schema }) {
  const res = await fetch("/api/save-sheet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, prompt, fileUrl, schema }),
  });

  const {data} = await res.json();
  if (!res.ok) throw new Error("Schema API failed");

  return data;
}
