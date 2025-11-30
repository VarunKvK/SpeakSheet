"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Check, ArrowRight, Copy, FileSpreadsheet, Download } from "lucide-react";
import confetti from "canvas-confetti";

export default function SuccessPageContent() {
  const params = useSearchParams();
  const router = useRouter();
  const checkoutId = params.get("checkoutId");


  // State for copying the ID
  const [copied, setCopied] = useState(false);

  // Trigger confetti on mount
  useEffect(() => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min, max) => {
      return Math.random() * (max - min) + min;
    };

    const interval = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const handleCopyId = () => {
    if (checkoutId) {
      navigator.clipboard.writeText(checkoutId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">

        {/* Header Section */}
        <div className="bg-green-50 p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4 shadow-sm ring-4 ring-white">
            <Check className="h-8 w-8 text-green-600" strokeWidth={3} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Successful!</h1>
          <p className="text-gray-600 mt-2">
            Welcome to the Pro plan. Your account has been upgraded.
          </p>
        </div>

        {/* Content Section */}
        <div className="p-8 space-y-6">

          {/* Transaction Receipt Box */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Transaction ID</span>
              {copied && <span className="text-xs text-green-600 font-medium animate-fade-in">Copied!</span>}
            </div>
            <div className="flex items-center justify-between">
              <code className="text-sm text-gray-700 font-mono truncate mr-2">
                {checkoutId || "Processing..."}
              </code>
              <button
                onClick={handleCopyId}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Copy ID"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Features Unlocked List */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-900">You can now:</p>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Upload and edit existing Excel files</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Export directly to Google Sheets</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Use advanced formulas (VLOOKUP, Pivot)</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <Link
              href="/workspace"
              className="w-full flex items-center justify-center gap-2 bg-black text-white hover:bg-gray-800 transition-all py-3 rounded-lg font-medium shadow-lg shadow-gray-200 hover:shadow-xl transform hover:-translate-y-0.5 duration-200"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Go to Dashboard
            </Link>

            <Link
              href="/"
              className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors py-3 rounded-lg font-medium"
            >
              Back to Home
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-500">
            A receipt has been sent to your email.
          </p>
        </div>
      </div>
    </div>
  );
}