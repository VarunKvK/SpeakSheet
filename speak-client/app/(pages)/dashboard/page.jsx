"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { 
  Download, 
  FileSpreadsheet, 
  LayoutGrid, 
  Zap, 
  RefreshCcw, 
  LogOut,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Child Components
import GenerateButton from "@/components/GenerateButton";
import PromptInput from "@/components/PromptInput";
import { SchemaPreview } from "@/components/SchemaPreview";

/**
 * Dashboard Component
 * 
 * Serves as the "Brain" of the application.
 * Manages global state, authentication, and data flow between Input and Preview.
 */
const Dashboard = () => {
  // --- State Management ---
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Input State
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState("");
  
  // File State
  const [file, setFile] = useState(null);       // The actual file object or URL string
  const [readfile, setReadFile] = useState(null); // The parsed JSON content of the file
  const [fileSchema, setFileSchema] = useState(null); // The AI-analyzed structure of the file
  const [uploading, setUploading] = useState(false);

  // Output State
  const [schema, setSchema] = useState(null);   // The generated schema for preview
  const [excelUrl, setExcelUrl] = useState(null); // The final download URL

  // --- Authentication & Init ---
  useEffect(() => {
    const initSession = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        setUser(user);
      } catch (err) {
        console.error("Session Error:", err);
        // Ideally, redirect to login here if this page is protected
        // router.push('/login');
      } finally {
        setLoadingUser(false);
      }
    };
    initSession();
  }, []);

  // --- Actions ---

  /**
   * Robust Reset: Clears all state to allow a fresh start without reloading page.
   */
  const handleReset = useCallback(() => {
    setPrompt("");
    setError("");
    setFile(null);
    setReadFile(null);
    setFileSchema(null);
    setSchema(null);
    setExcelUrl(null);
    toast.info("Workspace cleared", { duration: 2000 });
  }, []);

  /**
   * Logout Handler
   */
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    toast.success("Logged out successfully");
    window.location.href = "/"; // Hard refresh to clear any cached auth state
  };

  // Determine Status Bar Text
  const getAppStatus = () => {
    if (uploading) return "Analyzing File Structure...";
    if (excelUrl) return "Generation Successful";
    if (schema && !excelUrl) return "Building Excel File...";
    return "Ready for Input";
  };

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
           {/* Clear / New Sheet Button */}
           <Button 
             variant="ghost" 
             size="sm" 
             onClick={handleReset}
             className="text-muted-foreground hover:text-emerald-600 h-8 px-2"
             title="Reset Workspace"
           >
             <RefreshCcw className="h-3.5 w-3.5 mr-1.5" />
             <span className="text-xs font-medium">New Sheet</span>
           </Button>

           <div className="h-4 w-[1px] bg-border mx-1" />

           {/* User Profile */}
           {loadingUser ? (
             <div className="h-8 w-8 rounded-full bg-emerald-100 animate-pulse" />
           ) : user ? (
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
               <Link href="/auth/login">Login</Link>
             </Button>
           )}
        </div>
      </header>

      {/* --- 2. Main Workspace (Split View) --- */}
      <div className="flex flex-1 overflow-hidden relative">
         {/* Background Grid Pattern */}
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#10b98108_1px,transparent_1px),linear-gradient(to_bottom,#10b98108_1px,transparent_1px)] bg-[size:40px_40px] -z-10" />
         
         <div className="container mx-auto flex h-full flex-col lg:flex-row gap-6 p-4 lg:p-6">
            
            {/* --- LEFT PANEL: Input & Controls --- */}
            <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-1 lg:max-w-lg lg:min-w-[420px] pb-20 lg:pb-0">
               
               {/* Context Header */}
               <div className="space-y-1 mt-2">
                  <h1 className="text-2xl font-bold tracking-tight text-emerald-950 dark:text-emerald-50">
                    AI Spreadsheet Architect
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    Describe your data needs naturally. We handle the logic.
                  </p>
               </div>

               {/* Input Card */}
               <div className="group relative rounded-sm border-2 border-emerald-200/60 bg-white/50 p-1 transition-all hover:border-emerald-300 hover:bg-white/80 dark:bg-background/50 shadow-sm">
                  <div className="space-y-6 bg-background p-5 rounded-sm">
                    <PromptInput
                      value={prompt}
                      promptValue={setPrompt}
                      setError={setError}
                      error={error}
                      maxLength={500}
                      // File Props
                      setFile={setFile}
                      file={file}
                      uploading={uploading}
                      setUploading={setUploading}
                      setReadFile={setReadFile}
                      setFileSchema={setFileSchema}
                      user={user || { id: "guest" }} // Fallback for non-logged in UI prev
                    />
                    
                    <div className="flex justify-end pt-2 border-t border-dashed border-emerald-100">
                      <GenerateButton
                        prompt={prompt}
                        fileUrl={file}
                        readfile={readfile}
                        fileSchema={fileSchema}
                        user={user}
                        // State Setters
                        setSchema={(newSchema) => {
                           // When schema updates, we clear old excel URL to avoid confusion
                           setExcelUrl(null); 
                           setSchema(newSchema);
                        }}
                        setExcelUrl={setExcelUrl}
                        setUploading={setUploading}
                      />
                    </div>
                  </div>
               </div>

               {/* Quick Tip */}
               <div className="rounded-sm border border-blue-100 bg-blue-50/30 p-4 flex gap-3 animate-in fade-in slide-in-from-left-4 duration-700">
                  <Zap className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                     <h4 className="text-xs font-bold text-blue-700 uppercase">Pro Tip</h4>
                     <p className="text-xs text-blue-600/80 leading-relaxed">
                        Try asking for specific validations: <span className="italic">"Create an inventory sheet where Quantity cannot be negative."</span>
                     </p>
                  </div>
               </div>
            </div>

            {/* --- RIGHT PANEL: Live Preview / Results --- */}
            <div className="flex-[1.5] flex flex-col h-full min-h-[400px] overflow-hidden rounded-sm border-2 border-emerald-200/40 bg-white/40 backdrop-blur-md shadow-xl shadow-emerald-100/20 relative transition-all duration-500">
               {/* Ribbon Decoration */}
               <div className="h-1 w-full bg-gradient-to-r from-emerald-400 to-emerald-600" />
               
               {/* Panel Header */}
               <div className="flex items-center justify-between border-b border-emerald-100 bg-white/80 px-4 py-3">
                  <div className="flex items-center gap-2">
                     <LayoutGrid className="h-4 w-4 text-emerald-600" />
                     <span className="text-sm font-bold text-emerald-900">
                        {schema ? "Blueprint Preview" : "Canvas"}
                     </span>
                  </div>
                  {excelUrl && (
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
                  )}
               </div>

               {/* Panel Content Area */}
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

      {/* --- 3. Status Bar --- */}
      <footer className="h-8 flex-none border-t border-emerald-100 bg-emerald-50 flex items-center justify-between px-4 text-[10px] font-medium text-emerald-800 uppercase tracking-wide z-30">
         <div className="flex items-center gap-4">
            <span className={cn("flex items-center gap-1.5 transition-colors", uploading ? "text-amber-600" : "text-emerald-700")}>
               <div className={cn("h-2 w-2 rounded-full transition-all", uploading ? "bg-amber-500 animate-ping" : "bg-emerald-500")} />
               {getAppStatus()}
            </span>
            <span className="hidden md:inline-block text-emerald-800/20">|</span>
            <span className="hidden md:inline-block opacity-60">
               {file ? "File Mode: Active" : "Mode: Prompt"}
            </span>
         </div>
         <div className="opacity-50 font-mono">
            v1.2.0
         </div>
      </footer>

    </main>
  );
};

// --- Empty State Component ---
const EmptyGridState = () => (
  <div className="absolute inset-0 flex flex-col items-center justify-center opacity-30 pointer-events-none select-none">
     {/* Visual Ghost Grid */}
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