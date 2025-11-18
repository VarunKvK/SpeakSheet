import { Card } from "./ui/card";
import { cn } from "@/lib/utils";
import { 
  AlertTriangle,
  FileText,
  Hash,
  Calendar,
  ChevronDown,
  List,
  Table2,
} from "lucide-react";

// Type badge with sharp, minimal design
const TypeBadge = ({ type }) => {
  const typeStyles = {
    text: {
      icon: <FileText className="h-3 w-3" />,
      label: "Text",
      className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800",
    },
    number: {
      icon: <Hash className="h-3 w-3" />,
      label: "Number",
      className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
    },
    date: {
      icon: <Calendar className="h-3 w-3" />,
      label: "Date",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
    },
    dropdown: {
      icon: <ChevronDown className="h-3 w-3" />,
      label: "Dropdown",
      className: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800",
    },
    default: {
      icon: <FileText className="h-3 w-3" />,
      label: type,
      className: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    },
  };

  const style = typeStyles[type] || typeStyles.default;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-xs font-semibold",
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

  try {
    if (schema.columns && (typeof schema.columns === "string" || Array.isArray(schema.columns))) {
      parsedSchema = typeof schema === "string" ? JSON.parse(schema.columns) : schema.columns;
    }
  } catch (err) {
    console.error("Invalid schema format:", err);
    return (
      <div className="mt-6 flex flex-col items-center justify-center gap-3 rounded-sm border-2 border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20 p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-red-100 dark:bg-red-900/50">
          <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>
        <div className="space-y-1">
          <p className="font-semibold text-red-700 dark:text-red-300">Failed to Parse Schema</p>
          <p className="text-sm text-red-600/80 dark:text-red-400/80">
            The generated structure was invalid. Please try rephrasing your prompt.
          </p>
        </div>
      </div>
    );
  }

  if (!Array.isArray(parsedSchema) || parsedSchema.length === 0) {
    return (
      <div className="mt-6 flex flex-col items-center justify-center gap-3 rounded-sm border-2 border-dashed border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/10 p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-emerald-100 dark:bg-emerald-900/50">
          <Table2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="space-y-1">
          <p className="font-semibold text-emerald-700 dark:text-emerald-300">Schema Preview</p>
          <p className="text-sm text-emerald-600/80 dark:text-emerald-400/80">
            Detected columns will appear here once generated.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {/* Header with table icon */}
      <div className="flex items-center gap-2 border-b-2 border-emerald-200 dark:border-emerald-800 pb-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-emerald-500">
          <Table2 className="h-4 w-4 text-white" />
        </div>
        <h2 className="text-base font-semibold text-foreground">
          Detected Columns
        </h2>
        <span className="ml-auto rounded-sm bg-emerald-100 dark:bg-emerald-950/50 px-2 py-0.5 text-xs font-mono font-semibold text-emerald-700 dark:text-emerald-300">
          {parsedSchema.length} {parsedSchema.length === 1 ? 'column' : 'columns'}
        </span>
      </div>

      {/* Table-like container */}
      <div className="space-y-0 overflow-hidden rounded-sm border-2 border-emerald-200/40 dark:border-emerald-800/40 bg-background">
        {parsedSchema.map((col, index) => (
          <div
            key={col.columnName || index}
            className={cn(
              "flex items-center justify-between gap-4 border-b border-emerald-100 dark:border-emerald-900/30 p-4 transition-colors",
              "hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20",
              // Remove border from last item
              index === parsedSchema.length - 1 && "border-b-0",
              // Add left accent
              "border-l-2 border-l-transparent hover:border-l-emerald-500"
            )}
          >
            {/* Left: Row number and Column Name */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Row number (Excel-like) */}
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-sm bg-emerald-100 dark:bg-emerald-900/50 text-xs font-mono font-semibold text-emerald-700 dark:text-emerald-300">
                {index + 1}
              </div>
              
              {/* Column name */}
              <span className="font-semibold text-foreground truncate">
                {col.columnName}
              </span>
            </div>

            {/* Right: Type Badge */}
            <TypeBadge type={col.type} />
          </div>
        ))}
      </div>

      {/* Footer info */}
      <div className="flex items-center gap-2 rounded-sm border border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/10 px-3 py-2">
        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <p className="text-xs text-emerald-700 dark:text-emerald-300">
          Schema ready for generation
        </p>
      </div>
    </div>
  );
};