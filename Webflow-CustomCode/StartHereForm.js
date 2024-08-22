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

    console.log('Values selected:', { material, serviceType, state, stories, buildingType, roofSqFtRange, steepness });

    // Fetching necessary data from Supabase
    const materialCosts = await fetchSupabaseData('rooferscout_material_costs');
    const stateFactors = await fetchSupabaseData('rooferscout_state_factors');
    const serviceTypeFactors = await fetchSupabaseData('rooferscout_service_type_factors');
    const steepnessCosts = await fetchSupabaseData('rooferscout_steepness_costs');
    const storiesCosts = await fetchSupabaseData('rooferscout_stories_costs');
    const buildingTypeFactors = await fetchSupabaseData('rooferscout_building_type_factors');
    const estimatedRoofSqFt = await fetchSupabaseData('rooferscout_estimated_roof_sq_ft');

    if (!materialCosts || !stateFactors || !serviceTypeFactors || !steepnessCosts || !storiesCosts || !buildingTypeFactors || !estimatedRoofSqFt) {
        console.error('Failed to fetch all necessary data.');
        return;
    }

    // Find specific values for the selected options
    const selectedMaterialCost = materialCosts.find(item => item.material_name === material);
    const selectedStateFactor = stateFactors.find(item => item.state_name === state);
    const selectedServiceTypeFactor = serviceTypeFactors.find(item => item.service_type === serviceType);
    const selectedSteepnessCost = steepnessCosts.find(item => item.steepness_level === steepness);
    const selectedStoriesCost = storiesCosts.find(item => item.stories_count === stories);
    const selectedBuildingTypeFactor = buildingTypeFactors.find(item => item.building_type === buildingType);
    const selectedRoofSqFt = estimatedRoofSqFt.find(item => item.range_label === roofSqFtRange);

    if (!selectedMaterialCost || !selectedStateFactor || !selectedServiceTypeFactor || !selectedSteepnessCost || !selectedStoriesCost || !selectedBuildingTypeFactor || !selectedRoofSqFt) {
        console.error('Some required data is missing.');
        return;
    }

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

// Function to fetch data from Supabase
async function fetchSupabaseData(tableName) {
    try {
        const { data, error } = await supabase
            .from(tableName)
            .select();

        if (error) {
            console.error(`Error fetching data from ${tableName}:`, error.message, error.details);
            return null;
        }
        return data;
    } catch (err) {
        console.error(`Network error fetching data from ${tableName}:`, err.message, err.stack);
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

// Attach the calculate function to the button
document.getElementById('calculate-button').addEventListener('click', calculatePriceRange);
