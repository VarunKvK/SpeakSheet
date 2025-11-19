"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  ArrowRight,
  Sparkles,
  Download,
  MessageSquare,
  Check,
  Table2,
  Grid3x3,
  Layout,
  Database,
  User,
  LogOut,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button"; 
import { supabase } from "@/lib/supabaseClient"; // Ensure this path matches your project

// --- Shared Design Elements ---

const Section = ({ children, className, id }) => (
  <section id={id} className={cn("relative py-20 md:py-32 overflow-hidden", className)}>
    {children}
  </section>
);

const GridPattern = () => (
  <div className="absolute inset-0 pointer-events-none select-none">
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#10b98108_1px,transparent_1px),linear-gradient(to_bottom,#10b98108_1px,transparent_1px)] bg-[size:40px_40px]" />
    <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
  </div>
);

const ExcelCard = ({ children, className }) => (
  <div className={cn(
    "group relative overflow-hidden bg-background border-2 border-emerald-100 dark:border-emerald-900/30 p-6 transition-all duration-300",
    "hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/10",
    "rounded-sm", // Sharp edges
    className
  )}>
    {/* Excel-like header strip on hover */}
    <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 transform -translate-y-full transition-transform duration-300 group-hover:translate-y-0" />
    {children}
  </div>
);

// --- Main Landing Page Component ---

