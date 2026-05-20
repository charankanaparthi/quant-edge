const https = require("https");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }

  const { fn, symbol } = req.query;
  const AV_KEY = process.env.AV_KEY || "01LCKZM4PISNMXHV";

  let url = "";
  if (fn === "TOP_GAINERS_LOSERS") {
    url = `https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&apikey=${AV_KEY}`;
  } else if (fn === "GLOBAL_QUOTE" && symbol) {
    url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${AV_KEY}`;
  } else if (fn === "NEWS") {
    url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&limit=20&apikey=${AV_KEY}`;
  } else {
    res.status(400).json({ error: "Invalid function" }); return;
  }

  return new Promise((resolve) => {
    https.get(url, { timeout: 15000 }, (r) => {
      let body = "";
      r.on("data", (c) => (body += c));
      r.on("end", () => {
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Cache-Control", "no-store");
        res.status(200).send(body);
        resolve();
      });
    }).on("error", (e) => {
      res.status(502).json({ error: e.message });
      resolve();
    });
  });
};
