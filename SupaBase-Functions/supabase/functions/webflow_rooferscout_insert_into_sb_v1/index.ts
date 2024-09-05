import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { serve } from "https://deno.land/std@0.132.0/http/server.ts";

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(supabaseUrl, supabaseKey);

// Handle CORS with request origin checking
function handleCORS(req) {
  const allowedOrigins = ['https://rooferscout.com','https://www.rooferscout.com', 'https://www.roofer-scout.webflow.io'];
  const origin = req.headers.get('Origin');
  const headers = new Headers();

  console.log('Origin received:', origin); // Debug log for the origin

  if (origin && allowedOrigins.includes(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
  } else {
    console.log('Origin not allowed or missing, blocking CORS'); // Debug log for disallowed origins
    headers.set('Access-Control-Allow-Origin', ''); // Block CORS for non-allowed origins
  }

  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return headers;
}

// Function to insert form data
async function insertFormData(schema: string, table: string, formData: object) {
  const { data, error } = await supabase.schema(schema).from(table).insert([formData]);

  if (error) {
    throw new Error(`Error inserting data into ${schema}.${table}: ${error.message}`);
  }
  return data;
}

// Edge Function to handle form submission
serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: handleCORS(req) });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ message: 'Method Not Allowed' }), { status: 405, headers: handleCORS(req) });
  }

  try {
    const formData = await req.json();

    // Insert form data into the specified table
    const schema = 'public';
    const table = 'rooferscout_main_form_submission_v1';
    await insertFormData(schema, table, formData);

    return new Response(JSON.stringify({ message: 'Form data inserted successfully' }), { status: 200, headers: handleCORS(req) });

  } catch (error) {
    console.error('Error processing request:', error.message);
    return new Response(JSON.stringify({ message: 'Internal Server Error', error: error.message }), { status: 500, headers: handleCORS(req) });
  }
});
