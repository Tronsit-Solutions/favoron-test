import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.208.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const packageId = "fd0176b2-3ba8-4db2-81af-f60a0fd51e65";
    const userId = "54d1d9eb-a3b7-4f9c-871b-2f2e4cefd9b2";

    // Check content type to handle both JSON and multipart
    const contentType = req.headers.get("content-type") || "";
    
    let photoBytes: Uint8Array;
    
    if (contentType.includes("application/octet-stream") || contentType.includes("image/")) {
      // Raw binary upload
      photoBytes = new Uint8Array(await req.arrayBuffer());
    } else {
      // JSON with base64
      const body = await req.json();
      if (body.photoBase64) {
        // Decode base64
        const binaryStr = atob(body.photoBase64);
        photoBytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          photoBytes[i] = binaryStr.charCodeAt(i);
        }
      } else if (body.photoUrl) {
        const resp = await fetch(body.photoUrl);
        if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`);
        photoBytes = new Uint8Array(await resp.arrayBuffer());
      } else if (body.skipPhoto) {
        // Just update the DB without uploading a photo
        const storageRef = body.storageRef || `product-photos/${userId}/${packageId}_ref.jpeg`;
        
        const newProductsData = [
          {
            additionalNotes: null,
            estimatedPrice: "70.00",
            itemDescription: "Realice una compra en línea de shapedly pero me indican que no me pueden enviar el producto a guate. Entonces necesito una dirección en USA para que alguien me lo traiga. ",
            itemLink: "shapedly.com",
            needsOriginalPackaging: true,
            quantity: 1,
            requestType: "personal",
            productPhotos: [storageRef],
          },
        ];

        const { error: updateError } = await supabaseAdmin
          .from("packages")
          .update({ products_data: newProductsData })
          .eq("id", packageId);

        if (updateError) throw new Error(`Update error: ${updateError.message}`);

        return new Response(
          JSON.stringify({ success: true, storageRef, mode: "db-only" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        throw new Error("No photo data provided. Send photoBase64, photoUrl, or skipPhoto:true");
      }
    }

    // Upload to product-photos bucket
    const filePath = `${userId}/${packageId}_ref.jpeg`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("product-photos")
      .upload(filePath, photoBytes, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Upload error: ${uploadError.message}`);
    }

    const storageRef = `product-photos/${filePath}`;

    // Update products_data
    const newProductsData = [
      {
        additionalNotes: null,
        estimatedPrice: "70.00",
        itemDescription: "Realice una compra en línea de shapedly pero me indican que no me pueden enviar el producto a guate. Entonces necesito una dirección en USA para que alguien me lo traiga. ",
        itemLink: "shapedly.com",
        needsOriginalPackaging: true,
        quantity: 1,
        requestType: "personal",
        productPhotos: [storageRef],
      },
    ];

    const { error: updateError } = await supabaseAdmin
      .from("packages")
      .update({ products_data: newProductsData })
      .eq("id", packageId);

    if (updateError) throw new Error(`Update error: ${updateError.message}`);

    return new Response(
      JSON.stringify({ success: true, storageRef }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
