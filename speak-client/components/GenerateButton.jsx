"use client";
import React, { useState } from "react";
import { Button } from "./ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { generateSchema } from "@/app/(pages)/dashboard/functions/generateSchema";
import { saveSheetData } from "@/app/(pages)/dashboard/functions/saveSheetData";
import { generateExcel } from "@/app/(pages)/dashboard/functions/generateExcelSheet";

const GenerateButton = ({
  prompt,
  setSchema,
  schema,
  className = "",
  fileUrl,
  user,
  setUploading,
  setExcelUrl
}) => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClick = async () => {
    if (!user) {
      toast("Please log in to generate spreadsheets.");
      router.push("/auth/login");
      return;
    }

    if (!prompt.trim()) return;

    setLoading(true);
    try {
     // 1. Generate schema
      console.log("GENERATING SCHEMA....");
      const schema = await generateSchema({ prompt });
      setSchema(schema);
      if (schema) toast("Schema Generated successfully!");
      console.log("SCHEMA GENERATED.");

      // 2. Save sheet metadata
      console.log("SAVING DATA INTO SUPABASE....")
      const data = await saveSheetData({ userId: user.id, prompt, schema, fileUrl });
      if (data) toast("Data saved successfully!");
      console.log("DATA SAVED INTO SUPABASE.");
  
      // 3. Build Excel only if schema is valid
      console.log("GENERATING EXCEL....")
      const excelData = await generateExcel({schema:data[0].schema ,userId: user.id});
      setExcelUrl(excelData.url)
      if (excelData) toast("Excel generated successfully!");
      console.log("EXCEL GENERATED."); 
    } catch (error) {
      console.error("Schema generation failed:", error);
      toast("Schema generation failed");
    } finally {
      setLoading(false);
      if (setUploading) setUploading(false);
    }
  };

  const isDisabled = loading || !prompt.trim();

  return (
    <Button
      onClick={handleClick}
      disabled={isDisabled}
      className={`relative min-w-[160px] font-medium transition-all duration-200
        hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        ${className}`}
      aria-label={loading ? "Generating schema" : "Generate spreadsheet schema"}
      aria-busy={loading}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          <span>Generating...</span>
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />
          <span>Generate Sheet</span>
        </>
      )}
    </Button>
  );
};

export default GenerateButton;