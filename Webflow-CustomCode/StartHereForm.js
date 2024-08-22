import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://wcpcigdzqcmxvzfpbazr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjcGNpZ2R6cWNteHZ6ZnBiYXpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQxODIzMDAsImV4cCI6MjAzOTc1ODMwMH0.0AtbcXKmjDZY-HSu235YDWY5qCyd0JQTwWxtv2MWX5A';
const supabase = createClient(supabaseUrl, supabaseKey);

async function calculatePriceRange() {
    console.log('Starting price range calculation...');

    // Fetching form field values
    const material = document.getElementById('Desired-Material-Type').value;
    const serviceType = document.getElementById('Type-Of-Service-Desired').value;
    const state = document.getElementById('State').value;
    const stories = document.getElementById('Stories').value;
    const buildingType = document.getElementById('Building-Type').value;
    const roofSqFtRange = document.getElementById('Estimated-Roof-Sq-Ft').value;
    const steepness = document.querySelector('input[name="Roof-Steepness"]:checked').value;

    if (!material || !serviceType || !state || !stories || !buildingType || !roofSqFtRange || !steepness) {
        console.error('Some required form fields are missing or not selected.');
        return;
    }

    // Fetch necessary data from Supabase for each variable
    const { data: materialCosts, error: materialError } = await supabase
        .from('rooferscout_material_costs')
        .select('*')
        .eq('material_name', material);

    if (materialError || !materialCosts.length) {
        console.error('Failed to fetch material costs or no data found.');
        return;
    }

    const { data: stateFactors, error: stateError } = await supabase
        .from('rooferscout_state_factors')
        .select('*')
        .eq('state_name', state);

    if (stateError || !stateFactors.length) {
        console.error('Failed to fetch state factors or no data found.');
        return;
    }

    const { data: serviceTypeFactors, error: serviceTypeError } = await supabase
        .from('rooferscout_service_type_factors')
        .select('*')
        .eq('service_type', serviceType);

    if (serviceTypeError || !serviceTypeFactors.length) {
        console.error('Failed to fetch service type factors or no data found.');
        return;
    }

    const { data: steepnessCosts, error: steepnessError } = await supabase
        .from('rooferscout_steepness_costs')
        .select('*')
        .eq('steepness_level', steepness);

    if (steepnessError || !steepnessCosts.length) {
        console.error('Failed to fetch steepness costs or no data found.');
        return;
    }

    const { data: storiesCosts, error: storiesError } = await supabase
        .from('rooferscout_stories_costs')
        .select('*')
        .eq('stories_count', stories);

    if (storiesError || !storiesCosts.length) {
        console.error('Failed to fetch stories costs or no data found.');
        return;
    }

    const { data: buildingTypeFactors, error: buildingTypeError } = await supabase
        .from('rooferscout_building_type_factors')
        .select('*')
        .eq('building_type', buildingType);

    if (buildingTypeError || !buildingTypeFactors.length) {
        console.error('Failed to fetch building type factors or no data found.');
        return;
    }

    const { data: estimatedRoofSqFt, error: roofSqFtError } = await supabase
        .from('rooferscout_estimated_roof_sq_ft')
        .select('*')
        .eq('range_label', roofSqFtRange);

    if (roofSqFtError || !estimatedRoofSqFt.length) {
        console.error('Failed to fetch estimated roof sq ft or no data found.');
        return;
    }

    // Get the first (and should be only) result from each query
    const selectedMaterialCost = materialCosts[0];
    const selectedStateFactor = stateFactors[0];
    const selectedServiceTypeFactor = serviceTypeFactors[0];
    const selectedSteepnessCost = steepnessCosts[0];
    const selectedStoriesCost = storiesCosts[0];
    const selectedBuildingTypeFactor = buildingTypeFactors[0];
    const selectedRoofSqFt = estimatedRoofSqFt[0];

    // Perform the calculations using the fetched data
    const minPrice = Math.round(selectedRoofSqFt.upper_value * ((selectedMaterialCost.min_cost * selectedServiceTypeFactor.factor * selectedStateFactor.factor * selectedBuildingTypeFactor.factor) + selectedStoriesCost.cost + selectedSteepnessCost.cost));
    const maxPrice = Math.round(selectedRoofSqFt.upper_value * ((selectedMaterialCost.max_cost * selectedServiceTypeFactor.factor * selectedStateFactor.factor * selectedBuildingTypeFactor.factor) + selectedStoriesCost.cost + selectedSteepnessCost.cost));

    // Log and update UI with the calculated prices
    console.log('Min Price:', minPrice);
    console.log('Max Price:', maxPrice);

    document.getElementById('min-price').innerText = `${minPrice}`;
    document.getElementById('max-price').innerText = `${maxPrice}`;

    // Store the values in hidden fields (if needed for submission)
    document.getElementById('min-price-field').value = minPrice;
    document.getElementById('max-price-field').value = maxPrice;
    document.getElementById('quote-id').value = generateRandomString(32);
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

// Attach the calculate function to the button
document.getElementById('calculate-button').addEventListener('click', calculatePriceRange);
