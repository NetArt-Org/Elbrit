"use client";

import { useEffect } from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

export default function GoogleCallback() {
  const router = useRouter();
  const searchParams =
    useSearchParams();

  useEffect(() => {
    const code =
      searchParams.get("code");

    if (!code) return;

    const email =
    searchParams.get("state");

    async function connect() {
      try {
        const response = await fetch(
          "/api/google-calendar/connect",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              code,
              email,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(
            "Google connection failed"
          );
        }

        router.push("/");
      } catch (error) {
        console.error(error);
      }
    }

    connect();
  }, [router, searchParams]);

  return (
    <div className="p-4">
      Connecting Google Calendar...
    </div>
  );
}