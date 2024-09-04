import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Initialize Supabase Client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Brevo API Key
const brevoApiKey = Deno.env.get("BREVO_API_KEY_ROOFERSCOUT_1");

serve(async (req) => {
    try {
        const body = await req.json();
        const { first_name, email, company_name } = body.record;  // Assuming record contains these fields

        // Fetch the sender details from form_to_industry_association based on company_name
        const { data: senderData, error: senderError } = await supabase
            .from('form_to_industry_association')
            .select('brevo_sender_name, brevo_email')
            .eq('website_company_name', company_name)
            .single();

        if (senderError) {
            console.error("Error fetching sender details:", senderError);
            return new Response("Failed to find sender information", { status: 500 });
        }

        const senderName = senderData.brevo_sender_name;
        const senderEmail = senderData.brevo_email;

        const brevoUrl = "https://api.brevo.com/v3/smtp/email";

        // Email sending logic directly inside the function
        const response = await fetch(brevoUrl, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${brevoApiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                sender: {
                    name: senderName,   // Use the sender name from the database
                    email: senderEmail  // Use the sender email from the database
                },
                to: [{ email: email, name: first_name }],
                subject: `Hello ${first_name}`,
                htmlContent: `<html><body><h1>Hello ${first_name}</h1><p>We are excited to have you onboard!</p></body></html>`,
            }),
        });

        if (!response.ok) {
            console.error(`Brevo API Error: ${response.statusText}`);
            return new Response("Failed to send email", { status: 500 });
        }

        return new Response("Email sent successfully", { status: 200 });
    } catch (err) {
        console.error("Error processing request:", err);
        return new Response("Internal Server Error", { status: 500 });
    }
});
