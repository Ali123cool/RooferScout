import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { gql, request } from "https://esm.sh/graphql-request";

// Initialize Supabase Client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Use the correct environment variables for Shopify
const shopifyUrl = Deno.env.get("SHOPIFY_URL_1")!;
const shopifyAccessToken = Deno.env.get("SHOPIFY_ACCESS_TOKEN_1")!;

// GraphQL Mutation for creating a product in Shopify
const CREATE_PRODUCT_MUTATION = gql`
  mutation CreateProduct($input: ProductInput!) {
    productCreate(input: $input) {
      product {
        id
        title
        descriptionHtml
        vendor
        tags
        productType
        variants(first: 1) {
          edges {
            node {
              id
              sku
              price
              requiresShipping
            }
          }
        }
        metafields(first: 10) {
          edges {
            node {
              namespace
              key
              value
            }
          }
        }
      }
    }
  }
`;

serve(async (req) => {
  try {
    // Extract the payload from the request
    const payload = await req.json();
    const newRecord = payload.record;

    // Extract necessary fields from the new record
    const {
      id,
      product_title,
      product_description,
      product_category,
      product_price,
      product_type,
      product_vendor,
      client_full_name,
      client_business_name,
      client_email,
      client_phone_number,
      client_street_address_full,
      lead_source_company_name,
      client_city,
      client_state,
      industry,
      service_timing,
      demand,
      time_posted
    } = newRecord;

    // Build the input for Shopify product creation
    const input = {
      title: product_title,
      descriptionHtml: product_description,
      vendor: product_vendor,
      tags: [client_city, client_state, industry, product_category],
      productType: product_type,
      variants: [
        {
          sku: "digital lead",
          price: product_price,
          requiresShipping: false,
        },
      ],
      metafields: [
        { namespace: "custom", key: "lead_id", value: id },
        { namespace: "custom", key: "client_full_name", value: client_full_name },
        { namespace: "custom", key: "client_business_name", value: client_business_name },
        { namespace: "custom", key: "client_email", value: client_email },
        { namespace: "custom", key: "client_phone_number", value: client_phone_number },
        { namespace: "custom", key: "client_street_address_full", value: client_street_address_full },
        { namespace: "custom", key: "lead_source_company_name", value: lead_source_company_name },
        { namespace: "custom", key: "client_city", value: client_city },
        { namespace: "custom", key: "client_state", value: client_state },
        { namespace: "custom", key: "industry", value: industry },
        { namespace: "custom", key: "service_timing", value: service_timing },
        { namespace: "custom", key: "demand", value: demand },
        { namespace: "custom", key: "time_posted", value: time_posted },
      ],
    };

    // Send the request to Shopify
    const response = await request(shopifyUrl, CREATE_PRODUCT_MUTATION, { input }, {
      "X-Shopify-Access-Token": shopifyAccessToken,
      "Content-Type": "application/json",
    });

    if (response.errors) {
      console.error('Shopify Product Creation Error:', response.errors);
      return new Response(JSON.stringify({ message: 'Failed to create product in Shopify', errors: response.errors }), { status: 500 });
    }

    console.log('Product successfully created in Shopify:', response.productCreate.product);
    return new Response(JSON.stringify({ message: 'Product successfully created in Shopify' }), { status: 200 });

  } catch (err) {
    console.error('Unexpected error:', err.message);
    return new Response(JSON.stringify({ message: 'Unexpected error occurred', error: err.message }), { status: 500 });
  }
});
