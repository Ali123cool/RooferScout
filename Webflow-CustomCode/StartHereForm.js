import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://wcpcigdzqcmxvzfpbazr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjcGNpZ2R6cWNteHZ6ZnBiYXpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQxODIzMDAsImV4cCI6MjAzOTc1ODMwMH0.0AtbcXKmjDZY-HSu235YDWY5qCyd0JQTwWxtv2MWX5A';
const supabase = createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('calculate-button').addEventListener('click', async () => {
        try {
            console.log('Calculate button clicked.');

            // Fetch entire Material Cost table
            const { data: materialData, error: materialError } = await supabase
                .from('rooferscout_material_costs')
                .select('*');  // Select all columns

            if (materialError) {
                throw new Error(`Material Error: ${materialError.message}`);
            }
            if (materialData && materialData.length > 0) {
                console.log('Fetched Material Costs:', materialData);
            } else {
                console.log('No material data found.');
            }

        } catch (error) {
            console.error('Unexpected error:', error);
        }
    });
});