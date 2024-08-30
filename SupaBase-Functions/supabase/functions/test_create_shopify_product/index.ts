import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Initialize Supabase Client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  try {
    const { name, email, additional_information, price } = await req.json();

    // Post the lead to Shopify
    const response = await fetch(`${Deno.env.get("SHOPIFY_URL_1")}/admin/api/2024-07/products.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": Deno.env.get("SHOPIFY_ACCESS_TOKEN_1"),
      },
      body: JSON.stringify({
        product: {
          title: `Lead: ${name}`,
          body_html: `<strong>Lead Details:</strong><br>${additional_information}`,
          vendor: "TestRooferScout",
          product_type: "Roofing Service",
          variants: [
            {
              price: price,
              sku: email,
              inventory_quantity: 1,
            },
          ],
        },
      }),
    });

    if (response.ok) {
      return new Response("Lead posted to Shopify successfully!", { status: 200 });
    } else {
      const error = await response.json();
      console.error("Shopify API Error:", error);
      return new Response("Failed to post lead to Shopify", { status: 500 });
    }
  } catch (error) {
    console.error("Error processing lead:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
});
