const express = require("express");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/webhook", async (req, res) => {
  try {
    // Log everything to see what LetsBot is actually sending
    console.log("Headers:", JSON.stringify(req.headers));
    console.log("Body:", JSON.stringify(req.body));
    console.log("Query:", JSON.stringify(req.query));

    const data = req.body;

    if (data.fromMe === true || data.fromMe === "true") {
      return res.status(200).json({ status: "ignored" });
    }

    const messageText = data.body || data.message || data.text || "";
    const messageType = data.messageType || data.type || "";

    if (!messageText) {
      return res.status(200).json({ status: "ignored no text" });
    }

    const phone = data.author || (data.remoteJid || "").replace("@s.whatsapp.net", "");
    const name = data.pushName || data.chatName || "Labour";

    console.log("Phone:", phone, "Message:", messageText, "Name:", name);

    if (!phone) {
      return res.status(200).json({ status: "no phone" });
    }

    const { handleIncoming } = require("./conversation");
    await handleIncoming({ phone, message: messageText, name });

    console.log("Done");
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
