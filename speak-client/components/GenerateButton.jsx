"use client";
import React, { useState } from "react";
import { Button } from "./ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { uploadToSupabase } from "@/lib/uploadToSupabase";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const GenerateButton = ({
  prompt,
  setSchema,
  schema,
  className = "",
  file,
  user
}) => {
  const [loading, setLoading] = useState(false);
  const [fileUrl, setFileUrl] = useState();
  const router = useRouter();

  const handleClick = async () => {
    if (!user) {
      toast("Please log in to generate spreadsheets.");
      router.push("/auth/login");
      return;
    }
    console.log(user)

    if (!prompt.trim()) return;

    setLoading(true);
    try {
      if (file) {
        const { publicUrl } = await uploadToSupabase(file);
        setFileUrl(publicUrl);
        toast("File uploaded successfully!");
      }

      const response = await fetch("/api/schema", {
        method: "POST",
        body: JSON.stringify({ prompt }),
        headers: { "Content-Type": "application/json" },
      });

      const { schema } = await response.json();
      setSchema(schema);
      toast("Schema Generated successfully!");

      await fetch("/api/save-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, fileUrl, schema }),
      });
    } catch (error) {
      console.error("Schema generation failed:", error);
      toast("Schema generation failed");
    } finally {
      setLoading(false);
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