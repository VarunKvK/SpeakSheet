"use client";

import { cn } from "@/lib/utils";
import { 
  AlertTriangle,
  FileText,
  Hash,
  Calendar,
  ChevronDown,
  Table2,
  FunctionSquare,
  List,
  CheckCircle2
} from "lucide-react";
import { useMemo } from "react";

// --- Helper: Robust JSON Parser ---
/**
 * Cleans AI responses that might contain Markdown formatting
 * e.g. ```json { ... } ``` becomes { ... }
 */
const cleanAndParseJSON = (input) => {
  if (!input) return null;
  if (typeof input === "object") return input; // Already an object

  try {
    // 1. Remove markdown code blocks
    const cleanStr = input.replace(/```json/g, "").replace(/```/g, "").trim();
    // 2. Parse
    return JSON.parse(cleanStr);
  } catch (error) {
    console.error("Schema parsing failed:", error);
    return null;
  }
};

// --- Helper Component: Type Badge ---
const TypeBadge = ({ type }) => {
  const safeType = (type || "text").toLowerCase();

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
    currency: {
      icon: <Hash className="h-3 w-3" />,
      label: "Currency",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
    },
    date: {
      icon: <Calendar className="h-3 w-3" />,
      label: "Date",
      className: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800",
    },
    list: {
      icon: <ChevronDown className="h-3 w-3" />,
      label: "List",
      className: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800",
    },
    boolean: {
        icon: <CheckCircle2 className="h-3 w-3" />,
        label: "Yes/No",
        className: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    }
  };

  // Fallback to text if type is unknown
  const style = typeStyles[safeType] || typeStyles.text;

  return (
    <div className={cn("flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", style.className)}>
      {style.icon}
      <span>{style.label}</span>
    </div>
  );
};

// --- Main Component ---

