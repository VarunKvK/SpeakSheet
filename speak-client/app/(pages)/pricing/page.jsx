"use client";

import { useEffect, useState } from "react";
import { Check, ArrowRight, Loader2, FileSpreadsheet, User } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PricingPage() {
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);

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

    
    const handleUpgrade = () => {
        setLoading(true);

        // Hardcoded ID as requested
        const productId = "0a08efac-6bd4-4fed-bcf3-4c29051df605";

        if (!user) {
            console.error("User session not found");
            setLoading(false);
            return;
        }

        const email = encodeURIComponent(user.email);
        const externalId = encodeURIComponent(user.id);

        window.location.href = `/api/payment/checkout?products=${productId}&customerEmail=${email}&customerExternalId=${externalId}`;
    };

    return (
        <div className="min-h-screen bg-white text-gray-900 relative flex items-center justify-center p-4 font-sans">

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
                                    <Link href="/workspace">
                                        Workspace <ArrowRight className="ml-2 h-4 w-4" />
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
                                    <Link href="/workspace">
                                        Get Started <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>
            {/* CSS Grid Background to match Excel sheets */}
            <div
                className="absolute inset-0 z-0 pointer-events-none opacity-[0.4]"
                style={{
                    backgroundImage: `
            linear-gradient(to right, #e5e7eb 1px, transparent 1px),
            linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
          `,
                    backgroundSize: '40px 40px'
                }}
            />

            {/* Main Container - Styled like a selected cell block */}
            <div className="relative z-10 w-full max-w-3xl bg-white border-2 border-gray-900">

                {/* Header Strip - Looks like Excel row headers */}
                <div className="bg-gray-50 border-b border-gray-200 p-4 flex items-center justify-between">
                    <div className="flex gap-2">
                        <span className="h-3 w-3 bg-red-400 rounded-full opacity-0"></span> {/* Spacer/Mac buttons mock hidden */}
                    </div>
                    <div className="text-xs font-mono text-gray-500 tracking-widest uppercase">
                        PRO_LIFETIME.xlsx
                    </div>
                    <div className="w-4"></div>
                </div>

                <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x border-gray-200">

                    {/* Left Side: The Pitch */}
                    <div className="p-8 flex flex-col justify-center bg-white">
                        <h2 className="text-3xl font-bold tracking-tight mb-4 text-gray-900">
                            Stop renting <br />
                            <span className="text-emerald-600">your software.</span>
                        </h2>
                        <p className="text-gray-600 mb-8 leading-relaxed">
                            Skip the monthly subscriptions. Pay once and transform unlimited text into spreadsheets forever.
                        </p>

                        {/* Price Tag */}
                        <div className="mt-auto">
                            <div className="flex items-start gap-1">
                                <span className="text-6xl font-bold text-gray-900 tracking-tighter">$9</span>
                                <div className="flex flex-col pt-2">
                                    <span className="text-xs font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5">One-time</span>
                                    <span className="text-xs text-gray-500 line-through mt-1">$29</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: The Features & Action */}
                    <div className="p-8 bg-gray-50/50 flex flex-col justify-between">

                        <div className="mb-8">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-6">Included in Pro</h3>
                            <ul className="space-y-4">
                                <Feature text="Unlimited AI File Generations" />
                                <Feature text="Upload & Edit Existing Files" strong />
                                <Feature text="Export to Google Sheets" />
                                <Feature text="Advanced Formulas (VLOOKUP, IF)" />
                                <Feature text="Priority Processing" />
                            </ul>
                        </div>

                        {/* The Excel-Style Button */}
                        <button
                            onClick={handleUpgrade}
                            disabled={loading}
                            className="group w-full relative overflow-hidden bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-200 h-14 flex items-center justify-center gap-3 font-semibold text-lg border-2 border-emerald-700 hover:border-emerald-800 disabled:opacity-80 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    Get Lifetime Access
                                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>

                        <p className="text-center text-xs text-gray-400 mt-4">
                            Secure payment. 30-day money-back guarantee.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Minimal Feature Component
function Feature({ text, strong = false }) {
    return (
        <li className="flex items-start gap-3">
            {/* Square checkbox style to match spreadsheet vibe */}
            <div className="flex-shrink-0 w-5 h-5 border border-emerald-200 bg-emerald-50 flex items-center justify-center mt-0.5">
                <Check className="h-3.5 w-3.5 text-emerald-600" strokeWidth={3} />
            </div>
            <span className={`text-sm ${strong ? 'text-gray-900 font-semibold bg-emerald-50/50 px-1 -ml-1' : 'text-gray-600'}`}>
                {text}
            </span>
        </li>
    );
}