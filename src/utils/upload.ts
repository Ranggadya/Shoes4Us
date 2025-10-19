import { supabase } from "@/lib/supabase";

export async function uploadProductImage(file: File) {
  try {
    const fileName = `${Date.now()}-${file.name}`;

    const { data, error } = await supabase.storage
      .from("products") // bucket di Supabase
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;

    const { data: publicUrl } = supabase.storage
      .from("products")
      .getPublicUrl(fileName);

    return publicUrl.publicUrl; 
  } catch (err) {
    console.error("Upload gagal:", err);
    throw err;
  }
}
