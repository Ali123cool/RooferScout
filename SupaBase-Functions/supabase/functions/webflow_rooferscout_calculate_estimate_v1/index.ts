import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { serve } from "https://deno.land/std@0.132.0/http/server.ts";


// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or service key not set');
}
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


// Function to fetch data from a specific schema, table, and column
async function fetchData(table: string, column: string, value: string, schema: string) {
  try {
    console.log(`Fetching data from ${schema}.${table} where ${column} = ${value}`);  // Debugging log
    const { data, error } = await supabase
      .schema(schema)
      .from(table)
      .select('*')
      .eq(column, value);

    if (error) {
      console.error(`Error fetching data from ${schema}.${table}: ${error.message}`);
      throw new Error(`${table} Error: ${error.message}`);
    }

    console.log(`Fetched data from ${table}:`, data);  // Debugging log
    return data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('fetchData error:', error.message);
    throw error;
  }
}

// Edge Function
serve(async (req) => {
  
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: handleCORS(req),
    });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ message: 'Method Not Allowed' }), {
      status: 405,
      headers: handleCORS(req),
    });
  }

  try {
    // Parse the request body
    const {
      selectedMaterial,
      selectedServiceType,
      selectedState,
      selectedStories,
      selectedBuildingType,
      selectedRoofSqFt,
      selectedSteepness
    } = await req.json();

    console.log('Request Data:', {
      selectedMaterial,
      selectedServiceType,
      selectedState,
      selectedStories,
      selectedBuildingType,
      selectedRoofSqFt,
      selectedSteepness
    });

    // Fetch data from the rooferscout_calculations schema
    const materialData = await fetchData('rooferscout_material_costs', 'material_name', selectedMaterial, 'rooferscout_calculations');
    const serviceTypeData = await fetchData('rooferscout_service_type_factors', 'service_type', selectedServiceType, 'rooferscout_calculations');
    const stateData = await fetchData('rooferscout_state_factors', 'state_name', selectedState, 'rooferscout_calculations');
    const storiesData = await fetchData('rooferscout_stories_costs', 'stories_count', selectedStories, 'rooferscout_calculations');
    const buildingTypeData = await fetchData('rooferscout_building_type_factors', 'building_type', selectedBuildingType, 'rooferscout_calculations');
    const roofSqFtData = await fetchData('rooferscout_estimated_roof_sq_ft', 'range_label', selectedRoofSqFt, 'rooferscout_calculations');
    const steepnessData = await fetchData('rooferscout_steepness_costs', 'steepness_level', selectedSteepness, 'rooferscout_calculations');

    // Check if any of the required data is missing
    if (!materialData || !serviceTypeData || !stateData || !storiesData || !buildingTypeData || !roofSqFtData || !steepnessData) {
      console.error('Missing data for calculation');
      return new Response(JSON.stringify({ message: 'Missing required data for calculation.' }), {
        status: 400,
        headers: handleCORS(req),
      });
    }

    // Ensure numeric conversion for numeric fields
    const upperValue = parseFloat(roofSqFtData.upper_value) || 0;
    const minCost = parseFloat(materialData.min_cost) || 0;
    const maxCost = parseFloat(materialData.max_cost) || 0;
    const serviceFactor = parseFloat(serviceTypeData.factor) || 0;
    const stateFactor = parseFloat(stateData.factor) || 0;
    const buildingTypeFactor = parseFloat(buildingTypeData.factor) || 0;
    const storiesCost = parseFloat(storiesData.cost) || 0;
    const steepnessCost = parseFloat(steepnessData.cost) || 0;

    // Calculate min and max prices
    const minPrice = Math.round(
      upperValue * (minCost * serviceFactor * stateFactor * buildingTypeFactor + storiesCost + steepnessCost)
    );

    const maxPrice = Math.round(
      upperValue * (maxCost * serviceFactor * stateFactor * buildingTypeFactor + storiesCost + steepnessCost)
    );

    console.log('Min Price:', minPrice, 'Max Price:', maxPrice);

    // Return response with calculated prices
    return new Response(JSON.stringify({ minPrice, maxPrice }), {
      status: 200,
      headers: handleCORS(req),
    });
    
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(JSON.stringify({ message: 'Internal Server Error', error: error.message }), {
      status: 500,
      headers: handleCORS(req),
    });
  }
});
