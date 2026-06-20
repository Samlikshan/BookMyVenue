import { supabaseAdmin } from "./apps/api/src/config/supabase.js";
import dotenv from "dotenv";
import path from "path";

// Load env
dotenv.config({ path: path.resolve("apps/api/.env") });

async function test() {
  const bucketName = "venue-images";
  const storagePath = `venues/test-venue/images/test-${Date.now()}.jpg`;
  
  console.log("Env SUPABASE_URL:", process.env.SUPABASE_URL);
  console.log("Env Key length:", process.env.SUPABASE_SERVICE_ROLE_KEY?.length);
  
  const { data, error } = await supabaseAdmin.storage
    .from(bucketName)
    .createSignedUploadUrl(storagePath);
    
  if (error) {
    console.error("Error creating signed upload URL:", error);
  } else {
    console.log("Success:", data);
  }
}

test().catch(console.error);
