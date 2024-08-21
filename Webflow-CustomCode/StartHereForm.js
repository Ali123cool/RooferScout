// Load Supabase library
document.addEventListener('DOMContentLoaded', function() {
    const supabaseUrl = 'https://wcpcigdzqcmxvzfpbazr.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjcGNpZ2R6cWNteHZ6ZnBiYXpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQxODIzMDAsImV4cCI6MjAzOTc1ODMwMH0.0AtbcXKmjDZY-HSu235YDWY5qCyd0JQTwWxtv2MWX5A';
    const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
  
    // Event listener for the Calculate button
    document.getElementById('calculate-button').addEventListener('click', function() {
      calculatePriceRange(supabaseClient);
    });
  
    // Event listener for the Submit button
    document.getElementById('roofing-form').addEventListener('submit', function(event) {
      event.preventDefault(); // Prevent the default form submission
      submitForm(supabaseClient);
    });
  
    // Function to calculate the price range
    async function calculatePriceRange(supabaseClient) {
      const material = document.getElementById('Desired-Material-Type').value;
      const serviceType = document.getElementById('Type-Of-Service-Desired').value;
      const state = document.getElementById('State').value;
      const stories = document.getElementById('Stories').value;
      const buildingType = document.getElementById('Building-Type').value;
      const steepness = document.querySelector('input[name="Roof-Steepness"]:checked').value;
  
      // Fetch data from Supabase tables
      const materialCosts = await fetchSupabaseData(supabaseClient, 'rooferscout_material_costs');
      const stateFactors = await fetchSupabaseData(supabaseClient, 'rooferscout_state_factors');
      const serviceTypeFactors = await fetchSupabaseData(supabaseClient, 'rooferscout_service_type_factors');
      const steepnessCosts = await fetchSupabaseData(supabaseClient, 'rooferscout_steepness_costs');
      const storiesCosts = await fetchSupabaseData(supabaseClient, 'rooferscout_stories_costs');
      const buildingTypeFactors = await fetchSupabaseData(supabaseClient, 'rooferscout_building_type_factors');
      const estimatedRoofSqFt = await fetchSupabaseData(supabaseClient, 'rooferscout_estimated_roof_sq_ft');
  
      // Check if any of the fetched data is null due to a failed fetch operation
      if (!materialCosts || !stateFactors || !serviceTypeFactors || !steepnessCosts || !storiesCosts || !buildingTypeFactors || !estimatedRoofSqFt) {
        console.error('Failed to fetch all necessary data. Please check your internet connection and try again.');
        return;
      }
  
      // Find specific values for the selected options
      const selectedMaterialCost = materialCosts.find(item => item.material === material);
      const selectedStateFactor = stateFactors.find(item => item.state === state);
      const selectedServiceTypeFactor = serviceTypeFactors.find(item => item.service_type === serviceType);
      const selectedSteepnessCost = steepnessCosts.find(item => item.steepness === steepness);
      const selectedStoriesCost = storiesCosts.find(item => item.stories === stories);
      const selectedBuildingTypeFactor = buildingTypeFactors.find(item => item.building_type === buildingType);
      const selectedRoofSqFt = estimatedRoofSqFt.find(item => item.sq_ft === parseInt(document.getElementById('Estimated-Roof-Sq-Ft').value));
  
      if (!selectedMaterialCost || !selectedStateFactor || !selectedServiceTypeFactor || !selectedSteepnessCost || !selectedStoriesCost || !selectedBuildingTypeFactor || !selectedRoofSqFt) {
        console.error('Some required data is missing.');
        return;
      }
  
      // Perform the calculations using the fetched square footage
      const minPrice = Math.round(selectedRoofSqFt.sq_ft * ((selectedMaterialCost.min * selectedServiceTypeFactor.factor * selectedStateFactor.factor * selectedBuildingTypeFactor.factor) + selectedStoriesCost.cost + selectedSteepnessCost.cost));
      const maxPrice = Math.round(selectedRoofSqFt.sq_ft * ((selectedMaterialCost.max * selectedServiceTypeFactor.factor * selectedStateFactor.factor * selectedBuildingTypeFactor.factor) + selectedStoriesCost.cost + selectedSteepnessCost.cost));
  
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
    async function submitForm(supabaseClient) {
      const formData = new FormData(document.getElementById('roofing-form'));
      const data = {};
  
      formData.forEach((value, key) => {
        data[key] = value;
      });
  
      const { error } = await supabaseClient
        .from('your_table_name') // Replace with your Supabase table name
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
    async function fetchSupabaseData(supabaseClient, tableName) {
      try {
        const { data, error } = await supabaseClient
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
  });
  