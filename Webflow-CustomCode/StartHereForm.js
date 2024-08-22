import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://wcpcigdzqcmxvzfpbazr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjcGNpZ2R6cWNteHZ6ZnBiYXpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQxODIzMDAsImV4cCI6MjAzOTc1ODMwMH0.0AtbcXKmjDZY-HSu235YDWY5qCyd0JQTwWxtv2MWX5A';
const supabase = createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed");

    const calculateButton = document.getElementById('calculate-button');
    if (!calculateButton) {
        console.error("Calculate button not found!");
        return;
    }

    calculateButton.addEventListener('click', async (event) => {
        event.preventDefault();  // Prevent the default action of the anchor link
        console.log('Calculate button clicked.');

        try {
            console.log('Attempting to fetch data...');
            
            // Attempting a simple data fetch from Supabase
            const { data, error } = await supabase
                .from('rooferscout_material_costs')
                .select('*');

            if (error) {
                console.error('Error fetching data:', error);
                return;
            }

            if (data && data.length > 0) {
                console.log('Fetched Data:', data);
            } else {
                console.log('No data found');
            }
        } catch (error) {
            console.error('Unexpected error occurred:', error);
        }
    });
});
