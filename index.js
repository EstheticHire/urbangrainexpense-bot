const express = require("express");

const app = express();
app.use(express.json());

app.post("/webhook", async (req, res) => {
  try {
    const body = req.body;
    console.log("Incoming webhook body field:", body.body);
    console.log("messageType:", body.messageType);
    console.log("fromMe:", body.fromMe);

    if (body.fromMe === true) {
      return res.status(200).json({ status: "ignored" });
    }

    if (!body.body || body.messageType !== "text") {
      return res.status(200).json({ status: "ignored non-text" });
    }

    const phone = body.author || (body.remoteJid || "").replace("@s.whatsapp.net", "");
    const message = body.body || "";
    const name = body.pushName || body.chatName || "Labour";

    console.log("Parsed - phone:", phone, "message:", message, "name:", name);

    const { handleIncoming } = require("./conversation");
    await handleIncoming({ phone, message, name });
    
    console.log("handleIncoming completed");
    res.status(200).json({ status: "ok" });
  } catch (err) {
    console.error("Webhook error:", err.message);
    console.error("Stack:", err.stack);
    res.status(500).json({ error: err.message });
  }
});

app.get("/", (req, res) => res.json({ status: "Expense Bot running ✅" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
