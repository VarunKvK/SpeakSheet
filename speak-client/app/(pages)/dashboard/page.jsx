"use client";
import GenerateButton from "@/components/GenerateButton";
import PromptInput from "@/components/PromptInput";
import React, { useEffect, useState } from "react";
import { SchemaPreview } from "@/components/SchemaPreview";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { Download, FileSpreadsheet, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Dashboard Component - Excel-Inspired Design
 *
 * A clean, professional dashboard with sharp edges and green theme.
 * Spreadsheet-inspired visual elements throughout.
 */
const Dashboard = () => {
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState("");
  const [file, setFile] = useState(null);
  const [readfile, setReadFile] = useState();
  const [schema, setSchema] = useState(null);
  const [fileSchema, setFileSchema] = useState(null);
  const [user, setUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [excelUrl, setExcelUrl] = useState();

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching user:", error);
      } else {
        setUser(data.user);
      }
    };
    fetchUser();
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-background via-emerald-50/20 to-background dark:via-emerald-950/10">
      {/* Subtle grid background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#10b98108_1px,transparent_1px),linear-gradient(to_bottom,#10b98108_1px,transparent_1px)] bg-[size:40px_40px]" />
      
      {/* Top accent bar (Excel ribbon-inspired) */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500" />
      
      {/* Content Wrapper */}
      <div className="relative z-10 flex h-full flex-col p-4 pt-12 md:p-8">
        {/* Page Header */}
        <header className="mx-auto max-w-2xl text-center mb-8">
          <div className="mb-4 flex items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-emerald-500 shadow-lg">
              <FileSpreadsheet className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              SpeakSheet
            </h1>
          </div>
          <p className="text-base text-muted-foreground max-w-lg mx-auto">
            From a simple idea to a complete spreadsheet in seconds. Describe what you need, and let AI do the rest.
          </p>
        </header>

        {/* Main Content Area */}
        <div className="flex flex-1 items-start justify-center">
          <div className="w-full max-w-4xl space-y-6">
            {/* Main Interaction Card */}
            <div className="relative space-y-6 rounded-sm border-2 border-emerald-200/40 dark:border-emerald-800/40 bg-background/95 p-6 shadow-lg backdrop-blur-sm md:p-8">
              {/* Top decorative bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500/20 via-emerald-400/30 to-emerald-500/20" />
              
              {/* Left accent line */}
              <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500/20 via-emerald-400/10 to-transparent" />

              {/* Section Label */}
              <div className="flex items-center gap-2 pb-4 border-b border-emerald-100 dark:border-emerald-900/30">
                <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">
                  Create Spreadsheet
                </h2>
              </div>

              <PromptInput
                value={prompt}
                promptValue={setPrompt}
                setError={setError}
                error={error}
                maxLength={500}
                setFile={setFile}
                file={file}
                setFileSchema={setFileSchema}
                uploading={uploading}
                setUploading={setUploading}
                user={user}
                setReadFile={setReadFile}
              />
              
              <div className="flex justify-end pt-2">
                <GenerateButton
                  prompt={prompt}
                  setSchema={setSchema}
                  fileUrl={file}
                  user={user}
                  setExcelUrl={setExcelUrl}
                  readfile={readfile}
                  fileSchema={fileSchema}
                />
              </div>
            </div>

            {/* Results Area */}
            {(schema || excelUrl) && (
              <div className="relative space-y-6 rounded-sm border-2 border-emerald-200/40 dark:border-emerald-800/40 bg-background/95 p-6 shadow-lg backdrop-blur-sm md:p-8 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
                {/* Top decorative bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500/20 via-emerald-400/30 to-emerald-500/20" />
                
                {/* Left accent line */}
                <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500/20 via-emerald-400/10 to-transparent" />

                {/* Header with Download Button */}
                <div className="flex items-center justify-between gap-4 pb-4 border-b-2 border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-emerald-500">
                      <FileSpreadsheet className="h-4 w-4 text-white" />
                    </div>
                    <h2 className="text-lg font-semibold text-foreground">
                      Generation Results
                    </h2>
                  </div>

                  {excelUrl && (
                    <Button 
                    asChild 
                    variant="outline"
                    className="rounded-sm border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                    >
                      <Link href={excelUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 h-4 w-4" />
                        Download Sheet
                      </Link>
                    </Button>
                  )}
                </div>

                {/* Schema Preview */}
                {schema && <SchemaPreview schema={schema} />}
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <footer className="mt-12 text-center">
          <p className="text-xs text-muted-foreground">
            Powered by AI • Excel & CSV Compatible
          </p>
        </footer>
      </div>
    </main>
  );
};

export default Dashboard;