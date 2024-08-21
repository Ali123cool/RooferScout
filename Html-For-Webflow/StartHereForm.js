// supabase-script.js

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Create a single Supabase client for interacting with your database
const supabaseUrl = 'https://wcpcigdzqcmxvzfpbazr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjcGNpZ2R6cWNteHZ6ZnBiYXpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQxODIzMDAsImV4cCI6MjAzOTc1ODMwMH0.0AtbcXKmjDZY-HSu235YDWY5qCyd0JQTwWxtv2MWX5A';
const supabase = createClient(supabaseUrl, supabaseKey);

document.getElementById('fetchDataBtn').addEventListener('click', async function() {
    try {
        const { data, error } = await supabase
            .from('rooferscout_building_type_factors')
            .select('*');

        if (error) {
            throw error;
        }

        // Display the data as a JSON string with proper formatting
        document.getElementById('output').textContent = JSON.stringify(data, null, 2);
    } catch (error) {
        document.getElementById('output').textContent = `Error: ${error.message}`;
    }
});
