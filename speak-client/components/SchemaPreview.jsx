import { Card } from "./ui/card";

export const SchemaPreview = ({ schema }) => {
  let parsedSchema = [];

  try {
    parsedSchema = typeof schema === "string" ? JSON.parse(schema) : schema;
  } catch (err) {
    console.error("Invalid schema format:", err);
    return (
      <Card className="p-4 mt-4 text-red-500 text-sm">
        Failed to parse schema. Please try again.
      </Card>
    );
  }

  if (!Array.isArray(parsedSchema) || parsedSchema.length === 0) {
    return (
      <Card className="p-4 mt-4 text-muted-foreground text-sm">
        No schema detected yet. Try generating one from your prompt.
      </Card>
    );
  }

  return (
    <Card className="p-4 mt-4">
      <h2 className="text-lg font-semibold mb-2">🧾 Detected Schema</h2>
      <table className="w-full text-sm border-collapse">
        <thead className="text-muted-foreground text-left border-b">
          <tr>
            <th className="py-1">Column</th>
            <th className="py-1">Type</th>
            <th className="py-1">Options</th>
          </tr>
        </thead>
        <tbody>
          {parsedSchema.map((col) => (
            <tr key={col.columnName} className="hover:bg-muted/10">
              <td className="py-1">{col.columnName}</td>
              <td className="py-1">
                {col.type === "text" && "📝 "}
                {col.type === "number" && "🔢 "}
                {col.type === "date" && "📅 "}
                {col.type === "dropdown" && "📂 "}
                {col.type}
              </td>
              <td className="py-1">
                {Array.isArray(col.options) && col.options.length > 0
                  ? col.options.join(", ")
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
};