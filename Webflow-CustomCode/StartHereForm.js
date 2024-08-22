
<script type="module">
document.addEventListener('DOMContentLoaded', () => {
    import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

    const supabaseUrl = 'https://wcpcigdzqcmxvzfpbazr.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjcGNpZ2R6cWNteHZ6ZnBiYXpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQxODIzMDAsImV4cCI6MjAzOTc1ODMwMH0.0AtbcXKmjDZY-HSu235YDWY5qCyd0JQTwWxtv2MWX5A';
    const supabase = createClient(supabaseUrl, supabaseKey);

    async function calculatePriceRange() {
        console.log('Starting price range calculation...');

        const material = await fetchValue('Desired-Material-Type', 'rooferscout_material_costs', 'material_name', 'min_cost', 'max_cost');
        if (!material) return;

        const serviceType = await fetchValue('Type-Of-Service-Desired', 'rooferscout_service_type_factors', 'service_type', 'factor');
        if (!serviceType) return;

        const state = await fetchValue('State', 'rooferscout_state_factors', 'state_name', 'factor');
        if (!state) return;

        const stories = await fetchValue('Stories', 'rooferscout_stories_costs', 'stories_count', 'cost');
        if (!stories) return;

        const buildingType = await fetchValue('Building-Type', 'rooferscout_building_type_factors', 'building_type', 'factor');
        if (!buildingType) return;

        const roofSqFt = await fetchValue('Estimated-Roof-Sq-Ft', 'rooferscout_estimated_roof_sq_ft', 'range_label', 'upper_value');
        if (!roofSqFt) return;

        const steepness = await fetchValue('Roof-Steepness', 'rooferscout_steepness_costs', 'steepness_level', 'cost');
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
</script>