"use client";

import { useEffect } from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

export default function GoogleCallbackContent() {
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

        const data =
          await response.json();

        console.log(
          "Google connect response",
          data
        );

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Google connection failed"
          );
        }

        router.push("/");
      } catch (error) {
        console.error(
          "Google connect error",
          error
        );
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