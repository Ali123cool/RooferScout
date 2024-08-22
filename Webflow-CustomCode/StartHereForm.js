import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://wcpcigdzqcmxvzfpbazr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjcGNpZ2R6cWNteHZ6ZnBiYXpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQxODIzMDAsImV4cCI6MjAzOTc1ODMwMH0.0AtbcXKmjDZY-HSu235YDWY5qCyd0JQTwWxtv2MWX5A';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchData(table, column, value) {
    console.log(`Fetching data from ${table} where ${column} = ${value}`);
    const { data, error } = await supabase.from(table).select('*').eq(column, value);
    if (error) {
        throw new Error(`${table} Error: ${error.message}`);
    }
    console.log(`Data from ${table}: `, data);
    return data.length > 0 ? data[0] : null;
}

async function calculatePrice() {
    try {
        clearFields(); // Clear the fields before calculation
        document.body.style.cursor = 'wait'; // Change cursor to spinner
        console.log('Calculate button clicked.');

        const selectedMaterial = document.getElementById('Desired-Material-Type').value;
        const selectedServiceType = document.getElementById('Type-Of-Service-Desired').value;
        const selectedState = document.getElementById('State').value;
        const selectedStories = document.getElementById('Stories').value;
        const selectedBuildingType = document.getElementById('Building-Type').value;
        const selectedRoofSqFt = document.getElementById('Estimated-Roof-Sq-Ft').value;
        const selectedSteepness = document.querySelector('input[name="Roof-Steepness"]:checked').value;

        // Log inputs to confirm they are being retrieved correctly
        console.log({
            selectedMaterial,
            selectedServiceType,
            selectedState,
            selectedStories,
            selectedBuildingType,
            selectedRoofSqFt,
            selectedSteepness
        });

        const materialData = await fetchData('rooferscout_material_costs', 'material_name', selectedMaterial);
        const serviceTypeData = await fetchData('rooferscout_service_type_factors', 'service_type', selectedServiceType);
        const stateData = await fetchData('rooferscout_state_factors', 'state_name', selectedState);
        const storiesData = await fetchData('rooferscout_stories_costs', 'stories_count', selectedStories);
        const buildingTypeData = await fetchData('rooferscout_building_type_factors', 'building_type', selectedBuildingType);
        const roofSqFtData = await fetchData('rooferscout_estimated_roof_sq_ft', 'range_label', selectedRoofSqFt);
        const steepnessData = await fetchData('rooferscout_steepness_costs', 'steepness_level', selectedSteepness);

        // Check if any of the required data is missing
        if (!materialData || !serviceTypeData || !stateData || !storiesData || !buildingTypeData || !roofSqFtData || !steepnessData) {
            console.error('Required data not found for calculation.');
            return;
        }

        const minPrice = Math.round(roofSqFtData.upper_value * (
            (materialData.min_cost * serviceTypeData.factor * stateData.factor * buildingTypeData.factor)
            + storiesData.cost + steepnessData.cost));
        const maxPrice = Math.round(roofSqFtData.upper_value * (
            (materialData.max_cost * serviceTypeData.factor * stateData.factor * buildingTypeData.factor)
            + storiesData.cost + steepnessData.cost));

        console.log('Min Price:', minPrice);
        console.log('Max Price:', maxPrice);

        displayPrices(minPrice, maxPrice);

    } catch (error) {
        console.error('Unexpected error:', error);
    } finally {
        document.body.style.cursor = 'default'; // Revert cursor to default
    }
}

function clearFields() {
    console.log('Clearing fields...');
    // Clear the price fields and the hidden fields
    document.getElementById('min-price').innerText = '';
    document.getElementById('max-price').innerText = '';
    document.getElementById('min-price-field').value = '';
    document.getElementById('max-price-field').value = '';
    document.getElementById('quote-id').value = '';
}

function displayPrices(minPrice, maxPrice) {
    console.log('Displaying prices...');
    document.getElementById('min-price').innerText = `${minPrice}`;
    document.getElementById('max-price').innerText = `${maxPrice}`;
    document.getElementById('min-price-field').value = minPrice;
    document.getElementById('max-price-field').value = maxPrice;
    document.getElementById('quote-id').value = generateRandomString(32);
}

function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

// Function to submit form data to Supabase
async function submitFormToSupabase() {
    // Format: 'supabase_column_name': document.getElementById('webflow_html_id').value
    const formData = {
        'first_name': document.getElementById('First-Name').value,
        'last_name': document.getElementById('Last-Name').value,
        'business_name': document.getElementById('Business-Name').value,
        'email': document.getElementById('Email').value,
        'phone_number': document.getElementById('Phone-Number').value,
        'call_allowed': document.getElementById('Call-Allowed').checked,
        'text_allowed': document.getElementById('Text-Allowed').checked,
        'email_allowed': document.getElementById('Email-Allowed').checked,
        'tos': document.getElementById('TOS').checked,
        'priv_pol': document.getElementById('Priv-Pol').checked,
        'street_address': document.getElementById('Street-Address').value,
        'street_address_2': document.getElementById('Street-Address-2').value,
        'state': document.getElementById('State').value,
        'city': document.getElementById('City').value,
        'zip_code': document.getElementById('Zip-Code').value,
        'building_type': document.getElementById('Building-Type').value,
        'estimated_roof_sq_ft': document.getElementById('Estimated-Roof-Sq-Ft').value,
        'stories': document.getElementById('Stories').value,
        'roof_steepness': document.querySelector('input[name="Roof-Steepness"]:checked').value,
        'type_of_service_desired': document.getElementById('Type-Of-Service-Desired').value,
        'current_material_type': document.getElementById('Current-Material-Type').value,
        'desired_material_type': document.getElementById('Desired-Material-Type').value,
        'additional_services': Array.from(document.getElementById('Additional-Services').selectedOptions).map(opt => opt.value),
        'specific_materials': document.getElementById('Specific-Materials').value,
        'additional_information': document.getElementById('Additional-Information').value,
        'will_you_be_using_insurance_2': document.getElementById('Will-You-Be-Using-Insurance-2').value,
        'insurance_company_2': document.getElementById('Insurance-Company-2').value,
        'policy_type_2': document.getElementById('Policy-Type-2').value,
        'started_claim_process_2': document.getElementById('Started-Claim-Process-2').value,
        'insurance_help_2': document.getElementById('Insurance-Help-2').value,
        'quote_id': document.getElementById('quote-id').value,
        'min_price_field': document.getElementById('min-price-field').value,
        'max_price_field': document.getElementById('max-price-field').value
    };

    try {
        const { data, error } = await supabase
            .from('rooferscout_main_form_submission_v1')
            .insert([formData]);

        if (error) {
            throw error;
        }
        
        console.log('Form data submitted successfully:', data);
    } catch (error) {
        console.error('Error submitting form data:', error);
    }
}

// Attach the submit function to the button click event
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded, setting up event listeners.');

    const calculateButton = document.getElementById('calculate-button');
    if (calculateButton) {
        calculateButton.addEventListener('click', (event) => {
            event.preventDefault();
            calculatePrice();
        });
    } else {
        console.error('Calculate button not found!');
    }

    const submitButton = document.getElementById('Submit-Form-to-Supabase');
    if (submitButton) {
        submitButton.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent the default form submission behavior
            submitFormToSupabase(); // Call the submit function
        });
    } else {
        console.error('Submit button not found!');
    }
});
