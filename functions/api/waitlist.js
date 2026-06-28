// Cloudflare Pages Function:  POST /api/waitlist  { email }
// Stores each signup in Cloudflare KV (binding: WAITLIST). No third party.
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });

export async function onRequestPost({ request, env }) {
  try {
    const { email } = await request.json();
    const ok = typeof email === "string" &&
      email.length < 200 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
    if (!ok) return json({ ok: false, error: "invalid email" }, 400);

    if (env.WAITLIST) {
      const key = `${new Date().toISOString()}__${email.toLowerCase()}`;
      await env.WAITLIST.put(key, JSON.stringify({
        email,
        at: new Date().toISOString(),
        ref: request.headers.get("referer") || "",
        ua: request.headers.get("user-agent") || "",
        ip: request.headers.get("cf-connecting-ip") || "",
      }));
    }
    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, error: "server" }, 500);
  }
}
