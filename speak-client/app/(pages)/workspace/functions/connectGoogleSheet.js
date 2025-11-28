import { supabase } from "@/lib/supabaseClient"

export async function connectGoogleSheet() {
    const {data,error} = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
            scopes: "openid email profile https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets",
            queryParams: {
                access_type: "offline",
                prompt: "consent",
              },
            redirectTo: `${window.location.origin}/auth/callback`
        }
    })
    return {data , error}
}