"use client";
import React, { useState } from "react";
import { FileSpreadsheet, Loader2, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// Server Actions
import { generateSchema } from "@/app/(pages)/dashboard/functions/generateSchema";
import { saveSheetData } from "@/app/(pages)/dashboard/functions/saveSheetData";
import { generateExcel } from "@/app/(pages)/dashboard/functions/generateExcelSheet";
import { Button } from "./ui/button";

/**
 * GenerateButton - Enhanced Robustness
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
  fileSchema
}) => {
  const [status, setStatus] = useState("idle"); // 'idle' | 'validating' | 'schema' | 'saving' | 'excel'
  const router = useRouter();

  // Helper to get readable text based on current process step
  const getLoadingText = () => {
    switch (status) {
      case "validating": return "Checking inputs...";
      case "schema": return "Designing logic...";
      case "saving": return "Saving workspace...";
      case "excel": return "Compiling .xlsx...";
      default: return "Processing";
    }
  };

  const handleClick = async () => {
    // 1. Auth Guard
    if (!user || !user.id) {
      toast.error("Authentication Error", { description: "Please log in to continue." });
      router.push("/auth/login");
      return;
    }

    // 2. Input Validation Guard
    if (!prompt.trim() && !readfile) {
      toast.warning("Missing Input", { description: "Please enter a prompt or upload a file." });
      return;
    }

    // 3. Consistency Guard
    if (readfile && !fileSchema) {
      toast.error("File Analysis Missing", { 
        description: "We couldn't analyze the uploaded file. Please remove and re-upload it." 
      });
      return;
    }

    setStatus("validating");

    // Define the workflow
    const generateWorkflow = async () => {
      try {
        // --- Step A: Generate Schema (AI) ---
        setStatus("schema");
        const generatedSchema = await generateSchema({ prompt });
        
        if (!generatedSchema) {
          throw new Error("AI could not generate a valid structure from your prompt.");
        }
        
        setSchema(generatedSchema);

        // --- Step B: Save to Database ---
        setStatus("saving");
        const savedData = await saveSheetData({ 
          userId: user.id, 
          prompt: prompt || "Uploaded File Generation", 
          schema: generatedSchema, 
          file_schema: fileSchema || null, 
          fileUrl: fileUrl || null
        });

        if (!savedData || savedData.length === 0) {
          throw new Error("Database connection failed while saving sheet.");
        }

        // --- Step C: Generate Physical Excel File ---
        setStatus("excel");
        const excelData = await generateExcel({ 
          file_schema: savedData[0].file_schema, 
          schema: savedData[0].schema, 
          userId: user.id, 
          file_read_data: readfile || null
        });

        if (!excelData || !excelData.url) {
          throw new Error("Excel generation engine failed to return a download URL.");
        }

        // --- SUCCESS ---
        // FIX: Update URL and reset status IMMEDIATELY here.
        // Do not wait for the toast promise wrapper to resolve.
        setExcelUrl(excelData.url);
        setStatus("idle"); 
        if (setUploading) setUploading(false);
        
        return excelData;

      } catch (err) {
        // FIX: Reset status on error here as well to prevent stuck loading state
        setStatus("idle");
        if (setUploading) setUploading(false);
        throw err; // Re-throw so toast displays the error
      }
    };

    // Execute Toast
    // We don't await this block for state management anymore, 
    // because state management is handled internally within generateWorkflow
    toast.promise(generateWorkflow(), {
      loading: 'Starting generation engine...',
      success: 'Spreadsheet created successfully!',
      error: (err) => err.message || "An unexpected error occurred."
    });
  };

  const isLoading = status !== "idle";
  const isDisabled = isLoading || (!prompt.trim() && !readfile);

  return (
    <div className={cn("relative w-full max-w-[260px]", className)}>
      <Button
        onClick={handleClick}
        disabled={isDisabled}
        className={cn(
          "group relative flex h-12 w-full items-stretch justify-between p-0 overflow-hidden",
          "rounded-sm border-2 transition-all duration-200",
          "bg-emerald-600 border-emerald-600 text-white shadow-sm",
          "hover:bg-emerald-700 hover:border-emerald-700 hover:shadow-md hover:-translate-y-[1px]",
          "active:bg-emerald-800 active:translate-y-0",
          "disabled:bg-slate-100 disabled:border-slate-200 disabled:text-slate-400",
          "disabled:cursor-not-allowed disabled:shadow-none disabled:hover:translate-y-0",
        )}
        aria-label={isLoading ? getLoadingText() : "Generate spreadsheet"}
        aria-busy={isLoading}
      >
        <div className="flex flex-1 items-center gap-3 px-4">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileSpreadsheet className="h-4 w-4" />
          )}

          <div className="flex flex-col items-start text-left leading-none">
            <span className="text-sm font-bold tracking-wide">
              {isLoading ? "Processing" : "Generate"}
            </span>
            <span className="text-[10px] font-mono opacity-80 mt-1 uppercase">
              {isLoading ? getLoadingText() : "Output: .XLSX"}
            </span>
          </div>
        </div>

        <div className={cn(
          "w-[1px] bg-white/20 h-full",
          isDisabled && "bg-slate-300"
        )} />

        <div className={cn(
          "flex w-12 items-center justify-center bg-black/10 transition-colors",
          "group-hover:bg-black/20",
          isDisabled && "bg-transparent"
        )}>
          {isLoading ? (
            <Sparkles className="h-4 w-4 animate-pulse text-white/80" />
          ) : (
            <ArrowRight className={cn(
              "h-4 w-4 transition-transform duration-200",
              "group-hover:translate-x-0.5"
            )} />
          )}
        </div>
      </Button>

      {/* Technical Loading Progress Bar */}
      {isLoading && (
        <div className="mt-2 flex items-center justify-between gap-2 animate-in fade-in duration-300">
          <div className="relative h-1 w-full overflow-hidden rounded-sm bg-emerald-100 dark:bg-emerald-950/30">
            <div 
              className={cn(
                "h-full w-full origin-left bg-emerald-500 transition-all duration-500",
                "animate-[progress_1.5s_ease-in-out_infinite]" 
              )} 
            />
          </div>
          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 animate-pulse">
            {status === 'excel' ? '90%' : status === 'saving' ? '60%' : '30%'}
          </span>
        </div>
      )}
    </div>
  );
};

export default GenerateButton;