const DOWNLOAD_PATH = "/latch/downloads/Latch-0.1-8.dmg";
const DOWNLOAD_NAME = "Latch-0.1-8.dmg";

const notFound = () => new Response("Not found", {
  status: 404,
  headers: { "cache-control": "no-store" },
});

export async function onRequestGet({ env, params }) {
  try {
    const token = typeof params?.token === "string" ? params.token : "";
    if (!/^[0-9a-f]{48}$/.test(token) || !env.WAITLIST || !env.ASSETS) {
      return notFound();
    }

    const tokenKey = `latch-download:${token}`;
    const grant = await env.WAITLIST.get(tokenKey, "json");
    if (!grant?.signupKey) return notFound();

    const asset = await env.ASSETS.fetch(`https://assets.local${DOWNLOAD_PATH}`);
    if (!asset.ok || !asset.body) {
      return new Response("Download unavailable", {
        status: 503,
        headers: { "cache-control": "no-store" },
      });
    }

    await env.WAITLIST.delete(tokenKey);

    const response = new Response(asset.body, asset);
    response.headers.set("content-type", "application/x-apple-diskimage");
    response.headers.set("content-disposition", `attachment; filename="${DOWNLOAD_NAME}"`);
    response.headers.set("cache-control", "private, no-store");
    response.headers.set("x-content-type-options", "nosniff");
    return response;
  } catch {
    return new Response("Download unavailable", {
      status: 503,
      headers: { "cache-control": "no-store" },
    });
  }
}
