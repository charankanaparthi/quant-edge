const https = require("https");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  if (req.method !== "POST")    { res.status(405).json({ error: "POST only" }); return; }

  const SID   = process.env.TWILIO_SID;
  const TOKEN = process.env.TWILIO_TOKEN;
  const FROM  = process.env.TWILIO_PHONE;
  if (!SID || !TOKEN || !FROM) { res.status(500).json({ error: "SMS not configured" }); return; }

  const { to, message } = req.body || {};
  if (!to || !message) { res.status(400).json({ error: "Missing to or message" }); return; }

  const body = new URLSearchParams({ To: to, From: FROM, Body: message }).toString();
  const auth = Buffer.from(`${SID}:${TOKEN}`).toString("base64");

  const options = {
    hostname: "api.twilio.com",
    path:     `/2010-04-01/Accounts/${SID}/Messages.json`,
    method:   "POST",
    headers: {
      "Authorization":  `Basic ${auth}`,
      "Content-Type":   "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(body),
    },
  };

  return new Promise((resolve) => {
    const r2 = https.request(options, (r) => {
      let data = "";
      r.on("data", c => data += c);
      r.on("end", () => {
        try {
          const p = JSON.parse(data);
          res.status(r.statusCode < 300 ? 200 : r.statusCode)
             .json(r.statusCode < 300 ? { success: true, sid: p.sid } : { error: p.message });
        } catch { res.status(500).json({ error: "Parse error" }); }
        resolve();
      });
    });
    r2.on("error", e => { res.status(502).json({ error: e.message }); resolve(); });
    r2.write(body);
    r2.end();
  });
};
