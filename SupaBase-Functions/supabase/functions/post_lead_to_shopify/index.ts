import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Initialize Supabase Client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

const shopifyGraphQLUrl = `${Deno.env.get("SHOPIFY_URL_1")!}/admin/api/2024-07/graphql.json`;
const shopifyRestUrl = `${Deno.env.get("SHOPIFY_URL_1")!}/admin/api/2024-07/products`;
const shopifyAccessToken = Deno.env.get("SHOPIFY_ACCESS_TOKEN_1")!;

serve(async (req) => {
  try {
    const payload = await req.json();
    const newRecord = payload.record;

    console.log("New Record:", newRecord);

    const {
      id,
      product_title,
      product_description,
      product_vendor,
      product_type,
      client_city,
      client_state,
      industry,
      client_full_name,
      client_business_name,
      client_email,
      client_phone_number,
      client_street_address_full,
      lead_source_company_name,
      service_timing,
      demand,
      time_posted
    } = newRecord;

    // Replace \n with <br> tags for HTML formatting
    const formattedDescription = product_description.replace(/\n/g, '<br>');

    // Create product mutation
    const mutation = `
      mutation {
        productCreate(input: {
          title: "${product_title}",
          descriptionHtml: "${formattedDescription}",
          vendor: "${product_vendor}",
          productType: "${product_type}",
          tags: ["${client_city}", "${client_state}", "${industry}"],
          metafields: [
            { namespace: "custom", key: "lead_id", value: "${id}", type: "single_line_text_field" },
            { namespace: "custom", key: "client_full_name", value: "${client_full_name}", type: "single_line_text_field" },
            { namespace: "custom", key: "client_business_name", value: "${client_business_name}", type: "single_line_text_field" },
            { namespace: "custom", key: "client_email", value: "${client_email}", type: "single_line_text_field" },
            { namespace: "custom", key: "client_phone_number", value: "${client_phone_number}", type: "single_line_text_field" },
            { namespace: "custom", key: "client_street_address_full", value: "${client_street_address_full}", type: "single_line_text_field" },
            { namespace: "custom", key: "lead_source_company_name", value: "${lead_source_company_name}", type: "single_line_text_field" },
            { namespace: "custom", key: "city", value: "${client_city}", type: "single_line_text_field" },
            { namespace: "custom", key: "state", value: "${client_state}", type: "single_line_text_field" },
            { namespace: "custom", key: "industry", value: "${industry}", type: "single_line_text_field" },
            { namespace: "custom", key: "service_timing", value: "${service_timing}", type: "single_line_text_field" },
            { namespace: "custom", key: "demand", value: "${demand}", type: "single_line_text_field" },
            { namespace: "custom", key: "time_posted", value: "${time_posted}", type: "date_time" }
          ]
        }) {
          product {
            id
            title
            descriptionHtml
            variants(first: 1) {
              edges {
                node {
                  id
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const createProductResponse = await fetch(shopifyGraphQLUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": shopifyAccessToken,
      },
      body: JSON.stringify({ query: mutation }),
    });

    const createProductJsonResponse = await createProductResponse.json();

    if (createProductJsonResponse.errors || createProductJsonResponse.data.productCreate.userErrors.length > 0) {
      console.error('Shopify Product Creation Error:', createProductJsonResponse.errors || createProductJsonResponse.data.productCreate.userErrors);
      return new Response(JSON.stringify({ message: 'Failed to create product in Shopify', errors: createProductJsonResponse.errors || createProductJsonResponse.data.productCreate.userErrors }), { status: 500 });
    }

    const createdProduct = createProductJsonResponse.data.productCreate.product;
    if (!createdProduct) {
      console.error('Product creation returned null or undefined:', createProductJsonResponse);
      return new Response(JSON.stringify({ message: 'Product creation failed; received null response from Shopify.' }), { status: 500 });
    }

    console.log('Product successfully created in Shopify:', createdProduct);

    // Step 2: Update the product via REST API to uncheck "This is a physical product"
    const productId = createdProduct.id.split('/').pop(); // Extract product ID
    const variantId = createdProduct.variants.edges[0].node.id.split('/').pop(); // Extract variant ID

    const updateProductResponse = await fetch(`${shopifyRestUrl}/${productId}.json`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": shopifyAccessToken,
      },
      body: JSON.stringify({
        product: {
          id: productId,
          variants: [
            {
              id: variantId,
              requires_shipping: false
            }
          ]
        }
      }),
    });

    const updateProductJsonResponse = await updateProductResponse.json();

    if (updateProductJsonResponse.errors) {
      console.error('Shopify Product Update Error:', updateProductJsonResponse.errors);
      return new Response(JSON.stringify({ message: 'Failed to update product in Shopify', errors: updateProductJsonResponse.errors }), { status: 500 });
    }

    console.log('Product successfully created and updated in Shopify:', createdProduct);
    return new Response(JSON.stringify({ message: 'Product successfully created and updated in Shopify', product: createdProduct }), { status: 200 });

  } catch (err) {
    console.error("Unexpected error:", err.message);
    return new Response(JSON.stringify({ message: "Unexpected error occurred", error: err.message }), { status: 500 });
  }
});
