import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://wcpcigdzqcmxvzfpbazr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjcGNpZ2R6cWNteHZ6ZnBiYXpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQxODIzMDAsImV4cCI6MjAzOTc1ODMwMH0.0AtbcXKmjDZY-HSu235YDWY5qCyd0JQTwWxtv2MWX5A';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchData(table, column, value) {
    const { data, error } = await supabase.from(table).select('*').eq(column, value);
    if (error) {
        throw new Error(`${table} Error: ${error.message}`);
    }
    return data.length > 0 ? data[0] : null;
}

async function calculatePrice() {
    try {
        console.log('Calculate button clicked.');

        const selectedMaterial = document.getElementById('Desired-Material-Type').value;
        const selectedServiceType = document.getElementById('Type-Of-Service-Desired').value;
        const selectedState = document.getElementById('State').value;
        const selectedStories = document.getElementById('Stories').value;
        const selectedBuildingType = document.getElementById('Building-Type').value;
        const selectedRoofSqFt = document.getElementById('Estimated-Roof-Sq-Ft').value;
        const selectedSteepness = document.querySelector('input[name="Roof-Steepness"]:checked').value;

        const materialData = await fetchData('rooferscout_material_costs', 'material_name', selectedMaterial);
        const serviceTypeData = await fetchData('rooferscout_service_type_factors', 'service_type', selectedServiceType);
        const stateData = await fetchData('rooferscout_state_factors', 'state_name', selectedState);
        const storiesData = await fetchData('rooferscout_stories_costs', 'stories_count', selectedStories);
        const buildingTypeData = await fetchData('rooferscout_building_type_factors', 'building_type', selectedBuildingType);
        const roofSqFtData = await fetchData('rooferscout_estimated_roof_sq_ft', 'range_label', selectedRoofSqFt);
        const steepnessData = await fetchData('rooferscout_steepness_costs', 'steepness_level', selectedSteepness);

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
    }
}

function displayPrices(minPrice, maxPrice) {
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

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('calculate-button').addEventListener('click', (event) => {
        event.preventDefault();
        calculatePrice();
    });
});
