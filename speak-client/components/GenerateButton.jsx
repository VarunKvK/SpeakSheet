"use client";
import React, { useState } from "react";
import { Button } from "./ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const GenerateButton = ({
  prompt,
  setSchema,
  schema,
  className = "",
  fileUrl,
  user,
  setUploading, // optional, only if parent provides
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
      const response = await fetch("/api/schema", {
        method: "POST",
        body: JSON.stringify({ prompt }),
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error("Schema API failed");
      const { schema } = await response.json();
      setSchema(schema);
      if (schema) toast("Schema Generated successfully!");

      // 2. Save sheet metadata
      const sheetResponse = await fetch("/api/save-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, prompt, fileUrl, schema }),
      });

      const data = await sheetResponse.json();
      if (data) toast("Data saved successfully!");

      // 3. Build Excel only if schema is valid
      if (schema && Array.isArray(schema)) {
        const excelResponse = await fetch("/api/build-excel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ schema: data.data[0].schema, prompt: data.data[0].prompt, user_id: user.id }),
        });

        const excelData = await excelResponse.json();
        if (!excelResponse.ok) throw new Error(excelData.error || "Failed to build Excel");

        console.log(excelData);
      }
    } catch (error) {
      console.error("Schema generation failed:", error);
      toast("Schema generation failed");
    } finally {
      setLoading(false);
      if (setUploading) setUploading(false); // only call if provided
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