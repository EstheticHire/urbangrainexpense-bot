const axios = require("axios");

const LETSBOT_API_URL = "https://theurbangrain.letsbot.net/api/v1";
const LETSBOT_TOKEN = process.env.LETSBOT_TOKEN; // Set in Railway env vars
const LETSBOT_INSTANCE = process.env.LETSBOT_INSTANCE; // Your LetsBot instance ID

/**
 * Send a WhatsApp message via LetsBot API
 * @param {string} phone - Recipient phone number (international format, e.g. 971501234567)
 * @param {string} text - Message text (supports WhatsApp markdown: *bold*, _italic_)
 */
async function sendMessage(phone, text) {
  try {
    const response = await axios.post(
      `${LETSBOT_API_URL}/send-text`,
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
    console.error(
      `❌ Failed to send message to ${phone}:`,
      err.response?.data || err.message
    );
    throw err;
  }
}

module.exports = { sendMessage };
