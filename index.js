const express = require("express");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all env vars on startup to verify
console.log("ENV CHECK:");
console.log("LETSBOT_TOKEN:", process.env.LETSBOT_TOKEN ? "✅ set" : "❌ missing");
console.log("LETSBOT_INSTANCE:", process.env.LETSBOT_INSTANCE ? "✅ set" : "❌ missing");
console.log("GOOGLE_SHEET_ID:", process.env.GOOGLE_SHEET_ID ? "✅ set" : "❌ missing");
console.log("GOOGLE_SERVICE_ACCOUNT_B64:", process.env.GOOGLE_SERVICE_ACCOUNT_B64 ? "✅ set" : "❌ missing");
console.log("GOOGLE_SERVICE_ACCOUNT_JSON:", process.env.GOOGLE_SERVICE_ACCOUNT_JSON ? "✅ set" : "❌ missing");

app.post("/webhook", async (req, res) => {
  try {
    const event = req.body.event;
    const data = req.body.data || {};

    if (event !== "message_notification") {
      return res.status(200).json({ status: "ignored" });
    }
    if (data.fromMe === true) {
      return res.status(200).json({ status: "ignored fromMe" });
    }
    if (!data.body || data.messageType !== "text") {
      return res.status(200).json({ status: "ignored non-text" });
    }

    const phone = data.author || (data.remoteJid || "").replace("@s.whatsapp.net", "");
    const message = data.body;
    const name = data.pushName || data.chatName || "Labour";

    console.log("Phone:", phone, "Message:", message, "Name:", name);

    const { handleIncoming } = require("./conversation");
    await handleIncoming({ phone, message, name });

    console.log("Done ✅");
    res.status(200).json({ status: "ok" });
  } catch (err) {
    console.error("Error:", err.message);
    console.error("Stack:", err.stack);
    res.status(500).json({ error: err.message });
  }
});

app.get("/", (req, res) => res.json({ status: "Expense Bot running ✅" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
