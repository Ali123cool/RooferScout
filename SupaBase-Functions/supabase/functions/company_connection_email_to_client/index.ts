import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmail } from "./sendEmail.js";  // Assuming you create a sendEmail module for Brevo

// Initialize Supabase Client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Use the secret for Brevo API key
const brevoApiKey = Deno.env.get("BREVO_API_KEY_ROOFERSCOUT_1")!;

// Function to send email using Brevo
async function sendEmail({ apiKey, to, sender, subject, content }) {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "api-key": apiKey
        },
        body: JSON.stringify({
            sender,
            to: [{ email: to }],
            subject: subject,
            htmlContent: `<html><body>${content}</body></html>`
        })
    });

    if (response.ok) {
        return true;
    } else {
        console.error("Failed to send email:", await response.text());
        return false;
    }
}

// Function to fetch lead, company, and sender info
async function fetchLeadCompanyAndSenderInfo(leadId) {
    // Fetch company info from lead_sold
    const { data: companyData, error: companyError } = await supabase
        .from('lead_sold')
        .select('*')
        .eq('lead_id', leadId)
        .single();

    if (companyError) {
        throw new Error(`Error fetching company data: ${companyError.message}`);
    }

    // Fetch client info from leads_posted_to_shopify
    const { data: clientData, error: clientError } = await supabase
        .from('leads_posted_to_shopify')
        .select('*')
        .eq('id', leadId)
        .single();

    if (clientError) {
        throw new Error(`Error fetching client data: ${clientError.message}`);
    }

    // Fetch sender info based on product_vendor
    const { data: senderData, error: senderError } = await supabase
        .from('form_to_industry_association')
        .select('brevo_sender_name, brevo_email')
        .eq('website_company_name', clientData.product_vendor)
        .single();

    if (senderError) {
        throw new Error(`Error fetching sender data: ${senderError.message}`);
    }

    return { companyData, clientData, senderData };
}

// Main request handler function
async function handleRequest(req) {
    try {
        const { lead_id } = await req.json();  // Expecting the lead_id to be passed in the request payload

        const { companyData, clientData, senderData } = await fetchLeadCompanyAndSenderInfo(lead_id);

        const emailContent = `
            Hi ${clientData.first_name},

            We are pleased to inform you that we have paired you with a company for your ${companyData.industry} needs. Please expect to be contacted soon.

            Here are the details of the company:
            - Company Name: ${companyData.buying_company_name}
            - Agent Name: ${companyData.buying_company_agent_name}
            - Email: ${companyData.buying_company_agent_email}
            - Phone: ${companyData.buying_company_agent_phone}

            Best regards,
            ${senderData.brevo_sender_name}
        `;

        const emailSent = await sendEmail({
            apiKey: brevoApiKey,
            to: clientData.email,
            sender: {
                name: senderData.brevo_sender_name,
                email: senderData.brevo_email
            },
            subject: "You've been paired with a company for your needs",
            content: emailContent,
        });

        if (emailSent) {
            return new Response("Email sent successfully", { status: 200 });
        } else {
            throw new Error("Failed to send email");
        }
    } catch (error) {
        console.error("Error processing request:", error);
        return new Response(`Error processing request: ${error.message}`, { status: 500 });
    }
}

serve(handleRequest);
