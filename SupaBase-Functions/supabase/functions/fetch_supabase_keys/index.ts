import { serve } from "https://deno.land/std/http/server.ts";

serve((req) => {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const responseData = {
        supabaseUrl,
        supabaseAnonKey
    };

    return new Response(JSON.stringify(responseData), {
        headers: { "Content-Type": "application/json" },
        status: 200
    });
});
