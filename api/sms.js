const https = require("https");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  if (req.method !== "POST") { res.status(405).json({ error: "POST only" }); return; }

  const ACCOUNT_SID = process.env.TWILIO_SID;
  const AUTH_TOKEN  = process.env.TWILIO_TOKEN;
  const FROM_NUMBER = process.env.TWILIO_PHONE;

  if (!ACCOUNT_SID || !AUTH_TOKEN || !FROM_NUMBER) {
    res.status(500).json({ error: "Twilio not configured" }); return;
  }

  const { to, message } = req.body || {};
  if (!to || !message) { res.status(400).json({ error: "Missing to or message" }); return; }

  const body = new URLSearchParams({ To: to, From: FROM_NUMBER, Body: message }).toString();
  const auth = Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString("base64");
  const options = {
    hostname: "api.twilio.com",
    path: `/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`,
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(body),
    },
  };

  return new Promise((resolve) => {
    const request = https.request(options, (r) => {
      let data = "";
      r.on("data", (c) => (data += c));
      r.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          res.status(r.statusCode >= 200 && r.statusCode < 300 ? 200 : r.statusCode)
             .json(r.statusCode >= 200 && r.statusCode < 300 ? { success: true, sid: parsed.sid } : { error: parsed.message });
        } catch { res.status(500).json({ error: "Parse error" }); }
        resolve();
      });
    });
    request.on("error", (e) => { res.status(502).json({ error: e.message }); resolve(); });
    request.write(body);
    request.end();
  });
};
