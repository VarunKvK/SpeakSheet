"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Download,
  FileSpreadsheet,
  RefreshCcw,
  LogOut,
  Loader2,
  Lock,
  Crown,
  Grid3X3,
  AlertCircle,
  LayoutTemplate
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";

// Child Components
import GenerateButton from "@/components/GenerateButton";
import PromptInput from "@/components/PromptInput";
import { SchemaPreview } from "@/components/SchemaPreview";
import { googleSheetsFlow } from "./functions/createGoogleSheets";

const Dashboard = () => {
  const router = useRouter();

  // --- 1. State Management ---
  const { user, session, loading: loadingUser } = useAuth();
  const [profile, setProfile] = useState(null);

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

  // --- 2. Computed Limits ---
  const MAX_DOWNLOADS = 3;
  const downloadsUsed = profile?.downloads_used || 0;
  const isPro = profile?.is_pro || false;
  const isLimitReached = user && !isPro && downloadsUsed >= MAX_DOWNLOADS;

  // --- 3. Auth & Initialization ---
  // --- 3. Auth & Initialization ---
  useEffect(() => {
    if (session?.provider_token) {
      setGoogleToken(session.provider_token);
    }

    if (user) {
      // Restore guest work from localStorage if available
      const savedWork = localStorage.getItem("guest_work_cache");
      if (savedWork) {
        try {
          const parsed = JSON.parse(savedWork);
          if (parsed.prompt) setPrompt(parsed.prompt);
          if (parsed.schema) setSchema(parsed.schema);
          if (parsed.excelUrl) setExcelUrl(parsed.excelUrl);
          if (parsed.fileSchema) setFileSchema(parsed.fileSchema);
          if (parsed.readfile) setReadFile(parsed.readfile);

          toast.success("Session restored", { description: "Your previous work is loaded." });
          localStorage.removeItem("guest_work_cache");
        } catch (e) {
          console.error("Failed to restore guest session", e);
        }
      }
    }
  }, [user, session]);

  // Fetch profile when user changes
  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("is_pro, downloads_used")
          .eq("id", user.id)
          .single();

        if (!error) setProfile(data);
      }
    };
    fetchProfile();
  }, [user]);

  // --- 4. Logic Handlers ---

  const handleReset = useCallback(() => {
    setPrompt("");
    setError("");
    setFile(null);
    setReadFile(null);
    setFileSchema(null);
    setSchema(null);
    setExcelUrl(null);
    localStorage.removeItem("guest_work_cache");
    toast.info("Workspace cleared");
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    handleReset();
    router.refresh();
  };

  const handleUpgrade = () => {
    router.push("/pricing");
  };

  const handleGuestAction = async () => {
    toast.info("Login Required", {
      description: "Saving your work and redirecting to login..."
    });

    const workToSave = { prompt, schema, excelUrl, fileSchema, readfile };
    localStorage.setItem("guest_work_cache", JSON.stringify(workToSave));

    setTimeout(() => {
      router.push("/auth/login");
    }, 1000);
  };

  const handleDownload = async () => {
    // 1. Guest Check
    if (!user) return handleGuestAction();

    // 2. Limit Check
    if (isLimitReached) {
      toast.error("Limit Reached", { description: "Upgrade to Pro for unlimited downloads." });
      return;
    }

    // 3. Success Action
    window.open(excelUrl, "_blank");
    toast.success("Download started");

    // 4. Update Usage (if free)
    if (!isPro) {
      const newCount = downloadsUsed + 1;
      setProfile({ ...profile, downloads_used: newCount }); // Optimistic UI update
      await supabase
        .from("profiles")
        .update({ downloads_used: newCount })
        .eq("id", user.id);
    }
  };

  const handleConnectGoogleSheets = async () => {
    if (!user) return handleGuestAction();

    if (isLimitReached) {
      toast.error("Limit Reached", { description: "Upgrade to export to Google Sheets." });
      return;
    }

    // Auth Check for Google
    if (!googleToken) {
      toast.info("Connecting...", { description: "Redirecting to Google authorization." });

      const currentWork = { prompt, schema, excelUrl, fileSchema, readfile };
      localStorage.setItem("guest_work_cache", JSON.stringify(currentWork));

      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          scopes: "openid email profile https://www.googleapis.com/auth/spreadsheets",
          queryParams: { access_type: "offline", prompt: "consent" },
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      return;
    }

    try {
      const result = await googleSheetsFlow(googleToken, schema, fileSchema, readfile);
      window.open(result, '_blank');
      toast.success("Spreadsheet created!");

      // Update Usage
      if (!isPro) {
        const newCount = downloadsUsed + 1;
        setProfile({ ...profile, downloads_used: newCount });
        await supabase.from("profiles").update({ downloads_used: newCount }).eq("id", user.id);
      }
    } catch (err) {
      console.error(err);
      if (err.message?.includes("401") || err.message?.includes("403")) {
        setGoogleToken(null);
        toast.error("Session expired", { description: "Please click again to re-authenticate." });
      } else {
        toast.error("Connection failed", { description: "Could not create Google Sheet." });
      }
    }
  };

  const getStatusLabel = () => {
    if (uploading) return "Processing...";
    if (excelUrl) return "Ready";
    return "Idle";
  };

  if (loadingUser) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col bg-white text-slate-900 font-sans overflow-hidden">

      {/* --- Navbar (Fixed Top) --- */}
      <header className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-4 lg:px-6 flex-none z-50 relative">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-emerald-600 text-white p-1 rounded-[4px]">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900">SpeakSheet</span>
          </Link>

          {/* Status Pill */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200">
            <div className={cn("h-2 w-2 rounded-full", uploading ? "bg-amber-500 animate-pulse" : excelUrl ? "bg-emerald-500" : "bg-slate-300")} />
            <span className="text-xs font-medium text-slate-600">
              {getStatusLabel()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-slate-500 hover:text-slate-900 text-sm font-medium hidden sm:flex"
          >
            <RefreshCcw className="h-3.5 w-3.5 mr-2" /> Reset
          </Button>

          <div className="h-6 w-[1px] bg-slate-200 hidden sm:block" />

          {user ? (
            <div className="flex items-center gap-4">
              {!isPro && (
                <Button
                  onClick={handleUpgrade}
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-4 rounded-md shadow-sm transition-all"
                >
                  <Crown className="h-3.5 w-3.5 mr-1.5" fill="currentColor" />
                  Upgrade
                </Button>
              )}

              <div className="hidden sm:flex flex-col items-end leading-none">
                <span className="text-xs font-bold text-slate-900">
                  {isPro ? "Pro Plan" : "Free Plan"}
                </span>
                <span className="text-[10px] text-slate-400 max-w-[120px] truncate">
                  {user.email}
                </span>
              </div>

              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-400 hover:text-slate-900">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button variant="default" size="sm" asChild className="bg-slate-900 text-white hover:bg-black">
              <Link href="/auth/login">Log In</Link>
            </Button>
          )}
        </div>
      </header>

      {/* --- Main Layout --- */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

        {/* --- LEFT SIDEBAR (Input) --- */}
        <div className="w-full lg:w-[420px] flex-none border-b lg:border-b-0 lg:border-r border-gray-200 bg-white flex flex-col z-20 lg:h-full order-1">

          {/* Usage Meter (Visible only if Logged In + Free) */}
          {user && !isPro && (
            <div className="px-6 py-3 bg-slate-50/80 border-b border-slate-100 flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Monthly Usage</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", isLimitReached ? "bg-red-500" : "bg-emerald-500")}
                    style={{ width: `${Math.min((downloadsUsed / MAX_DOWNLOADS) * 100, 100)}%` }}
                  />
                </div>
                <span className={cn("text-xs font-medium", isLimitReached ? "text-red-600" : "text-slate-700")}>
                  {downloadsUsed}/{MAX_DOWNLOADS}
                </span>
              </div>
            </div>
          )}

          {/* Limit Alert */}
          {isLimitReached && (
            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-100 rounded-md flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold text-red-700">Limit Reached</p>
                <p className="text-[11px] text-red-600 mt-0.5">You've used your 3 free generations.</p>
                <Link href="/pricing" className="text-[11px] font-bold text-red-700 underline mt-1 inline-block">Upgrade to unlock</Link>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-6">
            {/* Logic: Disable input container if limit reached */}
            <div className={cn("space-y-6 transition-opacity duration-200", isLimitReached && "opacity-50 pointer-events-none select-none")}>
              <div>
                <h1 className="text-lg font-bold text-slate-900">Create Spreadsheet</h1>
                <p className="text-xs text-slate-500 mt-1">Describe your needs or upload a file.</p>
              </div>

              <div className="bg-white rounded-lg">
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
                  // Pass props to enforce locking inside the component
                  isPro={isPro}
                  downloadsUsed={downloadsUsed}
                />

                <div className="mt-4">
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
          </div>

          <div className="p-3 text-center border-t border-gray-100 bg-slate-50/50 hidden lg:block">
            <p className="text-[10px] text-slate-400">AI can make mistakes. Review generated data.</p>
          </div>
        </div>

        {/* --- RIGHT PANEL (Preview) --- */}
        <div className="flex-1 flex flex-col bg-gray-50 relative overflow-hidden order-2 min-h-[500px] lg:h-full border-t lg:border-t-0 border-gray-200">

          {/* Preview Toolbar */}
          <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 flex-none">
            <div className="flex items-center gap-2 text-slate-500">
              <LayoutTemplate className="h-4 w-4" />
              <span className="text-sm font-medium text-slate-700">
                {schema ? "Preview" : "Canvas"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {excelUrl ? (
                <>
                  <Button
                    onClick={handleConnectGoogleSheets}
                    variant="outline"
                    size="sm"
                    className="h-8 border-gray-200 text-slate-600 bg-white hover:bg-green-50 hover:text-green-700 hover:border-green-200 text-xs"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 sm:mr-1.5" />
                    <span className="hidden sm:inline">Sheets</span>
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    onClick={handleDownload}
                    className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium"
                  >
                    <Link href={excelUrl} target="_blank">
                      <Download className="h-3.5 w-3.5 sm:mr-1.5" />
                      <span className="hidden sm:inline">Download .xlsx</span>
                    </Link>
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-sm">
                  <Lock className="h-3 w-3" />
                  Waiting for input
                </div>
              )}
            </div>
          </div>

          {/* Main Preview Grid */}
          <div className="flex-1 overflow-auto p-4 lg:p-8 relative">
            {schema ? (
              <div className="bg-white border border-gray-300 shadow-sm min-h-[400px] relative rounded-sm overflow-hidden">
                {/* Excel Headers */}
                <div className="flex border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
                  <div className="w-10 border-r border-gray-200 bg-gray-50"></div>
                  {['A', 'B', 'C', 'D', 'E'].map(col => (
                    <div key={col} className="flex-1 h-7 flex items-center justify-center text-[11px] font-bold text-slate-500 border-r border-gray-200 last:border-r-0">
                      {col}
                    </div>
                  ))}
                </div>
                <div className="flex">
                  {/* Row Numbers */}
                  <div className="w-10 flex-none border-r border-gray-200 bg-gray-50 flex flex-col sticky left-0 z-10">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                      <div key={n} className="h-9 flex items-center justify-center text-[10px] text-slate-400 border-b border-gray-100 bg-gray-50">
                        {n}
                      </div>
                    ))}
                  </div>
                  {/* Actual Data Schema */}
                  <div className="flex-1 p-0 overflow-x-auto bg-white">
                    <SchemaPreview schema={schema} />
                  </div>
                </div>
              </div>
            ) : (
              <EmptySpreadsheetState />
            )}
          </div>

          {/* Bottom Tabs */}
          <div className="h-8 bg-gray-100 border-t border-gray-200 flex items-end px-2 gap-1 flex-none">
            <div className="bg-white px-4 py-1 text-[11px] font-bold text-emerald-700 border-t border-x border-gray-300 shadow-[0_-1px_2px_rgba(0,0,0,0.05)] relative top-[1px]">
              Sheet1
            </div>
            <div className="bg-transparent px-3 py-1 text-slate-400 hover:bg-gray-200 rounded-t cursor-pointer transition-colors">
              <span className="text-xs font-bold">+</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Minimal Placeholder
const EmptySpreadsheetState = () => (
  <div className="h-full w-full flex flex-col items-center justify-center p-8 opacity-50 pointer-events-none select-none">
    <div className="w-48 h-48 bg-white border border-gray-200 grid grid-cols-3 grid-rows-4 gap-[1px] bg-gray-200 shadow-sm mb-4">
      {[...Array(12)].map((_, i) => <div key={i} className="bg-white" />)}
    </div>
    <p className="text-sm font-medium text-slate-400">Data preview will appear here</p>
  </div>
);

export default Dashboard;