import { supabase } from "./supabaseClient";
import { v4 as uuidv4 } from "uuid";
export async function uploadToSupabase(file) {
  if (!file) throw new Error("File or user ID missing");

  const ext = file.name.split(".").pop();
  const filename = `${uuidv4()}.${ext}`;
  const filepath = `${uuidv4()}/${filename}`;

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
