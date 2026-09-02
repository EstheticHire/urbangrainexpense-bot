const express = require("express");
const { handleIncoming } = require("./conversation");

const app = express();
app.use(express.json());

app.post("/webhook", async (req, res) => {
  try {
    const body = req.body;
    console.log("Incoming webhook:", JSON.stringify(body, null, 2));

    // Ignore messages sent by the bot itself
    if (body.fromMe === true) {
      return res.status(200).json({ status: "ignored" });
    }

    // Ignore non-message events (ack, contact, delivery receipts)
    if (!body.body || body.messageType !== "text") {
      return res.status(200).json({ status: "ignored" });
    }

    // LetsBot actual payload fields
    const phone = body.author || (body.remoteJid || "").replace("@s.whatsapp.net", "");
    const message = body.body || "";
    const name = body.pushName || body.chatName || "Labour";

    if (!phone) {
      return res.status(200).json({ status: "no phone, ignored" });
    }

    await handleIncoming({ phone, message, name });
    res.status(200).json({ status: "ok" });
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/", (req, res) => res.json({ status: "Expense Bot running ✅" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
