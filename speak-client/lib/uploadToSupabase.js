import { supabase } from "./supabaseClient";
import { v4 as uuidv4 } from "uuid";

export async function uploadToSupabase(file, user_id, customName) {
  if (!file || !user_id) throw new Error("File or user ID missing");

  const ext = file.name.split(".").pop();
  const filename = customName || `${uuidv4()}.${ext}`;
  const filepath = `${user_id}/${filename}`;

  // Upload file to 'sheets' bucket
  const { error } = await supabase.storage
    .from("sheets")
    .upload(filepath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) throw error;

  // Get a public URL
  const { data } = supabase.storage.from("sheets").getPublicUrl(filepath);

  return {
    publicUrl: data.publicUrl,
    path: filepath,
    filename,
  };
}
