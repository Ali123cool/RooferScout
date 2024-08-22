import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://wcpcigdzqcmxvzfpbazr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjcGNpZ2R6cWNteHZ6ZnBiYXpyIiwicm9zZSI6ImFub24iLCJpYXQiOjE3MjQxODIzMDAsImV4cCI6MjAzOTc1ODMwMH0.0AtbcXKmjDZY-HSu235YDWY5qCyd0JQTwWxtv2MWX5A';
const supabase = createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', () => {

    async function calculatePriceRange() {
        console.log('Starting price range calculation...');

        const material = await getMaterialCost();
        if (!material) return;

        const serviceType = await getServiceTypeFactor();
        if (!serviceType) return;

        const state = await getStateFactor();
        if (!state) return;

        const stories = await getStoriesCost();
        if (!stories) return;

        const buildingType = await getBuildingTypeFactor();
        if (!buildingType) return;

        const roofSqFt = await getRoofSqFt();
        if (!roofSqFt) return;

        const steepness = await getSteepnessCost();
        if (!steepness) return;

        const minPrice = Math.round(roofSqFt.upper_value * ((material.min_cost * serviceType.factor * state.factor * buildingType.factor) + stories.cost + steepness.cost));
        const maxPrice = Math.round(roofSqFt.upper_value * ((material.max_cost * serviceType.factor * state.factor * buildingType.factor) + stories.cost + steepness.cost));

        console.log('Min Price:', minPrice);
        console.log('Max Price:', maxPrice);

        document.getElementById('min-price').innerText = `${minPrice}`;
        document.getElementById('max-price').innerText = `${maxPrice}`;

        document.getElementById('min-price-field').value = minPrice;
        document.getElementById('max-price-field').value = maxPrice;
        document.getElementById('quote-id').value = generateRandomString(32);
    }

    async function getMaterialCost() {
        const element = document.getElementById('Desired-Material-Type');
        const value = element.value;
        const { data, error } = await supabase
            .from('rooferscout_material_costs')
            .select('*')
            .eq('material_name', value);
        if (error || !data || !data.length) {
            console.error('Failed to fetch material costs', error);
            return null;
        }
        console.log('Material Cost:', data[0]);
        return data[0];
    }

    async function getServiceTypeFactor() {
        const element = document.getElementById('Type-Of-Service-Desired');
        const value = element.value;
        const { data, error } = await supabase
            .from('rooferscout_service_type_factors')
            .select('*')
            .eq('service_type', value);
        if (error || !data || !data.length) {
            console.error('Failed to fetch service type factor', error);
            return null;
        }
        console.log('Service Type Factor:', data[0]);
        return data[0];
    }

    async function getStateFactor() {
        const element = document.getElementById('State');
        const value = element.value;
        const { data, error } = await supabase
            .from('rooferscout_state_factors')
            .select('*')
            .eq('state_name', value);
        if (error || !data || !data.length) {
            console.error('Failed to fetch state factor', error);
            return null;
        }
        console.log('State Factor:', data[0]);
        return data[0];
    }

    async function getStoriesCost() {
        const element = document.getElementById('Stories');
        const value = element.value;
        const { data, error } = await supabase
            .from('rooferscout_stories_costs')
            .select('*')
            .eq('stories_count', value);
        if (error || !data || !data.length) {
            console.error('Failed to fetch stories cost', error);
            return null;
        }
        console.log('Stories Cost:', data[0]);
        return data[0];
    }

    async function getBuildingTypeFactor() {
        const element = document.getElementById('Building-Type');
        const value = element.value;
        const { data, error } = await supabase
            .from('rooferscout_building_type_factors')
            .select('*')
            .eq('building_type', value);
        if (error || !data || !data.length) {
            console.error('Failed to fetch building type factor', error);
            return null;
        }
        console.log('Building Type Factor:', data[0]);
        return data[0];
    }

    async function getRoofSqFt() {
        const element = document.getElementById('Estimated-Roof-Sq-Ft');
        const value = element.value;
        const { data, error } = await supabase
            .from('rooferscout_estimated_roof_sq_ft')
            .select('*')
            .eq('range_label', value);
        if (error || !data || !data.length) {
            console.error('Failed to fetch roof square footage', error);
            return null;
        }
        console.log('Roof Sq Ft:', data[0]);
        return data[0];
    }

    async function getSteepnessCost() {
        const element = document.querySelector('input[name="Roof-Steepness"]:checked');
        const value = element.value;
        const { data, error } = await supabase
            .from('rooferscout_steepness_costs')
            .select('*')
            .eq('steepness_level', value);
        if (error || !data || !data.length) {
            console.error('Failed to fetch steepness cost', error);
            return null;
        }
        console.log('Steepness Cost:', data[0]);
        return data[0];
    }

    function generateRandomString(length) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    document.getElementById('calculate-button').addEventListener('click', calculatePriceRange);
});
