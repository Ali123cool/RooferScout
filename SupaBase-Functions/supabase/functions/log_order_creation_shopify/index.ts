import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Initialize Supabase Client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Shopify API details
const shopifyGraphQLUrl = `${Deno.env.get("SHOPIFY_URL_1")!}/admin/api/2024-07/graphql.json`;
const shopifyRestUrl = `${Deno.env.get("SHOPIFY_URL_1")!}/admin/api/2024-07/products`;
const shopifyAccessToken = Deno.env.get("SHOPIFY_ACCESS_TOKEN_1")!;

async function fetchLeadIdFromShopify(productId) {
  const url = `${shopifyRestUrl}/${productId}/metafields.json`;
  
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "X-Shopify-Access-Token": shopifyAccessToken,
      "Content-Type": "application/json"
    }
  });

  const data = await response.json();

  // Assuming lead_id is stored in a specific namespace and key in the metafields
  const leadMetafield = data.metafields?.find(mf => mf.namespace === 'custom' && mf.key === 'lead_id');
  return leadMetafield ? leadMetafield.value : null;
}

serve(async (req) => {
  try {
    const payload = await req.json();
    console.log("Received JSON payload:", JSON.stringify(payload, null, 2));

    const { id, created_at, line_items, customer, current_total_price, current_total_tax } = payload;

    const note = customer.note || '';
    const phoneMatch = note.match(/Phone Number:\s*(\S+)/);
    const companyNameMatch = note.match(/Company Name:\s*(.+)/);
    const hasDocsMatch = note.match(/Has Documentation:\s*(Yes|No)/);

    const phoneNumber = phoneMatch ? phoneMatch[1] : null;
    const companyName = companyNameMatch ? companyNameMatch[1] : null;
    const hasDocs = hasDocsMatch ? (hasDocsMatch[1] === 'Yes') : false;

    const orderId = id;
    const orderPriceWithDiscountAndTaxes = parseFloat(current_total_price);
    const orderPriceTaxAmount = parseFloat(current_total_tax);

    for (const item of line_items) {
      // Fetch lead_id from Shopify metafields before insertion
      const leadId = await fetchLeadIdFromShopify(item.product_id);
      const leadOriginalPrice = parseFloat(item.price);

      // Insert data into the Supabase table
      const { data, error } = await supabase
        .from('lead_sold')  // Replace with your actual table name
        .insert([
          {
            lead_id: leadId,  // Directly insert the fetched lead_id
            lead_sold_timestamp: created_at,
            lead_original_price: leadOriginalPrice,
            buying_company_name: companyName,
            buying_company_agent_name: `${customer.first_name} ${customer.last_name}`,
            buying_company_agent_email: customer.email,
            buying_company_agent_phone: phoneNumber,
            does_company_have_proper_docs: hasDocs,
            order_id: orderId,
            order_price_with_discount_and_taxes: orderPriceWithDiscountAndTaxes,
            order_price_tax_amount: orderPriceTaxAmount,
            additional_shopify_product_id: item.product_id,  // Store product_id in new column
            title: item.title
          }
        ]);

      if (error) {
        console.error("Error inserting data into Supabase:", error);
        continue;
      } else {
        console.log(`Successfully inserted data for product ${item.title} with lead_id: ${leadId}`);
      }
    }

    return new Response("Data processed successfully", { status: 200 });

  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(`Error processing request: ${error.message}`, { status: 500 });
  }
});
