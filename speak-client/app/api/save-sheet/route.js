import { supabase } from "@/lib/supabaseClient";

export async function POST(request) {
  try {
    const { userId, prompt, schema, fileUrl } = await request.json();

    // 🚫 Validate required fields
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Missing userId" }),
        { status: 400 }
      );
    }

    // 📝 Build insert payload dynamically
    const payload = {
      user_id: userId,
      prompt: prompt || null,
      schema: schema || null,
      created_at: new Date().toISOString(),
    };

    // Only include file_url if provided
    if (fileUrl) {
      payload.file_url = fileUrl;
    }

    // ✅ Insert into Supabase
    const { data, error } = await supabase
      .from("sheet_history")
      .insert([payload])
      .select();

    if (error) {
      console.error("Supabase insert error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to save sheet history", details: error.message }),
        { status: 500 }
      );
    }

    return new Response(JSON.stringify({ success: true, data }), { status: 200 });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Unexpected server error", details: err.message }),
      { status: 500 }
    );
  }
}