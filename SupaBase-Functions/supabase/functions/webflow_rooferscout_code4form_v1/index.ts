import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Initialize Supabase client using service role key (secured in Edge Function)
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to fetch data from a specific schema
async function fetchData(table: string, column: string, value: string, schema: string) {
    try {
        const { data, error } = await supabase
            .schema(schema)
            .from(table) 
            .select('*')
            .eq(column, value);

        if (error) {
            console.error(`Error fetching data from ${schema}.${table}: ${error.message}`);
            throw new Error(`${table} Error: ${error.message}`);
        }

        return data.length > 0 ? data[0] : null;
    } catch (error) {
        console.error('fetchData error:', error.message);
        throw error;
    }
}

// Function to calculate the price
async function calculatePrice(formData: Record<string, any>) {
    try {
        const {
            selectedMaterial,
            selectedServiceType,
            selectedState,
            selectedStories,
            selectedBuildingType,
            selectedRoofSqFt,
            selectedSteepness
        } = formData;

        const materialData = await fetchData('rooferscout_material_costs', 'material_name', selectedMaterial, 'rooferscout_calculations');
        const serviceTypeData = await fetchData('rooferscout_service_type_factors', 'service_type', selectedServiceType, 'rooferscout_calculations');
        const stateData = await fetchData('rooferscout_state_factors', 'state_name', selectedState, 'rooferscout_calculations');
        const storiesData = await fetchData('rooferscout_stories_costs', 'stories_count', selectedStories, 'rooferscout_calculations');
        const buildingTypeData = await fetchData('rooferscout_building_type_factors', 'building_type', selectedBuildingType, 'rooferscout_calculations');
        const roofSqFtData = await fetchData('rooferscout_estimated_roof_sq_ft', 'range_label', selectedRoofSqFt, 'rooferscout_calculations');
        const steepnessData = await fetchData('rooferscout_steepness_costs', 'steepness_level', selectedSteepness, 'rooferscout_calculations');

        if (!materialData || !serviceTypeData || !stateData || !storiesData || !buildingTypeData || !roofSqFtData || !steepnessData) {
            throw new Error('Required data not found for calculation.');
        }

        const minPrice = Math.round(
            roofSqFtData.upper_value *
            (materialData.min_cost * serviceTypeData.factor * stateData.factor * buildingTypeData.factor + storiesData.cost + steepnessData.cost)
        );
        const maxPrice = Math.round(
            roofSqFtData.upper_value *
            (materialData.max_cost * serviceTypeData.factor * stateData.factor * buildingTypeData.factor + storiesData.cost + steepnessData.cost)
        );

        return { minPrice, maxPrice };
    } catch (error) {
        console.error('calculatePrice error:', error.message);
        throw error;
    }
}

// Function to handle CORS
function handleCORS() {
    return new Response(null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
    });
}

// Edge function for handling the webhook
serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return handleCORS();
    }

    try {
        const body = await req.text();
        if (!body) {
            throw new Error('Empty request body');
        }

        let parsed;
        try {
            parsed = JSON.parse(body); // Safely parse JSON
        } catch (err) {
            throw new Error('Invalid JSON format');
        }

        const { action, formData } = parsed; // Expecting action like "calculatePrice" and form data

        // Handle the action
        if (action === 'calculatePrice') {
            const prices = await calculatePrice(formData);
            return new Response(JSON.stringify(prices), {
                status: 200,
                headers: { "Access-Control-Allow-Origin": "*" },
            });
        }

        // If action is to submit form data to Supabase
        if (action === 'submitForm') {
            const { data, error } = await supabase
                .from('public.rooferscout_main_form_submission_v1') // Explicitly include the public schema
                .insert([formData]);

            if (error) {
                console.error('Error inserting form data:', error.message);
                throw error;
            }

            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { "Access-Control-Allow-Origin": "*" },
            });
        }

        return new Response('Invalid action', {
            status: 400,
            headers: { "Access-Control-Allow-Origin": "*" },
        });

    } catch (error) {
        console.error("Error:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Access-Control-Allow-Origin": "*" },
        });
    }
});
