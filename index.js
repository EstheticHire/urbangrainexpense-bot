const express = require("express");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

    const messageType = data.messageType || "";
    const isText = messageType === "text";
    const isImage = messageType === "image";

    if (!isText && !isImage) {
      return res.status(200).json({ status: "ignored" });
    }

    const phone = data.author || (data.remoteJid || "").replace("@s.whatsapp.net", "");
    const name = data.pushName || data.chatName || "Labour";

    // For images, body contains the direct URL
    const message = isImage ? "" : (data.body || "");
    const imageUrl = isImage ? (data.body || "") : "";

    console.log("Phone:", phone, "Type:", messageType, "ImageUrl:", imageUrl, "Message:", message);

    if (!phone) return res.status(200).json({ status: "no phone" });

    const { handleIncoming } = require("./conversation");
    await handleIncoming({ phone, message, name, imageUrl, messageType });

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
