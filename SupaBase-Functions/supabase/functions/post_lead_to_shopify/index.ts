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

    console.log("Step 1: Received new record");

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
      time_posted,
      product_price
    } = newRecord;

    // Step 2: Format the description with HTML <br> tags for line breaks
    const formattedDescription = product_description.replace(/\n/g, '<br>');
    console.log("Step 2: Description formatted");

    // Step 3: Create the product using Shopify GraphQL API
    const createProductMutation = `
      mutation {
        productCreate(input: {
          title: "${product_title}",
          descriptionHtml: "${formattedDescription}",
          vendor: "${product_vendor}",
          productType: "${product_type}",
          tags: ["${client_city}", "${client_state}", "${industry}"],
          status: ACTIVE,
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
      body: JSON.stringify({ query: createProductMutation }),
    });

    const createProductJsonResponse = await createProductResponse.json();

    if (createProductJsonResponse.errors || createProductJsonResponse.data.productCreate.userErrors.length > 0) {
      console.error('Step 3 Error: Shopify Product Creation Error:', createProductJsonResponse.errors || createProductJsonResponse.data.productCreate.userErrors);
      return new Response(JSON.stringify({ message: 'Failed to create product in Shopify', errors: createProductJsonResponse.errors || createProductJsonResponse.data.productCreate.userErrors }), { status: 500 });
    }

    const createdProduct = createProductJsonResponse.data.productCreate.product;
    if (!createdProduct) {
      console.error('Step 3 Error: Product creation returned null or undefined:', createProductJsonResponse);
      return new Response(JSON.stringify({ message: 'Product creation failed; received null response from Shopify.' }), { status: 500 });
    }

    console.log('Step 3: Product successfully created in Shopify:', createdProduct);

    // Step 4: Extract productId and variantId from the created product
    const productId = createdProduct.id.split('/').pop(); // Extract product ID
    const variantId = createdProduct.variants.edges[0].node.id.split('/').pop(); // Extract variant ID
    console.log("Step 4: Product ID extracted:", productId);
    console.log("Step 4: Variant ID extracted:", variantId);

    // Step 5: Update the product price using the correct variant ID
    const updatePriceMutation = `
      mutation {
        productVariantUpdate(input: {
          id: "gid://shopify/ProductVariant/${variantId}",
          price: "${product_price}"
        }) {
          productVariant {
            id
            price
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const updatePriceResponse = await fetch(shopifyGraphQLUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": shopifyAccessToken,
      },
      body: JSON.stringify({ query: updatePriceMutation }),
    });

    const updatePriceJsonResponse = await updatePriceResponse.json();

    if (updatePriceJsonResponse.errors || updatePriceJsonResponse.data.productVariantUpdate.userErrors.length > 0) {
      console.error('Step 5 Error: Shopify Variant Update Error:', updatePriceJsonResponse.errors || updatePriceJsonResponse.data.productVariantUpdate.userErrors);
      return new Response(JSON.stringify({ message: 'Failed to update product price in Shopify', errors: updatePriceJsonResponse.errors || updatePriceJsonResponse.data.productVariantUpdate.userErrors }), { status: 500 });
    }

    console.log('Step 5: Product price successfully updated in Shopify:', updatePriceJsonResponse.data.productVariantUpdate.productVariant);

    // Step 6: Update the product via REST API to uncheck "This is a physical product"
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
      console.error('Step 6 Error: Shopify Product Update Error:', updateProductJsonResponse.errors);
      return new Response(JSON.stringify({ message: 'Failed to update product in Shopify', errors: updateProductJsonResponse.errors }), { status: 500 });
    }

    console.log('Step 6: Product successfully updated in Shopify:', updateProductJsonResponse);

// Step 7: Fetch publication IDs and publish the product to all relevant sales channels
console.log('Step 7: Fetching publication IDs and publishing the product to sales channels');

// Fetch the publication IDs
const fetchPublicationsQuery = `
  {
    publications(first: 10) {
      edges {
        node {
          id
          name
        }
      }
    }
  }
`;

const fetchPublicationsResponse = await fetch(shopifyGraphQLUrl, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Shopify-Access-Token": shopifyAccessToken,
  },
  body: JSON.stringify({ query: fetchPublicationsQuery }),
});

const fetchPublicationsJsonResponse = await fetchPublicationsResponse.json();

if (fetchPublicationsJsonResponse.errors) {
  console.error('Step 7 Error: Failed to fetch publication IDs:', fetchPublicationsJsonResponse.errors);
  return new Response(JSON.stringify({ message: 'Failed to fetch publication IDs from Shopify', errors: fetchPublicationsJsonResponse.errors }), { status: 500 });
}

// Extract publication IDs from the response
const publicationIds = fetchPublicationsJsonResponse.data.publications.edges.map(edge => edge.node.id);

for (const publicationId of publicationIds) {
  const publishProductMutation = `
    mutation {
      publishablePublish(
        id: "gid://shopify/Product/${productId}",
        input: {
          publicationId: "${publicationId}"
        }
      ) {
        userErrors {
          field
          message
        }
      }
    }
  `;

  const publishProductResponse = await fetch(shopifyGraphQLUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": shopifyAccessToken,
    },
    body: JSON.stringify({ query: publishProductMutation }),
  });

  const publishProductJsonResponse = await publishProductResponse.json();

  if (publishProductJsonResponse.errors || publishProductJsonResponse.data.publishablePublish.userErrors.length > 0) {
    console.error('Step 7 Error: Shopify Product Publishing Error for Publication ID', publicationId, ':', publishProductJsonResponse.errors || publishProductJsonResponse.data.publishablePublish.userErrors);
    return new Response(JSON.stringify({ message: `Failed to publish product to sales channel with Publication ID ${publicationId} in Shopify`, errors: publishProductJsonResponse.errors || publishProductJsonResponse.data.publishablePublish.userErrors }), { status: 500 });
  }

  console.log(`Step 7: Product successfully published to sales channel with Publication ID ${publicationId}`);
}


    // Step 8: Add product to the "Main" collection
    const addToCollectionMutation = `
      mutation {
        collectionAddProducts(id: "gid://shopify/Collection/322758344853", productIds: ["gid://shopify/Product/${productId}"]) {
          userErrors {
            field
            message
          }
        }
      }
    `;

    const addToCollectionResponse = await fetch(shopifyGraphQLUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": shopifyAccessToken,
      },
      body: JSON.stringify({ query: addToCollectionMutation }),
    });

    const addToCollectionJsonResponse = await addToCollectionResponse.json();

    if (addToCollectionJsonResponse.errors || addToCollectionJsonResponse.data.collectionAddProducts.userErrors.length > 0) {
      console.error('Step 8 Error: Shopify Collection Update Error:', addToCollectionJsonResponse.errors || addToCollectionJsonResponse.data.collectionAddProducts.userErrors);
      return new Response(JSON.stringify({ message: 'Failed to add product to collection in Shopify', errors: addToCollectionJsonResponse.errors || addToCollectionJsonResponse.data.collectionAddProducts.userErrors }), { status: 500 });
    }

    console.log('Step 8: Product successfully added to Main collection in Shopify:', addToCollectionJsonResponse);

    return new Response(JSON.stringify({ message: 'Product successfully created, updated, and added to collection in Shopify' }), { status: 200 });

  } catch (err) {
    console.error("Unexpected error:", err.message);
    return new Response(JSON.stringify({ message: "Unexpected error occurred", error: err.message }), { status: 500 });
  }
});