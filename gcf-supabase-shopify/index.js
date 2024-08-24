const axios = require('axios');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

// Initialize the Secret Manager client
const client = new SecretManagerServiceClient();

// Function to retrieve secrets from Google Cloud Secret Manager
async function accessSecretVersion(name) {
  const [version] = await client.accessSecretVersion({ name });
  return version.payload.data.toString('utf8');
}

exports.postLeadsToShopify = async (req, res) => {
  try {
    // Retrieve the secrets from Secret Manager
    const SUPABASE_URL = await accessSecretVersion('projects/refined-rookery-433515-u5/secrets/SUPABASE_URL/versions/latest');
    const SUPABASE_KEY_ANON = await accessSecretVersion('projects/refined-rookery-433515-u5/secrets/SUPABASE_KEY_ANON/versions/latest');
    const SHOPIFY_URL_1 = await accessSecretVersion('projects/refined-rookery-433515-u5/secrets/SHOPIFY_URL_1/versions/latest');
    const SHOPIFY_ACCESS_TOKEN_1 = await accessSecretVersion('projects/refined-rookery-433515-u5/secrets/SHOPIFY_ACCESS_TOKEN_1/versions/latest');

    // Fetch new leads from Supabase
    const { data: leads } = await axios.get(
      `${SUPABASE_URL}/rest/v1/roofer_scout_lead_demand_public_view`,
      {
        headers: {
          'apikey': SUPABASE_KEY_ANON,
          'Authorization': `Bearer ${SUPABASE_KEY_ANON}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Process each lead and create a Shopify product
    for (const lead of leads) {
      const productData = {
        product: {
          title: `${lead.first_name} ${lead.last_name} - ${lead.type_of_service_desired}`,
          body_html: `
            <p>Location: ${lead.city}, ${lead.state}</p>
            <p>Service Desired: ${lead.type_of_service_desired}</p>
            <p>Roof Steepness: ${lead.roof_steepness}</p>
            <p>Building Type: ${lead.building_type}</p>
            <p>Additional Information: ${lead.additional_information || 'N/A'}</p>
            <p>Quote ID: ${lead.quote_id}</p>
          `,
          vendor: lead.business_name,
          product_type: 'Lead',
          variants: [
            {
              price: lead.min_price_field,
              sku: lead.quote_id,
            },
          ],
        },
      };

      // Post the product to Shopify
      await axios.post(
        `${SHOPIFY_URL_1}/admin/api/2023-04/products.json`,
        productData,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN_1,
          },
        }
      );

      console.log(`Successfully posted lead ${lead.id} to Shopify as a product.`);
    }

    res.status(200).send('Leads processed successfully.');
  } catch (err) {
    console.error(err);
    res.status(500).send(`Error processing leads: ${err.message}`);
  }
};
