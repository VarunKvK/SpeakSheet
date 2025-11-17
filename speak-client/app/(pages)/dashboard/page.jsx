"use client";
import GenerateButton from "@/components/GenerateButton";
import PromptInput from "@/components/PromptInput";
import React, { useEffect, useState } from "react";
import { SchemaPreview } from "@/components/SchemaPreview";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Dashboard Component (Refactored for Modern AI UX)
 *
 * A redesigned dashboard featuring a floating "command center" layout and a
 * dynamic aurora background, creating a premium and focused user experience.
 *
 * Features:
 * - Animated aurora background for a high-tech feel.
 * - Floating glassmorphism card for the main interaction zone.
 * - Improved visual hierarchy with a bold headline and generous spacing.
 * - Dedicated results section that animates in smoothly.
 * - Polished UI elements for all states.
 */
const Dashboard = () => {
  // --- All your state and logic remain the same ---
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState("");
  const [file, setFile] = useState(null);
  const [readfile, setReadFile] = useState();
  const [schema, setSchema] = useState(null);
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
    // --- 1. Main Page Container with Aurora Background ---
    <main className="relative min-h-screen overflow-hidden bg-background">
      {/* The Aurora Background Div */}
      <div className="absolute inset-0 z-0 opacity-40 dark:opacity-60 [mask-image:radial-gradient(100%_100%_at_top,white,transparent)]">
          <div 
            className="absolute inset-[-200%] animate-[aurora_20s_linear_infinite]"
            style={{
              backgroundImage: "radial-gradient(ellipse_200%_100%_at_50%_0%,rgba(148,163,184,0.3),rgba(255,255,255,0)), radial-gradient(ellipse_200%_100%_at_50%_0%,rgba(168,85,247,0.2),rgba(255,255,255,0))"
            }}
          ></div>
      </div>
      
      {/* Content Wrapper */}
      <div className="relative z-10 flex h-full flex-col p-4 pt-12 md:p-8">
        {/* --- 2. Page Header --- */}
        <header className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tighter md:text-5xl">
            SpeakSheet
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            From a simple idea to a complete spreadsheet in seconds. Describe what you need, and let AI do the rest.
          </p>
        </header>

        {/* --- 3. Floating Command Center Layout --- */}
        <div className="flex flex-1 items-end justify-center">
          <div className="w-full max-w-4xl space-y-6">
            {/* The main interaction card */}
            <div className="mt-18 space-y-6 rounded-2xl border bg-background/80 p-6 shadow-2xl backdrop-blur-xl md:p-8">
              <PromptInput
                value={prompt}
                promptValue={setPrompt}
                setError={setError}
                error={error}
                maxLength={500}
                setFile={setFile}
                file={file}
                uploading={uploading}
                setUploading={setUploading}
                user={user}
                setReadFile={setReadFile}
              />
              <div className="flex justify-end">
                <GenerateButton
                  prompt={prompt}
                  setSchema={setSchema}
                  fileUrl={file}
                  user={user}
                  setExcelUrl={setExcelUrl}
                  readfile={readfile}
                />
              </div>
            </div>

            {/* --- 4. Dedicated Results Area --- */}
            {/* This section only appears after generation */}
            {(schema || excelUrl) && (
              <div className="space-y-4 rounded-2xl border bg-background/80 p-6 shadow-2xl backdrop-blur-xl md:p-8 animate-in fade-in-0 slide-in-from-bottom-5 duration-500">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Generation Results</h2>
                  {/* --- 5. Polished Download Link --- */}
                  {excelUrl && (
                    <Button asChild variant="outline">
                      <Link href={excelUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 h-4 w-4" />
                        Download Sheet
                      </Link>
                    </Button>
                  )}
                </div>
                {schema && <SchemaPreview schema={schema} />}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default Dashboard;