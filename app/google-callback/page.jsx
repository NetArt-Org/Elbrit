"use client";

import GoogleCallbackContent from "@calendar/app/google-callback/GoogleCallbackContent";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4">
          Connecting Google Calendar...
        </div>
      }
    >
      <GoogleCallbackContent />
    </Suspense>
  );
}