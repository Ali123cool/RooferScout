import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://wcpcigdzqcmxvzfpbazr.supabase.co';
const supabaseKey = 'your-supabase-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function calculatePriceRange() {
    console.log('Starting price range calculation...');

    // Fetch and validate material
    const material = await fetchValue('Desired-Material-Type', 'rooferscout_material_costs', 'material_name', 'min_cost', 'max_cost');
    if (!material) return;

    // Fetch and validate service type
    const serviceType = await fetchValue('Type-Of-Service-Desired', 'rooferscout_service_type_factors', 'service_type', 'factor');
    if (!serviceType) return;

    // Fetch and validate state
    const state = await fetchValue('State', 'rooferscout_state_factors', 'state_name', 'factor');
    if (!state) return;

    // Fetch and validate stories
    const stories = await fetchValue('Stories', 'rooferscout_stories_costs', 'stories_count', 'cost');
    if (!stories) return;

    // Fetch and validate building type
    const buildingType = await fetchValue('Building-Type', 'rooferscout_building_type_factors', 'building_type', 'factor');
    if (!buildingType) return;

    // Fetch and validate roof square footage range
    const roofSqFt = await fetchValue('Estimated-Roof-Sq-Ft', 'rooferscout_estimated_roof_sq_ft', 'range_label', 'upper_value');
    if (!roofSqFt) return;

    // Fetch and validate steepness
    const steepness = await fetchValue('Roof-Steepness', 'rooferscout_steepness_costs', 'steepness_level', 'cost');
    if (!steepness) return;

    // Perform the calculations using the fetched data
    const minPrice = Math.round(roofSqFt.upper_value * ((material.min_cost * serviceType.factor * state.factor * buildingType.factor) + stories.cost + steepness.cost));
    const maxPrice = Math.round(roofSqFt.upper_value * ((material.max_cost * serviceType.factor * state.factor * buildingType.factor) + stories.cost + steepness.cost));

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

// Generalized function to fetch and validate a single value
async function fetchValue(elementId, tableName, keyColumn, ...valueColumns) {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`${elementId} element not found in the DOM`);
        return null;
    }

    const value = element.value;
    if (!value) {
        console.error(`${elementId} value is not selected or empty`);
        return null;
    }

    const data = await fetchSupabaseData(tableName);
    if (!data) {
        console.error(`Failed to fetch data from ${tableName}`);
        return null;
    }

    console.log(`Fetched data from ${tableName}:`, data);

    const selectedItem = data.find(item => item[keyColumn] === value);
    if (!selectedItem) {
        console.error(`${keyColumn} value for ${value} not found`);
        return null;
    }

    const result = {};
    valueColumns.forEach(column => {
        result[column] = selectedItem[column];
    });

    console.log(`Selected ${keyColumn} value:`, result);
    return result;
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
