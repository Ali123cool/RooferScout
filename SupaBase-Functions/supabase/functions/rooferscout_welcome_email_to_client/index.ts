import { serve } from "https://deno.land/std/http/server.ts";

// Brevo API Key from environment
const brevoApiKey = Deno.env.get("BREVO_API_KEY_ROOFERSCOUT_1");

if (!brevoApiKey) {
  console.error("Brevo API Key is missing");
  throw new Error("Brevo API key is not set");
}

// Brevo template ID
const brevoTemplateId = 1;  // Replace with your actual Brevo template ID

// Serve function to handle incoming requests
serve(async (req) => {
  try {
    // Parse the request body
    const body = await req.json();
    const { first_name, email, company_name } = body.record;  // Assume `record` contains these fields

    // Ensure required fields are present
    if (!email || !first_name) {
      console.error("Missing email or first name");
      return new Response("Missing email or first name", { status: 400 });
    }

    console.log("Sending email to:", { first_name, email, company_name });

    const brevoUrl = "https://api.brevo.com/v3/smtp/email";

    // Send email via Brevo API using api-key header
    const response = await fetch(brevoUrl, {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": brevoApiKey,  // Set the API key in the header (alternative to Bearer token)
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          email: "Admin-1@rooferscout.com",  // Sender's email
          name: "RooferScout",              // Sender's name
        },
        to: [{ email: email, name: first_name }],  // Recipient's email
        templateId: brevoTemplateId,               // Template ID
        params: {
          FIRSTNAME: first_name,   // Dynamic content for the template
          COMPANY: company_name || "Unknown Company"
        },
        subject: `We are working on your request, ${first_name}!`,  // Optional, overrides template subject
      }),
    });

    // Handle Brevo API response
    if (!response.ok) {
      const errorMessage = await response.text();
      console.error(`Brevo API Error: ${errorMessage}`);

      // Log specific response headers for debugging purposes
      console.log("Response Headers:", response.headers);

      return new Response(`Failed to send email via Brevo: ${errorMessage}`, { status: 500 });
    }

    const result = await response.json();
    console.log("Brevo API called successfully. Returned data:", result);

    // Return success response
    return new Response("Email sent successfully", { status: 200 });

  } catch (error) {
    console.error("Error processing request:", error);

    // Log full error stack for more details
    console.log("Full Error Stack:", error.stack);

    return new Response("Internal Server Error", { status: 500 });
  }
});
