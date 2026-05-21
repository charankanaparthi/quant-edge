const https = require("https");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  if (req.method !== "POST")    { res.status(405).json({ error: "POST only" }); return; }

  const KEY = process.env.ANTHROPIC_KEY;
  if (!KEY) { res.status(500).json({ error: "AI not configured on server" }); return; }

  const { messages, system, max_tokens, tools } = req.body || {};
  if (!messages?.length) { res.status(400).json({ error: "Missing messages" }); return; }

  const body = JSON.stringify({
    model: "claude-sonnet-4-5",
    max_tokens: max_tokens || 4000,
    ...(system ? { system } : {}),
    tools: tools || [{ type: "web_search_20250305", name: "web_search" }],
    messages,
  });

  const options = {
    hostname: "api.anthropic.com",
    path:     "/v1/messages",
    method:   "POST",
    headers: {
      "Content-Type":      "application/json",
      "x-api-key":         KEY,
      "anthropic-version": "2023-06-01",
      "Content-Length":    Buffer.byteLength(body),
    },
  };

  return new Promise((resolve) => {
    const req2 = https.request(options, (r) => {
      let data = "";
      r.on("data", c => data += c);
      r.on("end", () => {
        res.setHeader("Content-Type", "application/json");
        res.status(r.statusCode).send(data);
        resolve();
      });
    });
    req2.on("error", e => { res.status(502).json({ error: e.message }); resolve(); });
    req2.write(body);
    req2.end();
  });
};
