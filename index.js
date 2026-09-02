const express = require("express");
const { handleIncoming } = require("./conversation");

const app = express();
app.use(express.json());

// LetsBot sends incoming messages here
app.post("/webhook", async (req, res) => {
  try {
    const body = req.body;
    console.log("Incoming webhook:", JSON.stringify(body, null, 2));

    // LetsBot webhook payload structure
    const phone = body.phone || body.from || body.contact?.phone;
    const message = body.message || body.text || body.body || "";
    const name = body.contact?.name || body.name || "Labour";

    if (!phone) {
      return res.status(400).json({ error: "No phone number found" });
    }

    await handleIncoming({ phone, message, name });
    res.status(200).json({ status: "ok" });
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get("/", (req, res) => res.json({ status: "Expense Bot running ✅" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
