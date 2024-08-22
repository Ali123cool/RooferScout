// supabase-script.js

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Create a single Supabase client for interacting with your database
const supabaseUrl = 'https://wcpcigdzqcmxvzfpbazr.supabase.co';
const supabaseKey = 'your_supabase_key_here';
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
  const material = document.getElementById('Desired-Material-Type').value;
  const serviceType = document.getElementById('Type-Of-Service-Desired').value;
  const state = document.getElementById('State').value;
  const stories = document.getElementById('Stories').value;
  const buildingType = document.getElementById('Building-Type').value;
  const steepness = document.querySelector('input[name="Roof-Steepness"]:checked').value;

  // Fetch data from Supabase tables
  const materialCosts = await fetchSupabaseData('rooferscout_material_costs');
  const stateFactors = await fetchSupabaseData('rooferscout_state_factors');
  const serviceTypeFactors = await fetchSupabaseData('rooferscout_service_type_factors');
  const steepnessCosts = await fetchSupabaseData('rooferscout_steepness_costs');
  const storiesCosts = await fetchSupabaseData('rooferscout_stories_costs');
  const buildingTypeFactors = await fetchSupabaseData('rooferscout_building_type_factors');
  const estimatedRoofSqFt = await fetchSupabaseData('rooferscout_estimated_roof_sq_ft');

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
  const selectedRoofSqFt = estimatedRoofSqFt.find(item => item.range_label === buildingType);

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

  console.log('Min Price:', minPrice);
  console.log('Max Price:', maxPrice);
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
