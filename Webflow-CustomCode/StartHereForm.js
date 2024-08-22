import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://wcpcigdzqcmxvzfpbazr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjcGNpZ2R6cWNteHZ6ZnBiYXpyIiwicm9zZSI6ImFub24iLCJpYXQiOjE3MjQxODIzMDAsImV4cCI6MjAzOTc1ODMwMH0.0AtbcXKmjDZY-HSu235YDWY5qCyd0JQTwWxtv2MWX5A';
const supabase = createClient(supabaseUrl, supabaseKey);

document.getElementById('calculate-button').addEventListener('click', async () => {
    // Fetch Material Cost
    const selectedMaterial = document.getElementById('Desired-Material-Type').value;
    const materialData = await fetchSupabaseData('rooferscout_material_costs', 'material_name', selectedMaterial, 'min_cost', 'max_cost');
    if (!materialData) return;

    // Fetch Service Type Factor
    const selectedServiceType = document.getElementById('Type-Of-Service-Desired').value;
    const serviceTypeData = await fetchSupabaseData('rooferscout_service_type_factors', 'service_type', selectedServiceType, 'factor');
    if (!serviceTypeData) return;

    // Fetch State Factor
    const selectedState = document.getElementById('State').value;
    const stateData = await fetchSupabaseData('rooferscout_state_factors', 'state_name', selectedState, 'factor');
    if (!stateData) return;

    // Fetch Stories Cost
    const selectedStories = document.getElementById('Stories').value;
    const storiesData = await fetchSupabaseData('rooferscout_stories_costs', 'stories_count', selectedStories, 'cost');
    if (!storiesData) return;

    // Fetch Building Type Factor
    const selectedBuildingType = document.getElementById('Building-Type').value;
    const buildingTypeData = await fetchSupabaseData('rooferscout_building_type_factors', 'building_type', selectedBuildingType, 'factor');
    if (!buildingTypeData) return;

    // Fetch Roof Square Footage
    const selectedRoofSqFt = document.getElementById('Estimated-Roof-Sq-Ft').value;
    const roofSqFtData = await fetchSupabaseData('rooferscout_estimated_roof_sq_ft', 'range_label', selectedRoofSqFt, 'upper_value');
    if (!roofSqFtData) return;

    // Fetch Steepness Cost
    const selectedSteepness = document.querySelector('input[name="Roof-Steepness"]:checked').value;
    const steepnessData = await fetchSupabaseData('rooferscout_steepness_costs', 'steepness_level', selectedSteepness, 'cost');
    if (!steepnessData) return;

    // Calculate Min and Max Price
    const minPrice = Math.round(roofSqFtData.upper_value * ((materialData.min_cost * serviceTypeData.factor * stateData.factor * buildingTypeData.factor) + storiesData.cost + steepnessData.cost));
    const maxPrice = Math.round(roofSqFtData.upper_value * ((materialData.max_cost * serviceTypeData.factor * stateData.factor * buildingTypeData.factor) + storiesData.cost + steepnessData.cost));

    // Display Min and Max Price
    document.getElementById('min-price').innerText = `${minPrice}`;
    document.getElementById('max-price').innerText = `${maxPrice}`;

    // Store the values in hidden fields (if needed for submission)
    document.getElementById('min-price-field').value = minPrice;
    document.getElementById('max-price-field').value = maxPrice;
    document.getElementById('quote-id').value = generateRandomString(32);
});

// Function to fetch data from Supabase
async function fetchSupabaseData(tableName, keyColumn, keyValue, ...valueColumns) {
    const { data, error } = await supabase
        .from(tableName)
        .select(valueColumns.join(', '))
        .eq(keyColumn, keyValue);

    if (error) {
        console.error(`Error fetching data from ${tableName}:`, error);
        document.getElementById('result').innerText = 'Error fetching data';
        return null;
    }

    if (data && data.length > 0) {
        console.log(`Fetched data from ${tableName}:`, data[0]);
        return data[0];
    } else {
        console.error(`No data found for ${keyColumn} = ${keyValue}`);
        document.getElementById('result').innerText = 'No data found';
        return null;
    }
}

// Utility function to generate a random string
function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}
