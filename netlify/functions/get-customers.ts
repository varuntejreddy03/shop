import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!
);

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "GET") return { statusCode: 405, body: "Method Not Allowed" };
  try {
    const { data, error } = await supabase.from("customers").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    const customers = data.map((row) => ({ id: row.id, name: row.name, phone: row.phone, createdAt: row.created_at }));
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ success: true, customers }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ success: false, message: error instanceof Error ? error.message : "Internal server error" }) };
  }
};
