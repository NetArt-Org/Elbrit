import { GOOGLE_CALENDAR, SAVE_GOOGLE_CALENDAR } from "@calendar/components/calendar/google-auth/queries";
import { NextResponse } from "next/server";

const ERP_URL =
  process.env.NEXT_PUBLIC_ERP_URL;

const ERP_TOKEN =
  process.env.ERP_AUTH_TOKEN;

async function erpGraphql(
  query,
  variables
) {
  const response = await fetch(
    ERP_URL,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
        Authorization:
          `token ${ERP_TOKEN}`,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    }
  );

  return response.json();
}

export async function POST(req) {
  try {
    const {
      code,
      email,
    } = await req.json();

    const redirectUri =
      `${process.env.APP_URL}/google-callback`;
      console.log({
        code,
        clientId: process.env.GOOGLE_CLIENT_ID,
        hasSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        redirectUri,
      });
    // Exchange code for tokens
    const tokenResponse = await fetch(
        "https://oauth2.googleapis.com/token",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret:
              process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: redirectUri,
            grant_type: "authorization_code",
          }),
        }
      );
      
      const tokenData = await tokenResponse.json();
      console.log({
        code,
        clientId: process.env.GOOGLE_CLIENT_ID,
        hasSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        redirectUri,
      });
      console.log(
        "GOOGLE TOKEN RESPONSE:",
        JSON.stringify(tokenData, null, 2)
      );
      
      if (!tokenData.access_token) {
        return NextResponse.json(
          {
            success: false,
            tokenData,
          },
          { status: 500 }
        );
      }

    // Get primary calendar
    const calendarResponse =
      await fetch(
        "https://www.googleapis.com/calendar/v3/users/me/calendarList",
        {
          headers: {
            Authorization:
              `Bearer ${tokenData.access_token}`,
          },
        }
      );

    const calendarData =
      await calendarResponse.json();

    const primary =
      calendarData.items?.find(
        (item) => item.primary
      );

    const googleCalendarId =
      primary?.id;

    // Verify document exists
    const existing =
      await erpGraphql(
        GOOGLE_CALENDAR,
        {
          name: email,
        }
      );

    if (
      !existing?.data
        ?.GoogleCalendar?.name
    ) {
      throw new Error(
        `Google Calendar doc not found for ${email}`
      );
    }

    // Update DocType
    const doc = {
      name: email,
      enable: 1,
      authorization_code:
        code,
      refresh_token:
        tokenData.refresh_token,
      google_calendar_id:
        googleCalendarId,
    };

    await erpGraphql(
      SAVE_GOOGLE_CALENDAR,
      {
        doc:
          JSON.stringify(doc),
      }
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message:
          error.message,
      },
      { status: 500 }
    );
  }
}