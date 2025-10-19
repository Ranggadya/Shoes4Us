import { supabase } from "./supabase";

export async function uploadProductImage(file: File): Promise<string> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = `products/${fileName}`;

  const { error } = await supabase.storage
    .from(process.env.SUPABASE_PUBLIC_BUCKET!)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw new Error(`Upload gagal: ${error.message}`);

  const { data: publicUrl } = supabase.storage
    .from(process.env.SUPABASE_PUBLIC_BUCKET!)
    .getPublicUrl(filePath);

  return publicUrl.publicUrl; 
}
