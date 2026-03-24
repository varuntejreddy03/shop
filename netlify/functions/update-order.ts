import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!
);

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "PUT") return { statusCode: 405, body: "Method Not Allowed" };

  const id = parseInt(event.queryStringParameters?.id || "");
  if (isNaN(id)) return { statusCode: 400, body: JSON.stringify({ message: "Invalid order ID" }) };

  try {
    const { items } = JSON.parse(event.body || "{}");
    if (!items || !Array.isArray(items)) return { statusCode: 400, body: JSON.stringify({ message: "Items required" }) };

    await supabase.from("order_items").delete().eq("order_id", id);

    const orderItems = items.map((item: any) => {
      const { itemType, quantity, price, id: _id, ...itemData } = item;
      return { order_id: id, item_type: itemType, item_data: JSON.stringify(itemData), quantity, price };
    });

    const { error } = await supabase.from("order_items").insert(orderItems);
    if (error) throw error;

    const totalAmount = items.reduce((s: number, it: any) => s + it.price * it.quantity, 0);
    await supabase.from("orders").update({ total_amount: totalAmount }).eq("id", id);

    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ success: true, orderId: id }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ success: false, message: error instanceof Error ? error.message : "Internal server error" }) };
  }
};
