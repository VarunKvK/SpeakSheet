"use client";
import React, { useState } from "react";
import { FileSpreadsheet, Loader2, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

import { generateSchema } from "@/app/(pages)/dashboard/functions/generateSchema";
import { saveSheetData } from "@/app/(pages)/dashboard/functions/saveSheetData";
import { generateExcel } from "@/app/(pages)/dashboard/functions/generateExcelSheet";
import { Button } from "./ui/button";

const GenerateButton = ({
  prompt,
  setSchema,
  className = "",
  fileUrl,
  user, // Can be null now
  setUploading,
  setExcelUrl,
  readfile,
  fileSchema
}) => {
  const [status, setStatus] = useState("idle");
  const router = useRouter();

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
    // 1. Input Validation Guard
    if (!prompt.trim() && !readfile) {
      toast.warning("Missing Input", { description: "Please enter a prompt or upload a file." });
      return;
    }

    // 2. Consistency Guard
    if (readfile && !fileSchema) {
      toast.error("File Analysis Missing", { description: "Please re-upload the file." });
      return;
    }

    setStatus("validating");

    const generateWorkflow = async () => {
      try {
        // --- Step A: Generate Schema (AI) ---
        setStatus("schema");
        const generatedSchema = await generateSchema({ prompt });
        
        if (!generatedSchema) throw new Error("AI could not generate a valid structure.");
        setSchema(generatedSchema);
        console.log("Generated Schema:", generatedSchema);

        // --- Step B: Save to Database (ONLY IF USER IS LOGGED IN) ---
        let savedData = [];
        if (user && user.id) {
          setStatus("saving");
          // Save to DB for history
          const result = await saveSheetData({ 
            userId: user.id, 
            prompt: prompt || "Uploaded File Generation", 
            schema: generatedSchema, 
            file_schema: fileSchema || null, 
            fileUrl: fileUrl || null
          });
          savedData = result;
        } else {
           // Guest Mode: Skip DB save, mock the data structure needed for next step
           savedData = [{
             file_schema: fileSchema || null,
             schema: generatedSchema
           }];
        }

        // --- Step C: Generate Physical Excel File ---
        setStatus("excel");
        const excelData = await generateExcel({ 
          // If we saved, use saved data. If guest, use passed props/generated schema
          file_schema: savedData[0]?.file_schema || fileSchema, 
          schema: savedData[0]?.schema || generatedSchema, 
          userId: user ? user.id : "guest", // Pass 'guest' string if backend requires a string
          file_read_data: readfile || null
        });

        if (!excelData || !excelData.url) {
          throw new Error("Excel generation engine failed to return a download URL.");
        }

        // Success Logic
        setExcelUrl(excelData.url);
        setStatus("idle");
        if (setUploading) setUploading(false);
        return excelData;

      } catch (err) {
        setStatus("idle");
        if (setUploading) setUploading(false);
        throw err;
      }
    };

    toast.promise(generateWorkflow(), {
      loading: 'Generating spreadsheet...',
      success: 'Spreadsheet ready for preview!',
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
      >
        <div className="flex flex-1 items-center gap-3 px-4">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
          <div className="flex flex-col items-start text-left leading-none">
            <span className="text-sm font-bold tracking-wide">{isLoading ? "Processing" : "Generate"}</span>
            <span className="text-[10px] font-mono opacity-80 mt-1 uppercase">{isLoading ? getLoadingText() : "Output: .XLSX"}</span>
          </div>
        </div>
        <div className={cn("w-[1px] bg-white/20 h-full", isDisabled && "bg-slate-300")} />
        <div className={cn("flex w-12 items-center justify-center bg-black/10 transition-colors", isDisabled && "bg-transparent")}>
           {isLoading ? <Sparkles className="h-4 w-4 animate-pulse" /> : <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />}
        </div>
      </Button>
      
      {/* Loading Bar */}
      {isLoading && (
        <div className="mt-2 flex items-center justify-between gap-2 animate-in fade-in">
          <div className="relative h-1 w-full overflow-hidden rounded-sm bg-emerald-100">
            <div className="h-full w-full origin-left bg-emerald-500 animate-[progress_1.5s_ease-in-out_infinite]" />
          </div>
        </div>
      )}
    </div>
  );
};

export default GenerateButton;