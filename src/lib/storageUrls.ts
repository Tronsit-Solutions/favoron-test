import { supabase } from "@/integrations/supabase/client";

export type StorageRef = { bucket: string; filePath: string };

export function parseStorageRef(input?: string | null): StorageRef | null {
  if (!input) return null;
  const val = input.trim();
  
  // If looks like a plain path like "bucket/path/to/file.jpg"
  if (!val.startsWith("http")) {
    const firstSlash = val.indexOf("/");
    if (firstSlash > 0) {
      return { bucket: val.slice(0, firstSlash), filePath: val.slice(firstSlash + 1) };
    }
    return null;
  }

  // If it's a Supabase Storage URL
  const marker = "/storage/v1/object/";
  const idx = val.indexOf(marker);
  if (idx === -1) return null;
  
  // Get the path part and remove query parameters (like tokens, expiry, etc.)
  const pathPart = val.slice(idx + marker.length).split("?")[0];
  const parts = pathPart.split("/").filter(Boolean);
  if (parts.length < 2) return null;

  // Handle signed URLs: /storage/v1/object/sign/<bucket>/<path>
  // Handle public URLs: /storage/v1/object/public/<bucket>/<path>
  if (parts[0] === "sign" || parts[0] === "public") {
    if (parts.length < 3) return null;
    const bucket = parts[1];
    const filePath = parts.slice(2).join("/");
    return { bucket, filePath };
  }

  // Handle direct object URLs: /storage/v1/object/<bucket>/<path>
  const bucket = parts[0];
  const filePath = parts.slice(1).join("/");
  return { bucket, filePath };
}

export async function resolveSignedUrl(input?: string | null, expiresInSeconds = 3600): Promise<string | null> {
  if (!input) return null;
  const parsed = parseStorageRef(input);
  // If not a storage reference we assume it's a valid absolute URL
  if (!parsed) return input;
  const { bucket, filePath } = parsed;
  try {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(filePath, expiresInSeconds);
    if (error) {
      console.error("Error creating signed URL:", error);
      return input; // Fallback to original input (might still be a valid URL)
    }
    return data?.signedUrl ?? input;
  } catch (e) {
    console.error("Exception creating signed URL:", e);
    return input;
  }
}
