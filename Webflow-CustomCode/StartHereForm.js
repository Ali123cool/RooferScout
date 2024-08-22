import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://wcpcigdzqcmxvzfpbazr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjcGNpZ2R6cWNteHZ6ZnBiYXpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQxODIzMDAsImV4cCI6MjAzOTc1ODMwMH0.0AtbcXKmjDZY-HSu235YDWY5qCyd0JQTwWxtv2MWX5A';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    try {
        console.log('Attempting to fetch data from Supabase...');

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
})();
