const axios = require("axios");
const FormData = require("form-data");

const LETSBOT_TOKEN = process.env.LETSBOT_TOKEN;

async function sendMessage(phone, text) {
  try {
    const form = new FormData();
    form.append("phone", phone);
    form.append("body", text);

    const response = await axios.post(
      `https://theurbangrain.letsbot.net/api/v1/message/send`,
      form,
      {
        headers: {
          Authorization: `Bearer ${LETSBOT_TOKEN}`,
          ...form.getHeaders(),
        },
      }
    );
    console.log(`✅ Message sent to ${phone}:`, response.data);
    return response.data;
  } catch (err) {
    console.error(`❌ Send failed:`, err.response?.status, JSON.stringify(err.response?.data));
    throw err;
  }
}

module.exports = { sendMessage };
