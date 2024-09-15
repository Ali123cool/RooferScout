// Initialize Supabase Client
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// General function to capitalize the first letter of any string
const capitalizeFirstLetter = (input) => {
  if (input && typeof input === 'string') {
    return input.charAt(0).toUpperCase() + input.slice(1).toLowerCase();
  }
  return input;
};

// Function to normalize input for comparison
const normalizeString = (input) => input ? input.trim().toLowerCase() : '';

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
      timing_for_service,
      submission_timestamp,
      call_allowed,
      text_allowed,
      email_allowed,
      business_name
    } = payload.record;

    // Capitalize and normalize the fields before the duplicate check
    const capitalizedCity = capitalizeFirstLetter(city);
    const normalizedFirstName = normalizeString(first_name);
    const normalizedLastName = normalizeString(last_name);
    const normalizedStreetAddress = normalizeString(street_address);
    const normalizedCity = normalizeString(capitalizedCity);
    const normalizedState = normalizeString(state);

    // Step 1: Check for duplicate submissions
    let isDuplicate = false;
    const { data: existingLeadData, error: duplicateError } = await supabase
      .from('rooferscout_main_form_submission_v1')
      .select('*')
      .eq('first_name', normalizedFirstName)
      .eq('last_name', normalizedLastName)
      .eq('street_address', normalizedStreetAddress)
      .eq('city', normalizedCity)
      .eq('state', normalizedState)
      .neq('id', id)
      .order('submission_timestamp', { ascending: false })
      .limit(1);

    if (duplicateError) {
      console.error('Error checking for duplicates:', duplicateError.message);
      return new Response(JSON.stringify({ message: 'Error checking for duplicates', error: duplicateError.message }), { status: 500 });
    }

    if (existingLeadData && existingLeadData.length > 0) {
      const existingLead = existingLeadData[0];
      const lastSubmission = new Date(existingLead.submission_timestamp);
      const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);

      if (lastSubmission >= twelveHoursAgo) {
        console.log('Matching lead found within 12 hours; marking as duplicate.');
        isDuplicate = true;
      }
    }

    if (isDuplicate) {
      return new Response(JSON.stringify({ message: 'Duplicate lead within 12 hours; no action taken.' }), { status: 200 });
    }

    // Step 2: Calculate demand score and demand status
    const demandScore = 
      (roof_steepness === 'Flat' || roof_steepness === 'Moderate' ? 1 : 0) +
      (type_of_service_desired === 'Full Roof Replacement' ? 1 : 0) +
      (additional_services ? 1 : 0) +
      (specific_materials ? 1 : 0) +
      (additional_information ? 1 : 0) +
      (will_you_be_using_insurance_2 === 'Yes' ? 1 : 0) +
      (policy_type_2 === 'Home Owners - Replacement Cost' ? 1 : 0) +
      (damage_type && damage_type !== "I'm Not Sure" ? 1 : 0) +
      (payload.record.does_user_want_service_2 === 'Yes' ? 1 : 0);

    const demandStatus = demandScore > 6 ? 'High Demand' : 'Regular';

    console.log(`Calculated Demand Score: ${demandScore}, Demand Status: ${demandStatus}`);

    // Step 3: Create product title and description
    const productTitle = `${capitalizedCity}, ${state} - ${industry} - ${type_of_service_desired} - ($${min_price_field} - $${max_price_field})`;

    const productDescription = [
      `Lead ID: ${id}`,
      `Call Allowed: ${call_allowed}`,
      `Text Allowed: ${text_allowed}`,
      `Email Allowed: ${email_allowed}`,
      `Building Type: ${building_type}`,
      `Estimated Roof Sq Ft: ${estimated_roof_sq_ft}`,
      `Stories: ${stories}`,
      `Roof Steepness: ${roof_steepness}`,
      `Type of Service Desired: ${type_of_service_desired}`,
      `Current Material Type: ${current_material_type}`,
      `Desired Material Type: ${desired_material_type}`,
      `Additional Services: ${additional_services}`,
      `Specific Materials: ${specific_materials}`,
      `Additional Information: ${additional_information}`,
      `Will you be using insurance? ${will_you_be_using_insurance_2}`,
      `Insurance Company: ${insurance_company_2}`,
      `Policy Type: ${policy_type_2}`,
      `Started Claim Process: ${started_claim_process_2}`,
      `Insurance Help: ${insurance_help_2}`,
      `Estimated Minimum Price: ${min_price_field}`,
      `Estimated Maximum Price: ${max_price_field}`,
      `Damage Type: ${damage_type}`,
      `Demand Status: ${demandStatus}`,
      `Timing for Service: ${timing_for_service}`,
      `Submission Timestamp: ${submission_timestamp}`
    ].filter(Boolean).join('\n');

    const clientFullAddress = `${street_address} ${street_address_2}, ${capitalizedCity}, ${state} ${zip_code}`;

    // Step 4: Insert into leads_posted_to_shopify table
    const { error: insertError } = await supabase
      .from('leads_posted_to_shopify')
      .insert([{
        id: id,
        product_title: productTitle,
        product_description: productDescription,
        product_category: industry,
        product_price: demandStatus === 'High Demand' ? 110 : 90,
        product_type: type_of_service_desired,
        product_vendor: company_name ?? 'Scout',
        requires_shipping: 'false',
        client_full_name: `${first_name} ${last_name}`,
        client_business_name: business_name ?? '',
        client_email: email,
        client_phone_number: phone_number,
        client_street_address_full: clientFullAddress,
        lead_source_company_name: company_name ?? 'Scout',
        client_city: capitalizedCity,
        client_state: state,
        industry: industry,
        service_timing: timing_for_service,
        demand: demandStatus,
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
