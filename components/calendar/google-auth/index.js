"use client";

import { useEffect, useState } from "react";
import { fetchGoogleCalendarStatus } from "@calendar/services/event.service";
import { useAuth } from "@calendar/components/auth/auth-context";
import { Button } from "@calendar/components/ui/button";

const GOOGLE_CLIENT_ID =
  "509894256351-tisqk3jtvv14majfi3l8gigi0mq8ndhd.apps.googleusercontent.com";

const REDIRECT_URI =
  "https://erp.elbrit.org?cmd=frappe.integrations.doctype.google_calendar.google_calendar.google_callback";

export default function GoogleCalendarConnect() {
  const { me } = useAuth();

  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    async function checkCalendar() {
      if (!me?.email) return;

      const calendar = await fetchGoogleCalendarStatus(
        me.email
      );

      const isConnected =
        calendar?.enable === 1 &&
        !!calendar?.refresh_token &&
        !!calendar?.google_calendar_id;

      setConnected(isConnected);
      setLoading(false);
    }

    checkCalendar();
  }, [me]);

  const handleGoogleConnect = () => {
    const authUrl =
      "https://accounts.google.com/o/oauth2/v2/auth?" +
      new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: "code",
        scope:
          "https://www.googleapis.com/auth/calendar",
        access_type: "offline",
        prompt: "consent",

        // optional - helps identify ERP user
        state: me?.email || "",
      });

    window.location.href = authUrl;
  };

  if (loading) return null;

  if (connected) {
    return (
      <div className="text-green-600">
        ✓ Google Calendar Connected
      </div>
    );
  }

  return (
    <Button  onClick={handleGoogleConnect}>
      Connect Google Calendar
    </Button>
  );
}