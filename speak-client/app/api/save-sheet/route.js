import { supabase } from "@/lib/supabaseClient";

export async function POST(request) {
  const { userId ,prompt, schema, fileUrl } = await request.json();
  if (!userId || !fileUrl) {
    return new Response(JSON.stringify({ error: "Missing user_id or file_url" }), { status: 400 });
  }
  const res = await supabase.from("sheet_history").insert([
    {
      prompt,
      schema,
      fileUrl,
      created_at: new Date().toISOString(),
    },
  ]);

  return Response.json(body);
}
