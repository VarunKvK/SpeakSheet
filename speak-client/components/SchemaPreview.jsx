import { Card } from "./ui/card";
import { cn } from "@/lib/utils"; // Make sure you have this from shadcn
import { 
  AlertTriangle,
  FileText,
  Hash,
  Calendar,
  ChevronDown,
  List,
} from "lucide-react";

// Helper component for the type badge, making the main component cleaner.
const TypeBadge = ({ type }) => {
  const typeStyles = {
    text: {
      icon: <FileText className="h-3 w-3" />,
      label: "Text",
      className: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
    },
    number: {
      icon: <Hash className="h-3 w-3" />,
      label: "Number",
      className: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
    },
    date: {
      icon: <Calendar className="h-3 w-3" />,
      label: "Date",
      className: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    },
    dropdown: {
      icon: <ChevronDown className="h-3 w-3" />,
      label: "Dropdown",
      className: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
    },
    default: {
      icon: <FileText className="h-3 w-3" />,
      label: type,
      className: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
    },
  };

  const style = typeStyles[type] || typeStyles.default;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium",
        style.className
      )}
    >
      {style.icon}
      <span>{style.label}</span>
    </div>
  );
};


export const SchemaPreview = ({ schema }) => {
  let parsedSchema = [];

  // --- Logic for parsing and validation remains the same ---
  try {
    if (schema && (typeof schema === "string" || Array.isArray(schema))) {
      parsedSchema = typeof schema === "string" ? JSON.parse(schema) : schema;
    }
  } catch (err) {
    console.error("Invalid schema format:", err);
    return (
      <div className="mt-6 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-destructive/50 bg-destructive/5 p-8 text-center text-sm text-destructive">
        <AlertTriangle className="h-6 w-6" />
        <p className="font-medium">Failed to Parse Schema</p>
        <p className="text-xs">The generated structure was invalid. Please try rephrasing your prompt.</p>
      </div>
    );
  }

  if (!Array.isArray(parsedSchema) || parsedSchema.length === 0) {
    return (
      <div className="mt-6 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        <List className="h-6 w-6" />
        <p className="font-medium">Schema Preview</p>
        <p className="text-xs">Detected columns will appear here once generated.</p>
      </div>
    );
  }

  // --- New, minimal rendering inspired by the image ---
  return (
    <div className="mt-6 space-y-4">
      <h2 className="text-base font-semibold text-foreground">
        🧾 Detected Columns
      </h2>
      <div className="space-y-2">
        {parsedSchema.map((col, index) => (
          <div
            key={col.columnName || index}
            className="flex items-center justify-between gap-4 rounded-lg border bg-background p-3 transition-colors hover:bg-muted/50"
          >
            {/* Left Side: Column Name and Type Badge */}
            <div className="w-full flex justify-between items-center gap-3">
              <span className="font-medium text-foreground">
                {col.columnName}
              </span>
              <TypeBadge type={col.type} />
            </div>

          </div>
        ))}
      </div>
    </div>
  );
};