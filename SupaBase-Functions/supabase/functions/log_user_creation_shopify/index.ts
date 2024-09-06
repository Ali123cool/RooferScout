// File: logUserCreation/index.ts
import { serve } from "https://deno.land/std@0.136.0/http/server.ts";

serve(async (req) => {
  // Check if the request method is POST
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    // Parse the incoming JSON body
    const json = await req.json();

    // Log the incoming JSON data
    console.log("Received JSON data:", json);

    // Return a response indicating success
    return new Response("Data received and logged", { status: 200 });
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return new Response("Bad Request", { status: 400 });
  }
});
