import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Initialize Supabase Client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Brevo API Key from environment
const brevoApiKey = Deno.env.get("BREVO_API_KEY_ROOFERSCOUT_1");

if (!brevoApiKey) {
  console.error("Brevo API Key is missing");
  throw new Error("Brevo API key is not set");
}

// Serve function to handle incoming requests
serve(async (req) => {
  try {
    // Parse the request body
    const body = await req.json();
    const { lead_id, buying_company_name, buying_company_agent_name, buying_company_agent_email, buying_company_agent_phone } = body.record;

    // Fetch the lead's source company from the leads_posted_to_shopify table
    const { data: leadData, error: leadError } = await supabase
      .from('leads_posted_to_shopify')
      .select('client_full_name, client_email, lead_source_company_name')
      .eq('id', lead_id)
      .single();

    if (leadError || !leadData) {
      console.error('Failed to fetch lead data:', leadError);
      return new Response("Failed to fetch lead data", { status: 500 });
    }

    const { client_full_name, client_email, lead_source_company_name } = leadData;

    // Query form_to_industry_association to get the Brevo details
    const { data: brevoData, error: brevoError } = await supabase
      .from('form_to_industry_association')
      .select('brevo_email, brevo_sender_name, brevo_template_id')
      .eq('company_name', lead_source_company_name)
      .single();

    if (brevoError || !brevoData) {
      console.error('Failed to fetch Brevo data. Using default values:', brevoError);
      // Use default fallback if no match found
      brevoData = {
        brevo_email: "Admin-1@rooferscout.com",
        brevo_sender_name: "RooferScout",
        brevo_template_id: 3,  // Default template ID
      };
    }

    const { brevo_email, brevo_sender_name, brevo_template_id } = brevoData;

    // Prepare the email content
    const brevoUrl = "https://api.brevo.com/v3/smtp/email";

    // Send email via Brevo API
    const response = await fetch(brevoUrl, {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": brevoApiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          email: brevo_email,         // Sender's email from the association
          name: brevo_sender_name,    // Sender's name from the association
        },
        to: [{ email: client_email, name: client_full_name }],  // Recipient's email and name
        templateId: brevo_template_id,  // Template ID from the association
        params: {
          FIRSTNAME: client_full_name,         // Client's first name
          COMPANY: buying_company_name || "Unknown Company",
          AGENTNAME: buying_company_agent_name,
          AGENTEMAIL: buying_company_agent_email,
          AGENTPHONE: buying_company_agent_phone
        },
        subject: `We have matched you with a provider, ${client_full_name}!`,  // Optional, overrides template subject
      }),
    });

    // Handle Brevo API response
    if (!response.ok) {
      const errorMessage = await response.text();
      console.error(`Brevo API Error: ${errorMessage}`);
      return new Response(`Failed to send email via Brevo: ${errorMessage}`, { status: 500 });
    }

    const result = await response.json();
    console.log("Brevo API called successfully. Returned data:", result);

    // Return success response
    return new Response("Email sent successfully", { status: 200 });

  } catch (error) {
    console.error("Error processing request:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
});
