"use client";
import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AuthListener() {
  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const user = session.user;
          const { error } = await supabase.from("profiles").upsert({
            id: user.id,
            email: user.email,
            created_at: new Date().toISOString(),
          });

          if (error) console.error("Profile upsert error:", error);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return null;
}