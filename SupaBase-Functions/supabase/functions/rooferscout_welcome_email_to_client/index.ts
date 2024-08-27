import { serve } from "https://deno.land/std/http/server.ts";

serve(async (req) => {
    try {
        const body = await req.json();
        const { first_name, email } = body.record;

        const mailgunApiKey = Deno.env.get("MAILGUN_API_777a617d-4471d704");
        const mailgunUrl = "https://api.mailgun.net/v3/sandboxf65e25f5b8da4a0f8f28bf1630f5ca0b.mailgun.org/messages";

        const response = await fetch(mailgunUrl, {
            method: "POST",
            headers: {
                Authorization: `Basic ${btoa(`api:${mailgunApiKey}`)}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                from: `Mailgun Sandbox <postmaster@sandboxf65e25f5b8da4a0f8f28bf1630f5ca0b.mailgun.org>`,
                to: `${first_name} <${email}>`,
                subject: `Hello ${first_name}`,
                template: "testtesttest",
                "h:X-Mailgun-Variables": JSON.stringify({ first_name }),
            }),
        });

        if (!response.ok) {
            console.error(`Mailgun API Error: ${response.statusText}`);
            return new Response("Failed to send email", { status: 500 });
        }

        return new Response("Email sent successfully", { status: 200 });
    } catch (err) {
        console.error("Error processing request:", err);
        return new Response("Internal Server Error", { status: 500 });
    }
});
