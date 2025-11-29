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
  Zap,
  LayoutTemplate,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Child Components
import GenerateButton from "@/components/GenerateButton";
import PromptInput from "@/components/PromptInput";
import { SchemaPreview } from "@/components/SchemaPreview";
import { googleSheetsFlow } from "./functions/createGoogleSheets";

const Dashboard = () => {
  const router = useRouter();

  // --- State ---
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [profile, setProfile] = useState(null);

  // Inputs
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState("");

  // Files
  const [file, setFile] = useState(null);
  const [readfile, setReadFile] = useState(null);
  const [fileSchema, setFileSchema] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Outputs
  const [schema, setSchema] = useState(null);
  const [excelUrl, setExcelUrl] = useState(null);
  const [googleToken, setGoogleToken] = useState(null);

  // --- Computed Limits ---
  const MAX_DOWNLOADS = 3;
  const downloadsUsed = profile?.downloads_used || 0;
  const isPro = profile?.is_pro || false;
  
  // Lock the interface if: User exists AND is NOT pro AND has hit limit
  const isLimitReached = user && !isPro && downloadsUsed >= MAX_DOWNLOADS;

  // --- Auth & Init ---
  useEffect(() => {
    const initSession = async () => {
      try {
        setLoadingUser(true);
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setUser(session.user);
          if (session?.provider_token) setGoogleToken(session.provider_token);

          // Restore guest work
          const savedWork = localStorage.getItem("guest_work_cache");
          if (savedWork) {
            try {
              const parsed = JSON.parse(savedWork);
              if (parsed.prompt) setPrompt(parsed.prompt);
              if (parsed.schema) setSchema(parsed.schema);
              if (parsed.excelUrl) setExcelUrl(parsed.excelUrl);
              if (parsed.fileSchema) setFileSchema(parsed.fileSchema);
              if (parsed.readfile) setReadFile(parsed.readfile);
              toast.success("Previous session restored");
              localStorage.removeItem("guest_work_cache");
            } catch (e) { console.error(e); }
          }
        }
      } catch (err) {
        console.error("Auth Init Error:", err);
      } finally {
        setLoadingUser(false);
      }
    };
    initSession();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("is_pro, downloads_used")
          .eq("id", user.id)
          .single();
        if (data) setProfile(data);
      }
    };
    fetchProfile();
  }, [user]);

  // --- Actions ---
  const handleReset = useCallback(() => {
    setPrompt("");
    setError("");
    setFile(null);
    setReadFile(null);
    setFileSchema(null);
    setSchema(null);
    setExcelUrl(null);
    localStorage.removeItem("guest_work_cache");
    toast.info("Canvas reset");
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    handleReset();
    router.refresh();
  };

  const handleUpgrade = () => {
    router.push("/pricing");
  };

  const handleDownload = async () => {
    if (!user) {
      toast.info("Save your work", { description: "Please login to download." });
      const workToSave = { prompt, schema, excelUrl, fileSchema, readfile };
      localStorage.setItem("guest_work_cache", JSON.stringify(workToSave));
      setTimeout(() => router.push("/auth/login"), 800);
      return;
    }

    if (isLimitReached) {
      toast.error("Limit reached", { description: "Please upgrade to Pro." });
      return;
    }

    window.open(excelUrl, "_blank");

    if (!isPro) {
      // Increment usage
      const newCount = downloadsUsed + 1;
      setProfile({ ...profile, downloads_used: newCount });
      await supabase
        .from("profiles")
        .update({ downloads_used: newCount })
        .eq("id", user.id);
    }
  };

  const handleConnectGoogleSheets = async () => {
    if (isLimitReached) return toast.error("Limit reached");

    if (!googleToken) {
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
      toast.success("Sheet created");
      
      if (!isPro) {
        const newCount = downloadsUsed + 1;
        setProfile({ ...profile, downloads_used: newCount });
        await supabase.from("profiles").update({ downloads_used: newCount }).eq("id", user.id);
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not connect to Google Sheets");
    }
  };

  if (loadingUser) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-gray-900" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col bg-white text-gray-900 font-sans selection:bg-green-100">
      
      {/* --- Navbar --- */}
      <header className="h-16 border-b border-gray-100 flex items-center justify-between px-6 bg-white z-20">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-gray-900 text-white p-1.5 rounded-sm">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <span className="font-bold tracking-tight">SpeakSheet</span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {user && !isPro && (
            <div className="hidden md:flex flex-col items-end">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Monthly Plan
              </div>
              <div className={`text-xs font-medium ${isLimitReached ? "text-red-600" : "text-gray-900"}`}>
                {downloadsUsed} / {MAX_DOWNLOADS} used
              </div>
            </div>
          )}
          
          <div className="h-4 w-[1px] bg-gray-100 hidden md:block" />

          {user ? (
            <div className="flex items-center gap-3">
              {!isPro && (
                <Button 
                  onClick={handleUpgrade} 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700 text-white rounded-sm h-8 text-xs font-medium"
                >
                  <Zap className="h-3 w-3 mr-1.5" /> Upgrade
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8 text-gray-400 hover:text-gray-900">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button variant="default" size="sm" asChild className="bg-gray-900 text-white rounded-sm h-8">
              <Link href="/auth/login">Log In</Link>
            </Button>
          )}
        </div>
      </header>

      {/* --- Main Content --- */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* --- Left Panel: Input --- */}
        <div className="w-full lg:w-[400px] border-r border-gray-100 flex flex-col bg-white relative z-10">
          
          {/* Limit Blocker Overlay */}
          {isLimitReached && (
            <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
              <div className="max-w-xs space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <div className="h-12 w-12 bg-red-50 rounded-full flex items-center justify-center mx-auto border border-red-100">
                  <Lock className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Limit Reached</h3>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                    You have used all your free generations for this month.
                  </p>
                </div>
                <Button onClick={handleUpgrade} className="w-full bg-gray-900 hover:bg-black text-white rounded-sm">
                  Upgrade Now
                </Button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-6 lg:p-8">
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-bold text-gray-900">New Sheet</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Describe your needs or upload a file.
                </p>
              </div>

              {/* Input Component Wrapper */}
              <div className="space-y-4">
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
                  profile={profile}
                />
                
                <div className="pt-2">
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

              {/* Helpful tips if empty */}
              {!prompt && !file && (
                <div className="mt-8 border border-dashed border-gray-200 rounded-sm p-4 bg-gray-50/50">
                  <h4 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">Examples</h4>
                  <ul className="space-y-2 text-xs text-gray-600">
                    <li className="cursor-pointer hover:text-green-600 transition-colors" onClick={() => setPrompt("Track monthly marketing budget with categories, planned vs actual, and variance.")}>
                      • Track monthly marketing budget...
                    </li>
                    <li className="cursor-pointer hover:text-green-600 transition-colors" onClick={() => setPrompt("Project timeline with tasks, owners, start dates, deadlines and status.")}>
                      • Project timeline with tasks and owners...
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border-t border-gray-100 flex justify-between items-center">
             <button onClick={handleReset} className="text-xs text-gray-400 hover:text-gray-900 flex items-center gap-1 transition-colors">
               <RefreshCcw className="h-3 w-3" /> Clear Canvas
             </button>
             <div className="text-[10px] text-gray-300 font-mono">v1.0</div>
          </div>
        </div>

        {/* --- Right Panel: Preview --- */}
        <div className="flex-1 bg-gray-50/30 flex flex-col relative">
          
          {/* Background Grid Effect */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
              backgroundSize: '20px 20px'
            }}
          />

          {/* Toolbar */}
          <div className="h-14 border-b border-gray-100 bg-white/50 backdrop-blur-sm px-6 flex items-center justify-between flex-none z-10">
            <div className="flex items-center gap-2 text-gray-500">
              <LayoutTemplate className="h-4 w-4" />
              <span className="text-sm font-medium">
                {schema ? "Generated Preview" : "Empty Canvas"}
              </span>
            </div>

            {excelUrl && (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
                <Button
                  onClick={handleConnectGoogleSheets}
                  variant="outline"
                  size="sm"
                  className="h-8 border-gray-200 text-gray-600 hover:bg-white hover:text-green-600"
                >
                  Sheets
                </Button>
                <Button
                  asChild
                  size="sm"
                  onClick={handleDownload}
                  className="h-8 bg-gray-900 hover:bg-black text-white rounded-sm"
                >
                  <Link href={excelUrl} target="_blank">
                    <Download className="h-3.5 w-3.5 mr-2" />
                    Download
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {/* Preview Area */}
          <div className="flex-1 overflow-auto p-4 lg:p-8 relative">
             {schema ? (
               <div className="bg-white border border-gray-200 shadow-sm min-h-[400px] rounded-sm overflow-hidden">
                  {/* Fake Excel Headers */}
                  <div className="flex border-b border-gray-100 bg-gray-50">
                     <div className="w-10 border-r border-gray-100"></div>
                     <div className="flex-1 h-6 flex items-center px-2 text-[10px] text-gray-400 font-mono bg-gray-50">A</div>
                     <div className="flex-1 h-6 flex items-center px-2 text-[10px] text-gray-400 font-mono bg-gray-50 border-l border-gray-100">B</div>
                     <div className="flex-1 h-6 flex items-center px-2 text-[10px] text-gray-400 font-mono bg-gray-50 border-l border-gray-100">C</div>
                  </div>
                  <div className="flex">
                    {/* Row Numbers */}
                    <div className="w-10 flex-none border-r border-gray-100 bg-gray-50 flex flex-col">
                      {[1,2,3,4,5,6,7,8].map(n => (
                        <div key={n} className="h-10 flex items-center justify-center text-[10px] text-gray-400 font-mono border-b border-gray-50">{n}</div>
                      ))}
                    </div>
                    {/* Real Schema Component */}
                    <div className="flex-1 p-0 overflow-x-auto">
                      <SchemaPreview schema={schema} />
                    </div>
                  </div>
               </div>
             ) : (
               <div className="h-full flex flex-col items-center justify-center text-center opacity-30 select-none">
                 <div className="w-24 h-24 border-2 border-dashed border-gray-400 rounded-sm mb-4 flex items-center justify-center">
                   <LayoutTemplate className="h-8 w-8 text-gray-400" />
                 </div>
                 <p className="text-sm font-medium text-gray-900">No Data Generated</p>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;