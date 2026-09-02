const { google } = require("googleapis");
const { Readable } = require("stream");

const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || "";

async function getClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    "http://localhost:3000/callback"
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN,
  });

  return google.drive({ version: "v3", auth: oauth2Client });
}

async function uploadReceipt(buffer, contentType, filename) {
  try {
    const drive = await getClient();

    const response = await drive.files.create({
      requestBody: {
        name: filename,
        parents: FOLDER_ID ? [FOLDER_ID] : [],
      },
      media: {
        mimeType: contentType,
        body: Readable.from(buffer),
      },
      fields: "id, webViewLink",
    });

    // Make publicly viewable so link works in sheet
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
