const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });

const normalizedEmail = (value) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const isValidEmail = (value) =>
  value.length > 3 && value.length <= 200 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);

const hexDigest = async (value) => {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const randomToken = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

const sourcePath = (request) => {
  try {
    const referrer = request.headers.get("referer");
    return referrer ? new URL(referrer).pathname.slice(0, 300) : "/latch/";
  } catch {
    return "/latch/";
  }
};

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    if (body?.website) return json({ ok: false, error: "invalid_request" }, 400);

    const email = normalizedEmail(body?.email);
    if (!isValidEmail(email)) {
      return json({ ok: false, error: "invalid_email" }, 400);
    }
    if (!env.WAITLIST || !env.ASSETS) {
      return json({ ok: false, error: "service_unavailable" }, 503);
    }

    const now = new Date().toISOString();
    const key = `latch:${await hexDigest(email)}`;
    const existing = await env.WAITLIST.get(key, "json");
    await env.WAITLIST.put(key, JSON.stringify({
      email,
      firstAt: existing?.firstAt || existing?.at || now,
      lastAt: now,
      lastDownloadedAt: now,
      downloadCount: (existing?.downloadCount || 0) + 1,
      ref: sourcePath(request),
      consent: "latch_beta_and_release_updates",
    }));

    const token = randomToken();
    await env.WAITLIST.put(`latch-download:${token}`, JSON.stringify({
      signupKey: key,
      createdAt: now,
    }), { expirationTtl: 600 });

    return json({
      ok: true,
      downloadUrl: `/api/latch-download/${token}`,
    });
  } catch {
    return json({ ok: false, error: "server" }, 500);
  }
}