export default function LandingPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Auth Check Logic
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-emerald-100 selection:text-emerald-900">

      {/* --- Navbar --- */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-emerald-100/50 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href={"/"} className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-emerald-600 text-white shadow-sm">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground hidden sm:inline-block">
              SpeakSheet
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
            ) : user ? (
              // --- STATE: LOGGED IN ---
              <div className="flex items-center gap-4 animate-in fade-in duration-300">
                <div className="hidden md:flex items-center gap-2 text-sm font-mono text-emerald-800 bg-emerald-50 px-3 py-1 rounded-sm border border-emerald-100">
                  <User className="h-3.5 w-3.5" />
                  <span className="max-w-[120px] truncate">{user.email}</span>
                </div>
                
                <Button asChild size="sm" className="rounded-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                  <Link href="/dashboard">
                    Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ) : (
              // --- STATE: LOGGED OUT ---
              <div className="flex items-center gap-4 animate-in fade-in duration-300">
                <Link href="/auth/login" className="text-sm font-medium text-muted-foreground hover:text-emerald-600 transition-colors">
                  Log in
                </Link>
                <Button asChild size="sm" className="rounded-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                  <Link href="/dashboard">
                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <Section className="pt-32 pb-20">
        <GridPattern />
        <div className="container relative z-10 mx-auto px-4 md:px-6 text-center">

          {/* Badge */}
          <div className="inline-flex items-center rounded-sm border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Sparkles className="mr-2 h-3.5 w-3.5" />
            {user ? "Welcome back to SpeakSheet" : "The modern way to start a spreadsheet"}
          </div>

          {/* Headlines */}
          <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight md:text-7xl lg:text-7xl text-foreground mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
            Turn Words into <br />
            <span className="text-emerald-600 relative inline-block">
              Spreadsheets.
              {/* Underline decoration */}
              <svg className="absolute w-full h-3 -bottom-1 left-0 text-emerald-200 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
              </svg>
            </span>{" "}
            Instantly.
          </h1>

          <p className="mx-auto max-w-2xl text-lg text-muted-foreground mb-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            Skip the setup. Describe what you need, and let AI structure, format,
            and generate a professional Excel file ready for use.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            {user ? (
               <Button asChild size="lg" className="h-12 px-8 rounded-sm bg-emerald-600 hover:bg-emerald-700 text-white text-base shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5">
                 <Link href="/dashboard">
                   Go to Workspace <ArrowRight className="ml-2 h-5 w-5" />
                 </Link>
               </Button>
            ) : (
               <Button asChild size="lg" className="h-12 px-8 rounded-sm bg-emerald-600 hover:bg-emerald-700 text-white text-base shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5">
                 <Link href="/dashboard">
                   Generate Sheet Free
                 </Link>
               </Button>
            )}
            
            <Button asChild variant="outline" size="lg" className="h-12 px-8 rounded-sm border-2 border-emerald-100 bg-transparent hover:bg-emerald-50 hover:text-emerald-700 text-base">
              <Link href="#templates">
                View Templates
              </Link>
            </Button>
          </div>

          {/* Hero Visual / Product Demo Mockup */}
          <div className="relative mx-auto max-w-5xl rounded-sm border-2 border-emerald-100 bg-background/50 p-2 backdrop-blur-sm shadow-2xl animate-in fade-in slide-in-from-bottom-12 duration-1000">
            <div className="rounded-sm border border-emerald-50 bg-background overflow-hidden">
              {/* Fake Excel Header */}
              <div className="flex items-center border-b border-emerald-100 bg-emerald-50/50 px-4 py-2">
                <div className="flex space-x-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-400/80" />
                  <div className="h-3 w-3 rounded-full bg-amber-400/80" />
                  <div className="h-3 w-3 rounded-full bg-emerald-400/80" />
                </div>
                <div className="mx-auto text-xs font-mono text-emerald-700 bg-white px-3 py-1 rounded-sm border border-emerald-100 shadow-sm">
                  generated_sheet.xlsx
                </div>
              </div>
              {/* Mock Content */}
              <div className="p-8 md:p-12 bg-[linear-gradient(to_right,#f0fdf4_1px,transparent_1px),linear-gradient(to_bottom,#f0fdf4_1px,transparent_1px)] bg-[size:20px_20px]">
                <div className="mx-auto max-w-2xl space-y-4">
                  {/* Prompt Input Mock */}
                  <div className="rounded-sm border-2 border-emerald-200 bg-white p-4 shadow-sm">
                    <p className="text-left text-lg text-foreground">
                      "Create a <span className="font-semibold text-emerald-600 bg-emerald-50 px-1">project tracker</span> with columns for Task Name, Assignee, Priority, and Due Date."
                    </p>
                  </div>
                  {/* Generation Animation Mock */}
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      <div className="h-2 w-16 bg-emerald-200 rounded-sm animate-pulse" />
                      <div className="h-2 w-24 bg-emerald-100 rounded-sm animate-pulse delay-75" />
                    </div>
                    <div className="text-xs font-mono text-emerald-600 animate-pulse">Processing...</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">No credit card required • Exports to .xlsx & .csv</p>
        </div>
      </Section>

      {/* --- Social Proof --- */}
      <div className="border-y border-emerald-100/50 bg-emerald-50/30 py-10">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs font-semibold tracking-wider text-emerald-800/60 uppercase mb-6">
            TRUSTED BY TEAMS ORGANIZING DATA AT
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 grayscale opacity-60">
            {/* Text logos for minimalism */}
            {['Acme Corp', 'Global Logistics', 'TechStart', 'DataFlow', 'UniSystems'].map((name) => (
              <span key={name} className="text-xl font-bold font-mono text-emerald-900/50 hover:text-emerald-700 transition-colors cursor-default">
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* --- How It Works (Grid) --- */}
      <Section id="how-it-works" className="bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">From Prompt to Product</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Three simple steps to turn your chaos into organized columns.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: MessageSquare,
                title: "1. Describe",
                desc: "Type a natural sentence describing your data needs, or upload an existing messy file."
              },
              {
                icon: Sparkles,
                title: "2. Detect",
                desc: "Our AI analyzes your request and auto-detects column names, data types, and structure."
              },
              {
                icon: Download,
                title: "3. Download",
                desc: "Review the schema preview, then download a perfectly formatted .xlsx file instantly."
              }
            ].map((step, i) => (
              <ExcelCard key={i} className="bg-slate-50/50">
                <div className="h-12 w-12 rounded-sm bg-emerald-100 flex items-center justify-center mb-6">
                  <step.icon className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.desc}
                </p>
              </ExcelCard>
            ))}
          </div>
        </div>
      </Section>

      {/* --- Use Cases (The "Grid" Layout) --- */}
      <Section id="templates" className="bg-emerald-900 text-white">
        {/* Dark Grid Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>

        <div className="container relative z-10 mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-2">What will you organize today?</h2>
              <p className="text-emerald-200/80">Select a use case or describe your own.</p>
            </div>
            <Button variant="outline" className="rounded-sm border-emerald-400 text-emerald-100 hover:bg-emerald-800 hover:text-white">
              See all examples
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: "HR & Admin", prompt: "Employee directory with Name, Role, Start Date, and Salary.", icon: Table2 },
              { title: "Inventory", prompt: "Warehouse stock list with SKU, Item Name, Quantity, and Reorder Level.", icon: Database },
              { title: "Marketing", prompt: "Content calendar with Post Topic, Platform, Status, and Publish Date.", icon: Layout },
              { title: "Sales", prompt: "Lead tracker with Company Name, Contact Person, Deal Value, and Probability.", icon: Grid3x3 },
            ].map((card, i) => (
              <div key={i} className="group cursor-pointer bg-emerald-800/50 border border-emerald-700/50 p-6 rounded-sm hover:bg-emerald-800 hover:border-emerald-500 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <card.icon className="h-5 w-5 text-emerald-400" />
                  <ArrowRight className="h-4 w-4 text-emerald-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </div>
                <h3 className="font-bold text-lg mb-2">{card.title}</h3>
                <p className="text-xs text-emerald-200/70 font-mono bg-emerald-900/50 p-2 rounded-sm border border-emerald-800">
                  "{card.prompt}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* --- Technical Specs / Features --- */}
      <Section className="bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
            <div className="flex-1 space-y-8">
              <h2 className="text-3xl font-bold tracking-tight">
                Built for the <span className="text-emerald-600">Spreadsheet Ecosystem</span>.
              </h2>
              <p className="text-lg text-muted-foreground">
                SpeakSheet doesn't just dump text. It intelligently assigns data types to columns—formatting currency as currency and dates as dates.
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  "Native .xlsx Export",
                  "Google Sheets Ready",
                  "Auto-width Columns",
                  "Clean Formatting",
                  "Apple Numbers Compatible",
                  "Smart Data Types"
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="flex-shrink-0 h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Check className="h-3 w-3 text-emerald-600" />
                    </div>
                    <span className="text-sm font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual representation of "Clean Data" */}
            <div className="flex-1 w-full max-w-md">
              <div className="relative rounded-sm border-2 border-emerald-100 bg-white shadow-xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="grid grid-cols-3 divide-x divide-emerald-100 border-b border-emerald-100 bg-emerald-50">
                  {['A', 'B', 'C'].map(col => (
                    <div key={col} className="py-2 px-4 text-center font-bold text-emerald-800">{col}</div>
                  ))}
                </div>
                {[1, 2, 3, 4, 5].map((row) => (
                  <div key={row} className="grid grid-cols-3 divide-x divide-emerald-100 border-b border-emerald-100 last:border-0 text-sm">
                    <div className="py-3 px-4 text-gray-600">Data Item {row}</div>
                    <div className="py-3 px-4 text-gray-600 text-right font-mono">$1,2{row}0.00</div>
                    <div className="py-3 px-4 text-emerald-600 font-medium text-center bg-emerald-50/30">Active</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* --- FAQ Section --- */}
      <Section className="bg-slate-50/50 border-t border-emerald-100/50">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl font-bold text-center mb-10">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              { q: "Is the file compatible with Google Sheets?", a: "Yes. We generate standard .xlsx files that work perfectly in Excel, Google Sheets, LibreOffice, and Numbers." },
              { q: "Can I upload my own data?", a: "Absolutely. You can upload existing .csv or .xlsx files for the AI to analyze and expand upon." },
              { q: "Is my data private?", a: "We process your file to generate the schema and delete the raw data immediately after generation." }
            ].map((item, i) => (
              <div key={i} className="rounded-sm border border-emerald-100 bg-white p-6">
                <h3 className="font-bold text-emerald-900 mb-2">{item.q}</h3>
                <p className="text-muted-foreground text-sm">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* --- Footer CTA --- */}
      <section className="py-24 border-t border-emerald-100">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold tracking-tight mb-6 text-emerald-950">
            Stop staring at empty cells.
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            Create your first structured spreadsheet in the next 30 seconds. No signup required to try.
          </p>
          <Button asChild size="lg" className="h-14 px-10 rounded-sm bg-emerald-600 hover:bg-emerald-700 text-white text-lg shadow-xl shadow-emerald-600/20">
            <Link href="/dashboard">
              Start Generating Now <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* --- Simple Footer --- */}
      <footer className="border-t border-emerald-100 bg-white py-8">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
            <span className="font-bold text-sm">SpeakSheet</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} SpeakSheet. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-emerald-600">Privacy</Link>
            <Link href="#" className="hover:text-emerald-600">Terms</Link>
            <Link href="#" className="hover:text-emerald-600">Twitter</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}