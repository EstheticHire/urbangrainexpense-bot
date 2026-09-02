const axios = require("axios");

const LETSBOT_TOKEN = process.env.LETSBOT_TOKEN;
const LETSBOT_INSTANCE = process.env.LETSBOT_INSTANCE;
const BASE_URL = "https://theurbangrain.letsbot.net";

async function sendMessage(phone, text) {
  try {
    // Try the v2 API endpoint
    const response = await axios.post(
      `${BASE_URL}/api/v2/send-text`,
      {
        instance: LETSBOT_INSTANCE,
        phone: phone,
        message: text,
      },
      {
        headers: {
          Authorization: `Bearer ${LETSBOT_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log(`✅ Message sent to ${phone}:`, response.data);
    return response.data;
  } catch (err) {
    console.error(`❌ Failed to send message to ${phone}:`, err.response?.data || err.message);
    throw err;
  }
}

module.exports = { sendMessage };
