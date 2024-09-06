import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Initialize Supabase Client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);


// Capitalize the first letter of the city
const capitalizeCity = (city) => {
  if (city && typeof city === 'string') {
    return city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
  }
  return city;
};


serve(async (req) => {
  try {
    // Extract the payload from the request
    const payload = await req.json();
    const {
      id,
      first_name,
      last_name,
      street_address,
      street_address_2,
      city,
      state,
      zip_code,
      email,
      phone_number,
      company_name,
      industry,
      type_of_service_desired,
      min_price_field,
      max_price_field,
      building_type,
      estimated_roof_sq_ft,
      stories,
      roof_steepness,
      current_material_type,
      desired_material_type,
      additional_services,
      specific_materials,
      additional_information,
      will_you_be_using_insurance_2,
      insurance_company_2,
      policy_type_2,
      started_claim_process_2,
      insurance_help_2,
      damage_type,
      demand_status,
      timing_for_service,
      submission_timestamp,
      call_allowed,
      text_allowed,
      email_allowed,
      business_name
    } = payload.record;

    // Apply city capitalization formatting
    city = capitalizeCity(city);

    // Default: Consider the lead as unique
    let isDuplicate = false;

    // Step 1.1: Check for potential duplicates in the last 12 hours
    const { data: existingLeadData, error: duplicateError } = await supabase
      .from('rooferscout_main_form_submission_v1')
      .select('*')
      .eq('first_name', first_name)
      .eq('last_name', last_name)
      .eq('street_address', street_address)
      .eq('city', city)
      .eq('state', state)
      .neq('id', id) // Exclude the current submission by ensuring IDs are different
      .order('submission_timestamp', { ascending: false }) // Order by the most recent submission
      .limit(1); // We only care about the most recent submission

    if (duplicateError) {
      console.error('Error checking for duplicates:', duplicateError.message);
      return new Response(JSON.stringify({ message: 'Error checking for duplicates', error: duplicateError.message }), { status: 500 });
    }

    if (existingLeadData && existingLeadData.length > 0) {
      const existingLead = existingLeadData[0];
      const lastSubmission = new Date(existingLead.submission_timestamp);
      const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);

      console.log('Existing Lead Found:', existingLead);
      console.log('Current Record:', {
        id, first_name, last_name, street_address, city, state, submission_timestamp: new Date().toISOString(),
      });

      // Step 1.2: Check if the submission was within the last 12 hours
      if (lastSubmission >= twelveHoursAgo) {
        console.log('Matching lead found within 12 hours; marking as duplicate.');
        isDuplicate = true;
      }
    }

    // Final decision: If it's a duplicate, stop processing
    if (isDuplicate) {
      return new Response(JSON.stringify({ message: 'Duplicate lead within 12 hours; no action taken.' }), { status: 200 });
    } else {
      console.log('No duplicate found; lead is unique. Proceeding with lead processing.');
      // Proceed with lead processing (insert into leads_posted_to_shopify, etc.)
    }

    // Step 2: Create product title
    const productTitle = `${city}, ${state} - ${industry} - ${type_of_service_desired} - ($${min_price_field} - $${max_price_field})`;

    // Step 3: Calculate product price
    const productPrice = (parseFloat(min_price_field) * 0.02).toFixed(2);

    // Step 4: Generate product description dynamically
    let productDescription = '';

    const descriptionFields = {
      'Lead ID': id,
      'Call Allowed': call_allowed,
      'Text Allowed': text_allowed,
      'Email Allowed': email_allowed,
      'Building Type': building_type,
      'Estimated Roof Sq Ft': estimated_roof_sq_ft,
      'Stories': stories,
      'Roof Steepness': roof_steepness,
      'Type of Service Desired': type_of_service_desired,
      'Current Material Type': current_material_type,
      'Desired Material Type': desired_material_type,
      'Additional Services': additional_services,
      'Specific Materials': specific_materials,
      'Additional Information': additional_information,
      'Will you be using insurance?': will_you_be_using_insurance_2,
      'Insurance Company': insurance_company_2,
      'Policy Type': policy_type_2,
      'Started Claim Process': started_claim_process_2,
      'Insurance Help': insurance_help_2,
      'Estimated Minimum Price': min_price_field,
      'Estimated Maximum Price': max_price_field,
      'Damage Type': damage_type,
      'Demand Status': demand_status,
      'Timing for Service': timing_for_service,
      'Submission Timestamp': submission_timestamp
    };

    // Loop through the fields and append to product description
    for (const [key, value] of Object.entries(descriptionFields)) {
      if (value !== null && value !== undefined && value !== '') {
        productDescription += `- ${key}: ${value}\n`;
      }
    }

    // Step 5: Combine address fields
    const clientFullAddress = `${street_address} ${street_address_2}, ${city}, ${state} ${zip_code}`;

    // Step 6: Insert into leads_posted_to_shopify table
    const { error: insertError } = await supabase
      .from('leads_posted_to_shopify')
      .insert([{
        id: id,
        product_title: productTitle,
        product_description: productDescription,
        product_category: industry,
        product_price: productPrice,
        product_type: type_of_service_desired,
        product_vendor: company_name ?? 'Your Vendor Name',
        requires_shipping: 'false',  // or true based on your requirement
        client_full_name: `${first_name} ${last_name}`,
        client_business_name: business_name ?? '',
        client_email: email,
        client_phone_number: phone_number,
        client_street_address_full: clientFullAddress,
        lead_source_company_name: 'Your Company Name',
        client_city: city,
        client_state: state,
        industry: industry,
        service_timing: timing_for_service,
        demand: demand_status,
        time_posted: new Date().toISOString()
      }]);

    if (insertError) {
      console.error('Error inserting lead into Shopify table:', insertError.message);
      return new Response(JSON.stringify({ message: 'Failed to insert lead into Shopify table', error: insertError.message }), { status: 500 });
    }

    console.log('Lead successfully posted to Shopify table.');
    return new Response(JSON.stringify({ message: 'Lead successfully posted to Shopify table' }), { status: 200 });

  } catch (err) {
    console.error('Unexpected error:', err.message);
    return new Response(JSON.stringify({ message: 'Unexpected error occurred', error: err.message }), { status: 500 });
  }
});
