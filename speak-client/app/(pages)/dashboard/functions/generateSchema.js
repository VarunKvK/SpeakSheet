export async function generateSchema({ prompt }) {
  const res = await fetch("/api/schema", {
    method: "POST",
    body: JSON.stringify({ prompt }),
    headers: { "Content-Type": "application/json" },
  });

  const { schema:schema } = await res.json();
  if (!res.ok) throw new Error("Schema API failed");
  return schema;
}
