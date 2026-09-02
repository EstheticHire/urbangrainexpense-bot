const axios = require("axios");
const FormData = require("form-data");

// Upload to Imgur - free, permanent, no auth needed for anonymous uploads
async function uploadReceipt(buffer, contentType, filename) {
  try {
    const form = new FormData();
    form.append("image", buffer.toString("base64"));
    form.append("type", "base64");
    form.append("name", filename);

    const response = await axios.post("https://api.imgur.com/3/image", form, {
      headers: {
        Authorization: "Client-ID 546c25a59c58ad7", // Imgur public client ID
        ...form.getHeaders(),
      },
    });

    const url = response.data?.data?.link || "";
    console.log("✅ Receipt uploaded to Imgur:", url);
    return url;
  } catch (err) {
    console.error("❌ Imgur upload failed:", err.response?.data || err.message);
    return "";
  }
}

module.exports = { uploadReceipt };
