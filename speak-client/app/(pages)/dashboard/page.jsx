"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Download,
  FileSpreadsheet,
  LayoutGrid,
  Zap,
  RefreshCcw,
  LogOut,
  Loader2,
  Lock,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Child Components
import GenerateButton from "@/components/GenerateButton";
import PromptInput from "@/components/PromptInput";
import { SchemaPreview } from "@/components/SchemaPreview";
import { googleSheetsFlow } from "./functions/createGoogleSheets";
import { connectGoogleSheet } from "./functions/connectGoogleSheet";

const Dashboard = () => {
  const router = useRouter();

  // --- State Management ---
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Input State
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState("");

  // File State
  const [file, setFile] = useState(null);
  const [readfile, setReadFile] = useState(null);
  const [fileSchema, setFileSchema] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Output State
  const [schema, setSchema] = useState(null);
  const [excelUrl, setExcelUrl] = useState(null);
  const [googleToken, setGoogleToken] = useState(null);

  // --- Authentication & State Restoration ---
  useEffect(() => {
    const initSession = async () => {
      try {
        setLoadingUser(true);
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Supabase session error:", error);
        }
        if (session) {
          setUser(session.user);
          if (session?.provider_token) {
            setGoogleToken(session.provider_token); // store in state
          }
          // --- RESTORE GUEST WORK ---

          // Check if there is saved work from before they logged in
          const savedWork = localStorage.getItem("guest_work_cache");

          if (savedWork) {
            try {
              const parsed = JSON.parse(savedWork);

              // Restore State
              if (parsed.prompt) setPrompt(parsed.prompt);
              if (parsed.schema) setSchema(parsed.schema);
              if (parsed.excelUrl) setExcelUrl(parsed.excelUrl);
              if (parsed.fileSchema) setFileSchema(parsed.fileSchema);
              // Note: We cannot easily restore the 'File' object itself, 
              // but we can restore the parsed data needed for generation.
              if (parsed.readfile) setReadFile(parsed.readfile);

              toast.success("Welcome! We restored your generated sheet.");

              // Clear cache so it doesn't overwrite future work
              localStorage.removeItem("guest_work_cache");
            } catch (e) {
              console.error("Failed to restore guest session", e);
            }
          }
        } else {
          // Guest Mode
          setUser(null);
        }
      } catch (err) {
        console.error("Auth Init Error:", err);
      } finally {
        setLoadingUser(false);
      }
    };
    initSession();
  }, []);

  // --- Actions ---

  const handleReset = useCallback(() => {
    setPrompt("");
    setError("");
    setFile(null);
    setReadFile(null);
    setFileSchema(null);
    setSchema(null);
    setExcelUrl(null);
    // Also clear local storage just in case
    localStorage.removeItem("guest_work_cache");
    toast.info("Workspace cleared");
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    handleReset(); // Clear screen on logout
    toast.success("Logged out successfully");
    router.refresh();
  };

  // --- UPDATED GUEST HANDLER ---
  const handleGuestDownloadClick = () => {
    toast.info("Redirecting to Login...", {
      description: "We are saving your sheet so it's ready when you get back."
    });

    // 1. Save current state to LocalStorage
    const workToSave = {
      prompt,
      schema,
      excelUrl,
      fileSchema,
      readfile, // This is the JSON data, safe to stringify
      // We skip 'file' because File objects aren't serializable
    };

    localStorage.setItem("guest_work_cache", JSON.stringify(workToSave));

    // 2. Redirect
    setTimeout(() => {
      router.push("/auth/login");
    }, 1000);
  };


  // Use the existing function, do NOT use signInWithOAuth here
  const handleConnectGoogleSheets = async () => {
    console.log("Connecting to Google Sheets...");

    // 1. Check if we have the token
    if (!googleToken) {
      toast.error("Missing Google permissions. Redirecting to login...");

      const currentWork = {
        prompt, schema, excelUrl, fileSchema, readfile
      };
      localStorage.setItem("guest_work_cache", JSON.stringify(currentWork));

      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          scopes: "openid email profile https://www.googleapis.com/auth/spreadsheets",
          queryParams: {
            access_type: "offline",
            prompt: "consent", 
          },
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      return;
    }
    try {
      const result = await googleSheetsFlow(googleToken, schema ,fileSchema, readfile);
      console.log("Hello")
      window.open(result, '_blank');
      toast.success("Spreadsheet created!");
    } catch (err) {
      console.error(err);
      if(err.message.includes("401") || err.message.includes("403") || err.message.includes("insufficient")) {
         setGoogleToken(null);
         toast.error("Session expired. Please click the Google Sheets button again to re-authenticate.");
      } else {
         toast.error("Failed to connect to Google Sheets.");
      }
    }
  };

  const getAppStatus = () => {
    if (uploading) return "Analyzing File Structure...";
    if (excelUrl) return "Generation Successful";
    if (schema && !excelUrl) return "Building Excel File...";
    return "Ready for Input";
  };

  if (loadingUser) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
        <p className="text-emerald-800/60 font-mono text-sm animate-pulse">
          Initializing Workspace...
        </p>
      </div>
    );
  }

  return (
    <main className="flex h-screen w-full flex-col bg-background overflow-hidden selection:bg-emerald-100 selection:text-emerald-900">

      {/* --- 1. App Navbar --- */}
      <header className="flex h-14 flex-none items-center justify-between border-b border-emerald-100/50 px-6 backdrop-blur-sm bg-white/80 dark:bg-background/80 z-20">
        <Link href={"/"} className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-emerald-600 text-white shadow-sm">
            <FileSpreadsheet className="h-4 w-4" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground hidden sm:inline-block">
            SpeakSheet
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-muted-foreground hover:text-emerald-600 h-8 px-2"
          >
            <RefreshCcw className="h-3.5 w-3.5 mr-1.5" />
            <span className="text-xs font-medium">New Sheet</span>
          </Button>

          <div className="h-4 w-[1px] bg-border mx-1" />

          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2 py-1 rounded-sm border border-emerald-100 max-w-[150px] truncate hidden md:inline-block">
                {user.email}
              </span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleLogout} title="Logout">
                <LogOut className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          ) : (
            <Button variant="default" size="sm" asChild className="h-8 bg-emerald-600 hover:bg-emerald-700">
              <Link href="/auth/login">Log In</Link>
            </Button>
          )}
        </div>
      </header>

      {/* --- 2. Main Workspace --- */}
      <div className="flex flex-1 overflow-hidden relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#10b98108_1px,transparent_1px),linear-gradient(to_bottom,#10b98108_1px,transparent_1px)] bg-[size:40px_40px] -z-10" />

        <div className="container mx-auto flex h-full flex-col lg:flex-row gap-6 p-4 lg:p-6">

          {/* LEFT PANEL */}
          <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-1 lg:max-w-lg lg:min-w-[420px] pb-20 lg:pb-0">
            <div className="space-y-1 mt-2">
              <h1 className="text-2xl font-bold tracking-tight text-emerald-950 dark:text-emerald-50">
                AI Spreadsheet Architect
              </h1>
              <p className="text-muted-foreground text-sm">
                {user ? "Describe your data needs naturally." : "Guest Mode: Generate logic freely. Login to download."}
              </p>
            </div>

            <div className="group relative rounded-sm border-2 border-emerald-200/60 bg-white/50 p-1 transition-all hover:border-emerald-300 hover:bg-white/80 dark:bg-background/50 shadow-sm">
              <div className="space-y-6 bg-background p-5 rounded-sm">
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
                  setReadFile={setReadFile}
                  setFileSchema={setFileSchema}
                  user={user || { id: "guest-user" }}
                />

                <div className="flex justify-end pt-2 border-t border-dashed border-emerald-100">
                  <GenerateButton
                    prompt={prompt}
                    fileUrl={file}
                    readfile={readfile}
                    fileSchema={fileSchema}
                    user={user}
                    setSchema={(newSchema) => {
                      setExcelUrl(null);
                      setSchema(newSchema);
                    }}
                    setExcelUrl={setExcelUrl}
                    setUploading={setUploading}
                  />
                </div>
              </div>
            </div>

            {/* Tip / Promo */}
            {!user && (
              <div className="rounded-sm border border-emerald-100 bg-emerald-50/50 p-4 flex gap-3 animate-in fade-in">
                <User className="h-4 w-4 text-emerald-600 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-800">Guest Mode</h4>
                  <p className="text-xs text-emerald-700/80">Your work is saved locally. We'll restore it after you log in.</p>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT PANEL */}
          <div className="flex-[1.5] flex flex-col h-full min-h-[400px] overflow-hidden rounded-sm border-2 border-emerald-200/40 bg-white/40 backdrop-blur-md shadow-xl shadow-emerald-100/20 relative transition-all duration-500">
            <div className="h-1 w-full bg-gradient-to-r from-emerald-400 to-emerald-600" />

            <div className="flex items-center justify-between border-b border-emerald-100 bg-white/80 px-4 py-3">
              <div className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-bold text-emerald-900">
                  {schema ? "Blueprint Preview" : "Canvas"}
                </span>
              </div>

              {/* --- LOGIC FOR DOWNLOADING --- */}
              {excelUrl && (
                user ? (
                  // Case A: User Logged In -> Show Download  
                  <div className="flex gap-2">
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-sm border-emerald-600 text-emerald-700 hover:bg-emerald-50 animate-in zoom-in duration-300"
                    >
                      <Link href={excelUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 h-3.5 w-3.5" />
                        Download .xlsx
                      </Link>
                    </Button>
                    <Button onClick={handleConnectGoogleSheets} className="h-8 rounded-sm border-emerald-300 text-emerald-700 hover:bg-emerald-50 animate-in zoom-in duration-300">
                      <FileSpreadsheet />
                    </Button>
                  </div>
                ) : (
                  // Case B: Guest -> Show Login Lock
                  <Button
                    size="sm"
                    onClick={handleGuestDownloadClick}
                    className="h-8 rounded-sm bg-emerald-600 hover:bg-emerald-700 text-white animate-in zoom-in duration-300"
                  >
                    <Lock className="mr-2 h-3.5 w-3.5" />
                    Login to Download
                  </Button>
                )
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-white/60 relative">
              {schema ? (
                <SchemaPreview schema={schema} />
              ) : (
                <EmptyGridState />
              )}
            </div>
          </div>
        </div>
      </div>

      <footer className="h-8 flex-none border-t border-emerald-100 bg-emerald-50 flex items-center justify-between px-4 text-[10px] font-medium text-emerald-800 uppercase tracking-wide z-30">
        <div className="flex items-center gap-4">
          <span className={cn("flex items-center gap-1.5", uploading ? "text-amber-600" : "text-emerald-700")}>
            <div className={cn("h-2 w-2 rounded-full transition-all", uploading ? "bg-amber-500 animate-ping" : "bg-emerald-500")} />
            {getAppStatus()}
          </span>
          <span className="hidden md:inline-block opacity-60">
            {user ? "User: Active" : "User: Guest"}
          </span>
        </div>
      </footer>
    </main>
  );
};

const EmptyGridState = () => (
  <div className="absolute inset-0 flex flex-col items-center justify-center opacity-30 pointer-events-none select-none">
    <div className="w-full max-w-md space-y-3 scale-95 grayscale">
      <div className="h-8 w-full bg-emerald-900/10 rounded-sm" />
      <div className="space-y-1">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex gap-1">
            <div className="h-6 w-10 bg-emerald-900/5 rounded-sm" />
            <div className="h-6 flex-1 bg-emerald-900/5 rounded-sm" />
            <div className="h-6 flex-1 bg-emerald-900/5 rounded-sm" />
            <div className="h-6 flex-1 bg-emerald-900/5 rounded-sm" />
          </div>
        ))}
      </div>
    </div>
    <div className="mt-8 text-center space-y-1">
      <p className="text-lg font-bold text-emerald-900">Workspace Empty</p>
      <p className="text-sm text-emerald-800/80">Define your requirements to generate a schema.</p>
    </div>
  </div>
);

export default Dashboard;