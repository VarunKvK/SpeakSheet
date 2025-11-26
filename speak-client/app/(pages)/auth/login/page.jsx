"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient"; 
import { FileSpreadsheet, Loader2, Github } from "lucide-react";
import { Button } from "@/components/ui/button"; // Using your shadcn button
import { toast } from "sonner"; // Optional: for error messages

export default function Login() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 1. Check Session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace("/dashboard");
      } else {
        setCheckingSession(false);
      }
    };
    checkSession();

    // 2. Real-time Redirect
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        router.replace("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // --- CUSTOM GOOGLE LOGIN ---
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          // 🔑 KEY FIX: Include 'openid email profile' AND your custom scope
          // scopes: "openid email profile https://www.googleapis.com/auth/spreadsheets",
          scopes: "openid email profile",
          // queryParams: {
          //   access_type: "offline",
          //   prompt: "consent",
          // },
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Failed to connect to Google");
      setLoading(false);
    }
  };

  // --- CUSTOM GITHUB LOGIN (Optional - Remove if not needed) ---
  const handleGithubLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Failed to connect to GitHub");
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="text-sm text-emerald-800/60 font-mono">Verifying session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden selection:bg-emerald-100 selection:text-emerald-900">

      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#10b98108_1px,transparent_1px),linear-gradient(to_bottom,#10b98108_1px,transparent_1px)] bg-[size:40px_40px] -z-10" />

      <div className="w-full max-w-md p-8">
        {/* Logo Header */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-emerald-950">
            Welcome to SpeakSheet
          </h1>
          <p className="text-sm text-muted-foreground text-center">
            Sign in to start generating spreadsheets
          </p>
        </div>

        {/* Auth Card - REPLACED <Auth /> WITH CUSTOM BUTTONS */}
        <div className="bg-white/80 backdrop-blur-sm border-2 border-emerald-100 dark:border-emerald-900/30 rounded-sm p-8 shadow-xl shadow-emerald-100/50 flex flex-col gap-4">
          
          {/* Google Button */}
          <Button 
            onClick={handleGoogleLogin} 
            disabled={loading}
            className="w-full bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 h-12 rounded-sm transition-all shadow-sm"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <svg className="h-5 w-5 mr-2" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
              </svg>
            )}
            Sign in with Google
          </Button>

          {/* Separator */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white/80 px-2 text-slate-500">Or continue with</span>
            </div>
          </div>

          {/* GitHub Button */}
          <Button 
            onClick={handleGithubLogin}
            disabled={loading} 
            className="w-full bg-[#24292F] text-white hover:bg-[#24292F]/90 h-12 rounded-sm"
          >
            <Github className="mr-2 h-5 w-5" />
            GitHub
          </Button>

        </div>
      </div>
    </div>
  );
}