import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // List and delete all existing users
  const { data: users } = await supabaseAdmin.auth.admin.listUsers();
  if (users?.users) {
    for (const user of users.users) {
      await supabaseAdmin.auth.admin.deleteUser(user.id);
    }
  }

  // Create the single user with a fake email (username-based)
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: "pautisserie2026@app.local",
    password: "PauliTomi2026",
    email_confirm: true,
    user_metadata: { username: "Pautisserie2026" },
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true, userId: data.user.id }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
