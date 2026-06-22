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
  const stateData = JSON.parse(
    decodeURIComponent(searchParams.get("state"))
  );

  const { email, erpUrl, authToken } = stateData;
  useEffect(() => {
    const code =
      searchParams.get("code");

    if (!code) return;

    async function connect() {
      try {
        const response = await fetch(
          "/api/google-calendar/connect",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              code,
              email,
              authToken,
              erpUrl,
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