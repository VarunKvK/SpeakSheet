"use client";
import React from "react";
import { Sparkles, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils"; // Make sure you have this from shadcn
import { generateSchema } from "@/app/(pages)/dashboard/functions/generateSchema";
import { saveSheetData } from "@/app/(pages)/dashboard/functions/saveSheetData";
import { generateExcel } from "@/app/(pages)/dashboard/functions/generateExcelSheet";
import { Button } from "./ui/button";

/**
 * GenerateButton (Refactored for Minimalist AI UX)
 *
 * A custom-built Button inspired by modern, clean design systems. It features a
 * distinct pill shape with a separated icon container for a sophisticated look.
 *
 * Features:
 * - Pill shape with a subtle border and shadow for depth.
 * - High-contrast design for excellent readability.
 * - Delightful hover micro-interaction with a sliding icon.
 * - Clear and intuitive disabled and loading states.
 *
 * @example
 * <GenerateButton prompt={prompt} user={user} ... />
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

  // --- All your original, battle-tested logic is preserved ---
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
      // 1. Generate schema
      const generatedSchema = await generateSchema({ prompt });
      setSchema(generatedSchema);
      if (!generatedSchema) throw new Error("Could not understand your request. Please try rephrasing.");

      // 2. Save sheet metadata
      const savedData = await saveSheetData({ userId: user.id, prompt, schema: generatedSchema, fileUrl });
      if (!savedData) throw new Error("Failed to save your sheet data.");
      
      // 3. Build Excel
      const excelData = await generateExcel({ schema: savedData[0].schema, userId: user.id, file_read_data: readfile });
      if (!excelData || !excelData.url) throw new Error("Failed to generate the Excel file.");
      
      setExcelUrl(excelData.url);
      return excelData;
    };
    
    toast.promise(promise, {
      loading: 'Generating your spreadsheet...',
      success: (data) => `Sheet generated! Click to download.`,
      error: (err) => err.message || 'An error occurred.',
      onSuccess: (data) => {
        if (data && data.url) {
          window.open(data.url, '_blank');
        }
      }
    });

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
    // The main Button element. 'group' is essential for the icon hover effect.
    <Button
      onClick={handleClick}
      disabled={isDisabled}
      className={cn(
        "group relative flex h-12 w-full max-w-[240px] items-center justify-between rounded-full bg-slate-100 p-1.5 pl-6 text-slate-900 shadow-md transition-all duration-200 ease-in-out",
        "border border-slate-200",
        // Hover and Active states
        "hover:shadow-lg hover:-translate-y-px hover:bg-card",
        "active:scale-[0.98] active:translate-y-0",
        // Disabled state
        "disabled:bg-slate-50 disabled:text-slate-400 disabled:shadow-none disabled:hover:translate-y-0 disabled:cursor-not-allowed",
        className
      )}
      aria-label={loading ? "Generating spreadsheet..." : "Generate spreadsheet"}
      aria-busy={loading}
    >
      {/* Text changes based on loading state */}
      <span className="font-semibold tracking-wide">
        {loading ? "Generating..." : "Generate Sheet"}
      </span>

      {/* The circular icon container */}
      <div className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 shadow-md transition-transform duration-200 ease-in-out",
        "group-hover:translate-x-1", // The magic hover effect
        "disabled:bg-slate-400 disabled:group-hover:translate-x-0"
      )}>
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-slate-100" />
        ) : (
          <ArrowRight className="h-5 w-5 text-slate-100 transition-transform duration-200 group-hover:rotate-[-30deg]" />
        )}
      </div>
    </Button>
  );
};

export default GenerateButton;