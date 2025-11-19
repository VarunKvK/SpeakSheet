"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient"; // Ensure path is correct
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Login() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    // 1. Check if user is already logged in
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace("/dashboard"); // Use replace to prevent going back to login
      } else {
        setCheckingSession(false);
      }
    };

    checkSession();

    // 2. Listen for Auth State Changes (Real-time redirect)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        router.replace("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

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

        {/* Auth Card */}
        <div className="bg-white/80 backdrop-blur-sm border-2 border-emerald-100 dark:border-emerald-900/30 rounded-sm p-6 shadow-xl shadow-emerald-100/50">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#059669', // Emerald 600
                    brandAccent: '#047857', // Emerald 700
                    inputText: '#0f172a',
                    inputBorder: '#e2e8f0',
                    inputLabelText: '#64748b',
                  },
                  radii: {
                    borderRadiusButton: '2px', // Sharp edges for Excel vibe
                    borderRadiusInput: '2px',
                  },
                },
              },
              className: {
                button: "font-medium shadow-sm",
                input: "bg-white",
              }
            }}
            providers={["google", "github"]} // Add providers if you have enabled them in Supabase
            redirectTo={`${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`}
            theme="light"
            showLinks={true}
          />
        </div>
      </div>
    </div>
  );
}