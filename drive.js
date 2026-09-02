const { google } = require("googleapis");
const { Readable } = require("stream");

const DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || "";

async function getClient() {
  const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_B64;
  const json = Buffer.from(b64, "base64").toString("utf8");
  const credentials = JSON.parse(json);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      "https://www.googleapis.com/auth/drive.file",
      "https://www.googleapis.com/auth/spreadsheets",
    ],
  });
  return google.drive({ version: "v3", auth });
}

async function uploadReceipt(buffer, contentType, filename) {
  try {
    const drive = await getClient();

    const fileMetadata = {
      name: filename,
      ...(DRIVE_FOLDER_ID ? { parents: [DRIVE_FOLDER_ID] } : {}),
    };

    const media = {
      mimeType: contentType,
      body: Readable.from(buffer),
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: "id, webViewLink",
    });

    // Make file publicly viewable
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: { role: "reader", type: "anyone" },
    });

    console.log("✅ Receipt uploaded to Drive:", response.data.webViewLink);
    return response.data.webViewLink;
  } catch (err) {
    console.error("❌ Drive upload failed:", err.message);
    return "";
  }
}

module.exports = { uploadReceipt };
