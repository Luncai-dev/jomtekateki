
import { createClient } from "@supabase/supabase-js";

export default async (request) => {
  if (request.method !== "GET") {
    return Response.json(
      { error: "Method not allowed" },
      { status: 405 }
    );
  }

  const token = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");

  if (!token) {
    return Response.json(
      { error: "Sila log masuk dahulu" },
      { status: 401 }
    );
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );

  // Sahkan token login admin
  const { data: auth, error: authError } =
    await supabase.auth.getUser(token);

  if (authError || !auth.user) {
    return Response.json(
      { error: "Sesi tidak sah" },
      { status: 401 }
    );
  }

  // Semak akaun dalam senarai admin
  const { data: admin, error: adminError } =
    await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", auth.user.id)
      .maybeSingle();

  if (adminError) {
    return Response.json(
      { error: "Gagal menyemak admin" },
      { status: 500 }
    );
  }

  if (!admin) {
    return Response.json(
      { error: "Akses tidak dibenarkan" },
      { status: 403 }
    );
  }

  // Baca rekod pemain
  const { data: players, error } =
    await supabase
      .from("players")
      .select("id, name, phone, created_at")
      .order("created_at", {
        ascending: false
      });

  if (error) {
    return Response.json(
      { error: "Gagal membaca pemain" },
      { status: 500 }
    );
  }

  return Response.json({ players });
};
