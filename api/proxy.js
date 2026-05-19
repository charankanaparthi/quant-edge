const https = require("https");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }

  const { path, token, base } = req.query;
  if (!path || !token) { res.status(400).json({ error: "Missing params" }); return; }

  const url = base === "alphavantage"
    ? `https://www.alphavantage.co${decodeURIComponent(path)}&apikey=${token}`
    : `https://finnhub.io/api/v1${decodeURIComponent(path)}&token=${token}`;

  return new Promise((resolve) => {
    https.get(url, { timeout: 12000 }, (r) => {
      let body = "";
      r.on("data", (c) => (body += c));
      r.on("end", () => {
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Cache-Control", "no-store");
        res.status(200).send(body);
        resolve();
      });
    }).on("error", (e) => { res.status(502).json({ error: e.message }); resolve(); });
  });
};
