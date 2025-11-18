"use client";
import React from "react";
import { FileSpreadsheet, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { generateSchema } from "@/app/(pages)/dashboard/functions/generateSchema";
import { saveSheetData } from "@/app/(pages)/dashboard/functions/saveSheetData";
import { generateExcel } from "@/app/(pages)/dashboard/functions/generateExcelSheet";
import { Button } from "./ui/button";

/**
 * GenerateButton - Minimal Excel-Inspired Design
 *
 * A clean, professional button with sharp edges and green theme.
 * Focus on clarity and usability.
 */
const GenerateButton = ({
  prompt,
  setSchema,
  className = "",
  fileUrl,
  user,
  setUploading,
  setExcelUrl,
  readfile,
}) => {
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  const handleClick = async () => {
    if (!user) {
      toast("Please log in to generate spreadsheets.");
      router.push("/auth/login");
      return;
    }

    if (!prompt.trim() && !readfile) {
      toast.error("Please provide a prompt or upload a file.");
      return;
    }

    setLoading(true);
    const promise = async () => {
      const generatedSchema = await generateSchema({ prompt });
      setSchema(generatedSchema);
      if (!generatedSchema) throw new Error("Could not understand your request. Please try rephrasing.");
      console.log("GENERATED SCHEMA ", generatedSchema)

      const savedData = await saveSheetData({ userId: user.id, prompt, schema: generatedSchema, fileUrl });
      if (!savedData) throw new Error("Failed to save your sheet data.");
      // const demo_schema = {
      //   "columns": [
      //     {
      //       "columnName": "Name",
      //       "type": "text"
      //     },
      //     {
      //       "columnName": "Department",
      //       "type": "text"
      //     },
      //     {
      //       "columnName": "Salary",
      //       "type": "number"
      //     },
      //     {
      //       "columnName": "Experience",
      //       "type": "number"
      //     },
      //     {
      //       "columnName": "Start Date",
      //       "type": "date"
      //     }
      //   ],
      //   "formulas": [
      //     {
      //       "label": "Total Salary",
      //       "excelFormula": "=SUM(C:C)",
      //       "columnName": "Salary"
      //     }
      //   ]
      // }
      // const excelData = await generateExcel({ schema: demo_schema, userId: user.id, file_read_data: readfile });
      const excelData = await generateExcel({ schema: savedData[0].schema, userId: user.id, file_read_data: readfile });
      if (!excelData || !excelData.url) throw new Error("Failed to generate the Excel file.");

      setExcelUrl(excelData.url);
      return excelData;
    };

    try {
      await promise();
    } catch (error) {
      console.error("Generation process failed:", error);
    } finally {
      setLoading(false);
      if (setUploading) setUploading(false);
    }
  };

  const isDisabled = loading || (!prompt.trim() && !readfile);

  return (
    <div className={cn("relative w-full max-w-[240px]", className)}>
      <Button
        onClick={handleClick}
        disabled={isDisabled}
        className={cn(
          "group relative flex h-12 w-full items-center justify-between gap-3 px-5",
          "rounded-sm border-2 transition-all duration-150",
          // Default state
          "bg-emerald-600 border-emerald-600 text-white shadow-sm",
          // Hover state
          "hover:bg-emerald-700 hover:border-emerald-700 hover:shadow-md",
          // Active state
          "active:bg-emerald-800",
          // Disabled state
          "disabled:bg-slate-300 disabled:border-slate-300 disabled:text-slate-500",
          "disabled:cursor-not-allowed disabled:shadow-none",
        )}
        aria-label={loading ? "Generating spreadsheet..." : "Generate spreadsheet"}
        aria-busy={loading}
      >
        {/* Left icon */}
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin flex-shrink-0" />
        ) : (
          <FileSpreadsheet className="h-5 w-5 flex-shrink-0" />
        )}

        {/* Text */}
        <span className="flex-1 text-sm font-semibold">
          {loading ? "Generating..." : "Generate Sheet"}
        </span>

        {/* Right arrow */}
        <ArrowRight className={cn(
          "h-4 w-4 flex-shrink-0 transition-transform duration-150",
          "group-hover:translate-x-0.5"
        )} />
      </Button>

      {/* Simple loading indicator */}
      {loading && (
        <div className="mt-2 h-0.5 w-full overflow-hidden rounded-sm bg-emerald-100 dark:bg-emerald-950/30">
          <div className="h-full w-1/2 animate-[slide_1s_ease-in-out_infinite] bg-emerald-500" />
        </div>
      )}
    </div>
  );
};

export default GenerateButton;
