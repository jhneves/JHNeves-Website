const authorized = (request, env) => {
  if (!env.ADMIN_TOKEN) return false;
  const header = request.headers.get("authorization") || "";
  return header === `Bearer ${env.ADMIN_TOKEN}`;
};

const csvCell = (value) => `"${String(value || "").replace(/"/g, '""')}"`;

export async function onRequestGet({ request, env }) {
  if (!authorized(request, env)) {
    return new Response("unauthorized", { status: 401 });
  }
  if (!env.WAITLIST) {
    return new Response("no KV binding", { status: 500 });
  }

  const rows = ["email,first_at,last_at,ref"];
  let cursor;
  do {
    const list = await env.WAITLIST.list({ prefix: "latch:", cursor });
    for (const key of list.keys) {
      const value = JSON.parse((await env.WAITLIST.get(key.name)) || "{}");
      rows.push([
        csvCell(value.email),
        csvCell(value.firstAt),
        csvCell(value.lastAt),
        csvCell(value.ref),
      ].join(","));
    }
    cursor = list.cursor;
    if (list.list_complete) break;
  } while (cursor);

  return new Response(rows.join("\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="latch-signups.csv"',
      "cache-control": "no-store",
    },
  });
}
