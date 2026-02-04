"use client";

import React, { Suspense } from "react";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarSkeleton } from "@/components/calendar/skeletons/calendar-skeleton";
import { AuthProvider } from "@/components/auth/auth-context";

export default function CalendarPage({
  erpUrl,
  authToken,
  me,
  homeUrl,
}) {
  console.log("DATA",erpUrl,authToken,me,homeUrl,`token ${authToken}`)
  return (
    <AuthProvider
      erpUrl={erpUrl}
      authToken={authToken}
      me={me}
      homeUrl={homeUrl}
    >
      <Suspense fallback={<CalendarSkeleton />}>
        <Calendar />
      </Suspense>
    </AuthProvider>
  );
}