export const SchemaPreview = ({ schema }) => {
  
  // Memoize the parsing logic so it doesn't run on every re-render
  const { columns, formulas, error } = useMemo(() => {
    if (!schema) return { columns: [], formulas: [], error: null };

    const parsed = cleanAndParseJSON(schema);
    
    if (!parsed) {
      return { columns: [], formulas: [], error: "Invalid JSON format" };
    }

    let cols = [];
    let fms = [];

    // Normalize Structure: Handle Array vs Object
    if (Array.isArray(parsed)) {
      cols = parsed;
    } else if (parsed.columns && Array.isArray(parsed.columns)) {
      cols = parsed.columns;
      fms = Array.isArray(parsed.formulas) ? parsed.formulas : [];
    } else {
        // Edge case: Parsed but unexpected structure
        return { columns: [], formulas: [], error: "Unexpected data structure" };
    }

    return { columns: cols, formulas: fms, error: null };
  }, [schema]);

  // --- Render States ---

  if (error) return <ErrorState message={error} />;
  
  if (!columns.length && !formulas.length) {
    return <EmptyState />;
  }
  console.log(schema)

  return (
    <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Main Container */}
      <div className={cn(
        "overflow-hidden rounded-sm border-2 border-emerald-200/40 dark:border-emerald-800/40 bg-background",
        // Subtle grid pattern background
        "bg-[linear-gradient(to_right,#10b98108_1px,transparent_1px),linear-gradient(to_bottom,#10b98108_1px,transparent_1px)] bg-[size:20px_20px]"
      )}>
        
        {/* --- Header Bar --- */}
        <div className="flex items-center justify-between border-b border-emerald-100 dark:border-emerald-900/50 bg-emerald-50/30 p-3 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-sm bg-emerald-500 shadow-sm">
              <Table2 className="h-3.5 w-3.5 text-white" />
            </div>
            <h2 className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
              Schema Preview
            </h2>
          </div>
          <div className="flex gap-2">
             <span className="rounded-sm border border-emerald-200 bg-white px-2 py-0.5 text-[10px] font-mono font-medium text-emerald-700">
              {columns.length} COLS
            </span>
            {formulas.length > 0 && (
              <span className="rounded-sm border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-mono font-medium text-purple-700">
                {formulas.length} FX
              </span>
            )}
          </div>
        </div>

        {/* --- Columns Table --- */}
        <div className="divide-y divide-emerald-100/50 dark:divide-emerald-900/30">
          {/* Table Header */}
          <div className="flex items-center justify-between bg-emerald-50/50 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-emerald-600/70">
            <span>Column Name</span>
            <span>Data Type</span>
          </div>

          {/* Rows */}
          {columns.map((col, index) => (
            <div
              key={index}
              className={cn(
                "group flex items-center justify-between px-4 py-3 transition-colors hover:bg-emerald-50/40 dark:hover:bg-emerald-900/20",
                "border-l-2 border-l-transparent hover:border-l-emerald-500"
              )}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                {/* Excel Row Number style */}
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-slate-100 text-[10px] font-mono text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-700">
                  {index + 1}
                </span>
                <div className="flex flex-col min-w-0">
                    <span className="truncate text-sm font-medium text-foreground" title={col.columnName || "Untitled"}>
                    {col.columnName || "Untitled Column"}
                    </span>
                    {col.description && (
                        <span className="truncate text-[10px] text-muted-foreground hidden sm:block">
                            {col.description}
                        </span>
                    )}
                </div>
              </div>
              <TypeBadge type={col.type} />
            </div>
          ))}
        </div>
        {/* --- Formulas Section --- */}
        {formulas.length > 0 && (
          <div className="border-t-2 border-emerald-100 dark:border-emerald-900/30 bg-purple-50/10">
             <div className="flex items-center gap-2 border-b border-emerald-100/50 px-4 py-2">
                <FunctionSquare className="h-3 w-3 text-purple-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600/70">Detected Logic & Formulas</span>
             </div>
             <div className="divide-y divide-purple-100/50">
               {formulas.map((f, i) => (
                 <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-2.5 hover:bg-purple-50/30">
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-foreground truncate">{f.label || f.columnName || "Calculated Field"}</span>
                      <span className="text-[10px] text-muted-foreground truncate">Autocalculated</span>
                    </div>
                    <code className="rounded-sm border border-purple-200 bg-purple-50 px-2 py-1 text-xs font-mono text-purple-700 truncate max-w-full sm:max-w-[50%]">
                      {f.excelFormula || f.formula || f.formulaTemplate || "=N/A"}
                    </code>
                 </div>
               ))}
             </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-center gap-2 text-xs text-emerald-600/60 mt-2">
        <div className="h-1 w-1 rounded-full bg-emerald-400" />
        <span>Ready to generate .xlsx</span>
        <div className="h-1 w-1 rounded-full bg-emerald-400" />
      </div>
    </div>
  );
};

// --- State Components ---

const ErrorState = ({ message }) => (
  <div className="mt-6 flex flex-col items-center justify-center gap-3 rounded-sm border-2 border-red-200 bg-red-50/50 p-6 text-center animate-in zoom-in-95">
    <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-red-100">
      <AlertTriangle className="h-5 w-5 text-red-600" />
    </div>
    <div>
      <p className="font-bold text-red-800">Parsing Error</p>
      <p className="text-xs text-red-600/80">{message || "Could not understand the AI response."}</p>
    </div>
  </div>
);

const EmptyState = () => (
  <div className="mt-6 flex flex-col items-center justify-center gap-3 rounded-sm border-2 border-dashed border-emerald-200/60 bg-emerald-50/20 p-8 text-center">
    <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-emerald-100/50">
      <List className="h-5 w-5 text-emerald-500/50" />
    </div>
    <div>
      <p className="font-semibold text-emerald-700/80">Waiting for Input</p>
      <p className="text-xs text-emerald-600/60">Columns will appear here...</p>
    </div>
  </div>
);