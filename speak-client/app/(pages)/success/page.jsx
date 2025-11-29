"use client";

import { Suspense } from "react";
import SuccessPageContent from "./successpage";

export default function SuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessPageContent />
    </Suspense>
  );
}