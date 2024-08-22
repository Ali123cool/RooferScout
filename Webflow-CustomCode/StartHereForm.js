// Import Supabase client
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Create a single Supabase client for interacting with your database
const supabaseUrl = 'https://wcpcigdzqcmxvzfpbazr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjcGNpZ2R6cWNteHZ6ZnBiYXpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQxODIzMDAsImV4cCI6MjAzOTc1ODMwMH0.0AtbcXKmjDZY-HSu235YDWY5qCyd0JQTwWxtv2MWX5A';
const supabase = createClient(supabaseUrl, supabaseKey);

// Event listener for the Calculate button
document.getElementById('calculate-button').addEventListener('click', function() {
    calculatePriceRange();
});

// Event listener for the Submit button
document.getElementById('roofing-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent the default form submission
    submitForm();
});

// Function to calculate the price range
async function calculatePriceRange() {
    console.log('Starting price range calculation...');

    const material = document.getElementById('Desired-Material-Type').value;
    const serviceType = document.getElementById('Type-Of-Service-Desired').value;
    const state = document.getElementById('State').value;
    const stories = document.getElementById('Stories').value;
    const buildingType = document.getElementById('Building-Type').value;
    const roofSqFtRange = document.getElementById('Estimated-Roof-Sq-Ft').value;
    const steepness = document.querySelector('input[name="Roof-Steepness"]:checked').value;

    console.log('Values selected:', { material, serviceType, state, stories, buildingType, roofSqFtRange, steepness });

    // Fetch data from Supabase tables
    const materialCosts = await fetchSupabaseData('rooferscout_material_costs');
    console.log('Fetched material costs:', materialCosts);

    const stateFactors = await fetchSupabaseData('rooferscout_state_factors');
    console.log('Fetched state factors:', stateFactors);

    const serviceTypeFactors = await fetchSupabaseData('rooferscout_service_type_factors');
    console.log('Fetched service type factors:', serviceTypeFactors);

    const steepnessCosts = await fetchSupabaseData('rooferscout_steepness_costs');
    console.log('Fetched steepness costs:', steepnessCosts);

    const storiesCosts = await fetchSupabaseData('rooferscout_stories_costs');
    console.log('Fetched stories costs:', storiesCosts);

    const buildingTypeFactors = await fetchSupabaseData('rooferscout_building_type_factors');
    console.log('Fetched building type factors:', buildingTypeFactors);

    const estimatedRoofSqFt = await fetchSupabaseData('rooferscout_estimated_roof_sq_ft');
    console.log('Fetched estimated roof sq ft:', estimatedRoofSqFt);

    // Continue with the rest of your code...
}
s

    // Check if any of the fetched data is null due to a failed fetch operation
    if (!materialCosts || !stateFactors || !serviceTypeFactors || !steepnessCosts || !storiesCosts || !buildingTypeFactors || !estimatedRoofSqFt) {
        console.error('Failed to fetch all necessary data. Please check your internet connection and try again.');
        return;
    }

    // Find specific values for the selected options
    const selectedMaterialCost = materialCosts.find(item => item.material_name === material);
    const selectedStateFactor = stateFactors.find(item => item.state_name === state);
    const selectedServiceTypeFactor = serviceTypeFactors.find(item => item.service_type === serviceType);
    const selectedSteepnessCost = steepnessCosts.find(item => item.steepness_level === steepness);
    const selectedStoriesCost = storiesCosts.find(item => item.stories_count === stories);
    const selectedBuildingTypeFactor = buildingTypeFactors.find(item => item.building_type === buildingType);

    // Find the corresponding entry in the roof square footage table based on the selected range
    const selectedRoofSqFt = estimatedRoofSqFt.find(item => item.range_label === roofSqFtRange);

    // Ensure selectedRoofSqFt is valid
    if (!selectedMaterialCost || !selectedStateFactor || !selectedServiceTypeFactor || !selectedSteepnessCost || !selectedStoriesCost || !selectedBuildingTypeFactor || !selectedRoofSqFt) {
        console.error('Some required data is missing.');
        return;
    }

    // Perform the calculations using the fetched square footage
    const minPrice = Math.round(selectedRoofSqFt.sq_ft * ((selectedMaterialCost.min_cost * selectedServiceTypeFactor.factor * selectedStateFactor.factor * selectedBuildingTypeFactor.factor) + selectedStoriesCost.cost + selectedSteepnessCost.cost));
    const maxPrice = Math.round(selectedRoofSqFt.sq_ft * ((selectedMaterialCost.max_cost * selectedServiceTypeFactor.factor * selectedStateFactor.factor * selectedBuildingTypeFactor.factor) + selectedStoriesCost.cost + selectedSteepnessCost.cost));

    // Generate a 32-character random quote ID
    const quoteId = generateRandomString(32);

    // Update the hidden fields with the calculated prices and quote ID
    document.getElementById('min-price-field').value = minPrice;
    document.getElementById('max-price-field').value = maxPrice;
    document.getElementById('quote-id').value = quoteId;

    // Log the final calculated prices for debugging
    console.log('Min Price:', minPrice.toFixed(0));
    console.log('Max Price:', maxPrice.toFixed(0));

    // Update the price range on the page
    document.getElementById('min-price').innerText = `${minPrice.toFixed(0)}`;
    document.getElementById('max-price').innerText = `${maxPrice.toFixed(0)}`;

    console.log('Quote ID:', quoteId);
}
  
// Function to submit the form data to Supabase
async function submitForm() {
    const formData = new FormData(document.getElementById('roofing-form'));
    const data = {};

    formData.forEach((value, key) => {
        data[key] = value;
    });

    const { error } = await supabase
        .from('rooferscout_main_form_submission_v1') // Use the correct table name
        .insert([data]);

    if (error) {
        console.error('Error submitting form data:', error);
    } else {
        console.log('Form data submitted successfully.');
    }
}

// Utility function to generate a random string of the specified length
function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

// Function to fetch data from Supabase
async function fetchSupabaseData(tableName) {
    try {
        const { data, error } = await supabase
            .from(tableName)
            .select();

        if (error) {
            console.error(`Error fetching data from ${tableName}:`, error);
            return null;
        }
        return data;
    } catch (err) {
        console.error(`Network error fetching data from ${tableName}:`, err);
        return null;
    }
}
