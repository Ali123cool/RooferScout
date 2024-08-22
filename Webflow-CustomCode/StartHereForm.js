import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://wcpcigdzqcmxvzfpbazr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjcGNpZ2R6cWNteHZ6ZnBiYXpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQxODIzMDAsImV4cCI6MjAzOTc1ODMwMH0.0AtbcXKmjDZY-HSu235YDWY5qCyd0JQTwWxtv2MWX5A';
const supabase = createClient(supabaseUrl, supabaseKey);

function initApp() {
    document.getElementById('calculate-button').addEventListener('click', async () => {
        try {
            console.log('Calculate button clicked.');

            // Fetch Material Cost
            const selectedMaterial = document.getElementById('Desired-Material-Type').value;
            const { data: materialData, error: materialError } = await supabase
                .from('rooferscout_material_costs')
                .select('min_cost, max_cost')
                .eq('material_name', selectedMaterial);

            if (materialError) {
                throw new Error(`Material Error: ${materialError.message}`);
            }
            if (materialData && materialData.length > 0) {
                console.log('Fetched Material Costs:', materialData[0]);
            } else {
                console.log('No material data found.');
                return;
            }

            // Fetch Service Type Factor
            const selectedServiceType = document.getElementById('Type-Of-Service-Desired').value;
            const { data: serviceTypeData, error: serviceTypeError } = await supabase
                .from('rooferscout_service_type_factors')
                .select('factor')
                .eq('service_type', selectedServiceType);

            if (serviceTypeError) {
                throw new Error(`Service Type Error: ${serviceTypeError.message}`);
            }
            if (serviceTypeData && serviceTypeData.length > 0) {
                console.log('Fetched Service Type Factor:', serviceTypeData[0].factor);
            } else {
                console.log('No service type data found.');
                return;
            }

            // Fetch State Factor
            const selectedState = document.getElementById('State').value;
            const { data: stateData, error: stateError } = await supabase
                .from('rooferscout_state_factors')
                .select('factor')
                .eq('state_name', selectedState);

            if (stateError) {
                throw new Error(`State Error: ${stateError.message}`);
            }
            if (stateData && stateData.length > 0) {
                console.log('Fetched State Factor:', stateData[0].factor);
            } else {
                console.log('No state data found.');
                return;
            }

            // Fetch Stories Cost
            const selectedStories = document.getElementById('Stories').value;
            const { data: storiesData, error: storiesError } = await supabase
                .from('rooferscout_stories_costs')
                .select('cost')
                .eq('stories_count', selectedStories);

            if (storiesError) {
                throw new Error(`Stories Error: ${storiesError.message}`);
            }
            if (storiesData && storiesData.length > 0) {
                console.log('Fetched Stories Cost:', storiesData[0].cost);
            } else {
                console.log('No stories data found.');
                return;
            }

            // Fetch Building Type Factor
            const selectedBuildingType = document.getElementById('Building-Type').value;
            const { data: buildingTypeData, error: buildingTypeError } = await supabase
                .from('rooferscout_building_type_factors')
                .select('factor')
                .eq('building_type', selectedBuildingType);

            if (buildingTypeError) {
                throw new Error(`Building Type Error: ${buildingTypeError.message}`);
            }
            if (buildingTypeData && buildingTypeData.length > 0) {
                console.log('Fetched Building Type Factor:', buildingTypeData[0].factor);
            } else {
                console.log('No building type data found.');
                return;
            }

            // Fetch Roof Square Footage
            const selectedRoofSqFt = document.getElementById('Estimated-Roof-Sq-Ft').value;
            const { data: roofSqFtData, error: roofSqFtError } = await supabase
                .from('rooferscout_estimated_roof_sq_ft')
                .select('upper_value')
                .eq('range_label', selectedRoofSqFt);

            if (roofSqFtError) {
                throw new Error(`Roof Sq Ft Error: ${roofSqFtError.message}`);
            }
            if (roofSqFtData && roofSqFtData.length > 0) {
                console.log('Fetched Roof Sq Ft:', roofSqFtData[0].upper_value);
            } else {
                console.log('No roof square footage data found.');
                return;
            }

            // Fetch Steepness Cost
            const selectedSteepness = document.querySelector('input[name="Roof-Steepness"]:checked').value;
            const { data: steepnessData, error: steepnessError } = await supabase
                .from('rooferscout_steepness_costs')
                .select('cost')
                .eq('steepness_level', selectedSteepness);

            if (steepnessError) {
                throw new Error(`Steepness Error: ${steepnessError.message}`);
            }
            if (steepnessData && steepnessData.length > 0) {
                console.log('Fetched Steepness Cost:', steepnessData[0].cost);
            } else {
                console.log('No steepness data found.');
                return;
            }

            // Calculate Min and Max Price
            const minPrice = Math.round(roofSqFtData[0].upper_value * (
                (materialData[0].min_cost * serviceTypeData[0].factor * stateData[0].factor * buildingTypeData[0].factor)
                + storiesData[0].cost + steepnessData[0].cost));
            const maxPrice = Math.round(roofSqFtData[0].upper_value * (
                (materialData[0].max_cost * serviceTypeData[0].factor * stateData[0].factor * buildingTypeData[0].factor)
                + storiesData[0].cost + steepnessData[0].cost));

            console.log('Min Price:', minPrice);
            console.log('Max Price:', maxPrice);

            // Display Min and Max Price
            document.getElementById('min-price').innerText = `${minPrice}`;
            document.getElementById('max-price').innerText = `${maxPrice}`;

            // Store the values in hidden fields
            document.getElementById('min-price-field').value = minPrice;
            document.getElementById('max-price-field').value = maxPrice;
            document.getElementById('quote-id').value = generateRandomString(32);

        } catch (error) {
            console.error('Unexpected error:', error);
        }
    });
}

function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

document.addEventListener('DOMContentLoaded', initApp);