// Cloudflare Worker: keeps your API key secret and answers the website.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
    if (request.method !== "POST") return new Response("Send a POST", { status: 405, headers: CORS });

    try {
      const { messages } = await request.json();
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-5-5",
          max_tokens: 1000,
          system: "You are a friendly, concise assistant. Answer clearly.",
          messages: (messages || []).slice(-20),
        }),
      });
      const d = await r.json();
      if (!r.ok) return Response.json({ error: d.error?.message || "AI error" }, { status: 500, headers: CORS });
      return Response.json({ reply: d.content.map(c => c.text || "").join("") }, { headers: CORS });
    } catch (e) {
      return Response.json({ error: "Bad request" }, { status: 400, headers: CORS });
    }
  },
};
