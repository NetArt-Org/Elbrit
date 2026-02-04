"use client";
import React, { createContext, useContext, useEffect } from "react";
import { LOGGED_IN_USER } from "@calendar/components/auth/calendar-users";
import { AUTH_CONFIG } from "@calendar/components/auth/calendar-users";

const AuthContext = createContext(null);

export function AuthProvider({
  children,
  erpUrl,
  authToken,
  me,
  homeUrl,
}) {
  // 🔐 Not logged in → redirect
  if (!authToken) {
    if (typeof window !== "undefined") {
      window.location.replace(homeUrl || "/");
    }
    return null;
  }

  // 🔁 Sync AUTH CONFIG (ONCE)
  useEffect(() => {
    AUTH_CONFIG.erpUrl = erpUrl;
    AUTH_CONFIG.authToken = authToken;
  }, [erpUrl, authToken]);

  // 🔁 Sync LOGGED_IN_USER (ONCE)
  useEffect(() => {
    if (!me) return;

    LOGGED_IN_USER.id = me.id || me.name || me.email;
    LOGGED_IN_USER.name = me.full_name || me.name;
    LOGGED_IN_USER.email = me.email;
    LOGGED_IN_USER.role = me.role || "System User";
    LOGGED_IN_USER.status = me.enabled ? "Active" : "Inactive";
  }, [me]);

  return (
    <AuthContext.Provider value={{ erpUrl, authToken, me }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
