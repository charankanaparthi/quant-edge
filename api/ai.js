const https = require("https");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  if (req.method !== "POST")    { res.status(405).json({ error: "POST only" }); return; }

  const ANTHROPIC_KEY = process.env.ANTHROPIC_KEY;
  if (!ANTHROPIC_KEY) { res.status(500).json({ error: "Anthropic key not set in Vercel env vars" }); return; }

  const body = JSON.stringify(req.body);
  const options = {
    hostname: "api.anthropic.com",
    path:     "/v1/messages",
    method:   "POST",
    headers:  {
      "Content-Type":      "application/json",
      "x-api-key":         ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Length":    Buffer.byteLength(body),
    },
  };

  return new Promise((resolve) => {
    const request = https.request(options, (r) => {
      let data = "";
      r.on("data", (c) => (data += c));
      r.on("end", () => {
        res.status(r.statusCode).setHeader("Content-Type","application/json").send(data);
        resolve();
      });
    });
    request.on("error", (e) => { res.status(502).json({ error: e.message }); resolve(); });
    request.write(body);
    request.end();
  });
};
