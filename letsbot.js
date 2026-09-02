const axios = require("axios");
const FormData = require("form-data");

const LETSBOT_TOKEN = process.env.LETSBOT_TOKEN;
const BASE_URL = "https://theurbangrain.letsbot.net";

async function sendMessage(phone, text) {
  try {
    const form = new FormData();
    form.append("phone", phone);
    form.append("body", text);
    const response = await axios.post(`${BASE_URL}/api/v1/message/send`, form, {
      headers: { Authorization: `Bearer ${LETSBOT_TOKEN}`, ...form.getHeaders() },
    });
    console.log(`✅ Message sent to ${phone}`);
    return response.data;
  } catch (err) {
    console.error(`❌ Send failed:`, err.response?.status, JSON.stringify(err.response?.data));
    throw err;
  }
}

async function getMediaUrl(mediaId) {
  try {
    const response = await axios.get(`${BASE_URL}/api/v1/media/${mediaId}`, {
      headers: { Authorization: `Bearer ${LETSBOT_TOKEN}` },
    });
    console.log("Media response:", JSON.stringify(response.data));
    const url = response.data?.url || response.data?.mediaUrl || response.data?.link || response.data?.fileUrl || "";
    console.log("✅ Media URL:", url);
    return url;
  } catch (err) {
    console.error(`❌ Media fetch failed:`, err.response?.status, JSON.stringify(err.response?.data));
    return "";
  }
}

async function downloadMedia(mediaUrl) {
  try {
    const response = await axios.get(mediaUrl, { responseType: "arraybuffer" });
    return {
      buffer: Buffer.from(response.data),
      contentType: response.headers["content-type"] || "image/jpeg",
    };
  } catch (err) {
    console.error("❌ Media download failed:", err.message);
    return null;
  }
}

module.exports = { sendMessage, getMediaUrl, downloadMedia };
