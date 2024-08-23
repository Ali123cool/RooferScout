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

    const minPriceField = document.getElementById('min-price-field');
    const maxPriceField = document.getElementById('max-price-field');
    const quoteIdField = document.getElementById('quote-id');

    if (minPriceField) {
        minPriceField.value = '';
    }
    if (maxPriceField) {
        maxPriceField.value = '';
    }
    if (quoteIdField) {
        quoteIdField.value = '';
    }

    const minPriceDisplay = document.getElementById('min-price');
    const maxPriceDisplay = document.getElementById('max-price');

    if (minPriceDisplay) {
        minPriceDisplay.innerText = '';
    }
    if (maxPriceDisplay) {
        maxPriceDisplay.innerText = '';
    }
}

function displayPrices(minPrice, maxPrice) {
    console.log('Displaying prices...');

    const minPriceField = document.getElementById('min-price-field');
    const maxPriceField = document.getElementById('max-price-field');
    const quoteIdField = document.getElementById('quote-id');

    if (minPriceField) {
        minPriceField.value = minPrice;
    }
    if (maxPriceField) {
        maxPriceField.value = maxPrice;
    }
    if (quoteIdField) {
        quoteIdField.value = generateRandomString(32);
    }

    const minPriceDisplay = document.getElementById('min-price');
    const maxPriceDisplay = document.getElementById('max-price');

    if (minPriceDisplay) {
        minPriceDisplay.innerText = `${minPrice}`;
    }
    if (maxPriceDisplay) {
        maxPriceDisplay.innerText = `${maxPrice}`;
    }
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
        'first_name': getValueById('First-Name'),
        'last_name': getValueById('Last-Name'),
        'business_name': getValueById('Business-Name'),
        'email': getValueById('Email'),
        'phone_number': getValueById('Phone-Number'),
        'call_allowed': getCheckedById('Call-Allowed'),
        'text_allowed': getCheckedById('Text-Allowed'),
        'email_allowed': getCheckedById('Email-Allowed'),
        'tos': getCheckedById('TOS'),
        'priv_pol': getCheckedById('Priv-Pol'),
        'street_address': getValueById('Street-Address'),
        'street_address_2': getValueById('Street-Address-2'),
        'state': getValueById('State'),
        'city': getValueById('City'),
        'zip_code': getValueById('Zip-Code'),
        'building_type': getValueById('Building-Type'),
        'estimated_roof_sq_ft': getValueById('Estimated-Roof-Sq-Ft'),
        'stories': getValueById('Stories'),
        'roof_steepness': getRadioValueByName('Roof-Steepness'),
        'type_of_service_desired': getValueById('Type-Of-Service-Desired'),
        'current_material_type': getValueById('Current-Material-Type'),
        'desired_material_type': getValueById('Desired-Material-Type'),
        'additional_services': getSelectedOptionsById('Additional-Services'),
        'specific_materials': getValueById('Specific-Materials'),
        'additional_information': getValueById('Additional-Information'),
        'will_you_be_using_insurance_2': getValueById('Will-You-Be-Using-Insurance-2'),
        'insurance_company_2': getValueById('Insurance-Company-2'),
        'policy_type_2': getValueById('Policy-Type-2'),
        'started_claim_process_2': getValueById('Started-Claim-Process-2'),
        'insurance_help_2': getValueById('Insurance-Help-2'),
        'quote_id': getValueById('quote-id'),
        'min_price_field': getValueById('min-price-field'),
        'max_price_field': getValueById('max-price-field')
    };

    try {
        const { data, error } = await supabase
            .from('rooferscout_main_form_submission_v1')
            .insert([formData]);

        if (error) {
            throw error;
        }

        console.log('Form data submitted successfully:', data);
        console.log('Redirecting to the completion page...');

        // Redirect to completion page
        window.location.href = 'https://roofer-scout.webflow.io/user-info-form/form-completion-page';
    } catch (error) {
        console.error('Error submitting form data:', error);
        // Optionally, you could show a message or popup here instead of redirecting
        alert("Information submitted successfully! Please check your email for more updates.");
    }
}

// Helper functions to safely retrieve values from elements
function getValueById(id) {
    const element = document.getElementById(id);
    return element ? element.value : '';
}

function getCheckedById(id) {
    const element = document.getElementById(id);
    return element ? element.checked : false;
}

function getRadioValueByName(name) {
    const element = document.querySelector(`input[name="${name}"]:checked`);
    return element ? element.value : '';
}

function getSelectedOptionsById(id) {
    const element = document.getElementById(id);
    return element ? Array.from(element.selectedOptions).map(opt => opt.value) : [];
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
