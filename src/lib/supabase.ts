// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnon);

// ─── Storage helpers ──────────────────────────────────────────────────────────

const BUCKET = "media-posters";

export async function uploadPoster(file: File, itemId: string): Promise<string | null> {
  const ext  = file.name.split(".").pop();
  const path = `${itemId}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
  if (error) { console.error("Upload error:", error); return null; }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function deletePoster(imageUrl: string): Promise<void> {
  const path = imageUrl.split(`${BUCKET}/`)[1];
  if (!path) return;
  await supabase.storage.from(BUCKET).remove([path]);
}
