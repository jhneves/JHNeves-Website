// Cloudflare Pages Function:  GET /api/signups?token=YOUR_SECRET  ->  CSV of all signups.
// Protected by env var ADMIN_TOKEN so it isn't public. Reads from KV (binding: WAITLIST).
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  if (!env.ADMIN_TOKEN || url.searchParams.get("token") !== env.ADMIN_TOKEN) {
    return new Response("unauthorized", { status: 401 });
  }
  if (!env.WAITLIST) return new Response("no KV binding", { status: 500 });

  const esc = (s) => `"${String(s || "").replace(/"/g, '""')}"`;
  const rows = ["email,at,ref"];
  let cursor;
  do {
    const list = await env.WAITLIST.list({ cursor });
    for (const k of list.keys) {
      const v = JSON.parse((await env.WAITLIST.get(k.name)) || "{}");
      rows.push([esc(v.email), esc(v.at), esc(v.ref)].join(","));
    }
    cursor = list.cursor;
    if (list.list_complete) break;
  } while (cursor);

  return new Response(rows.join("\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="waitlist.csv"',
    },
  });
}
