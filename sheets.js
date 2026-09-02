const { google } = require("googleapis");

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || "Expenses";

async function getClient() {
  let credentials;
  try {
    // Decode from base64 to avoid JSON formatting issues in env vars
    const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_B64;
    const json = Buffer.from(b64, "base64").toString("utf8");
    credentials = JSON.parse(json);
  } catch (err) {
    console.error("Failed to parse service account:", err.message);
    throw err;
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

async function ensureHeaders(sheets) {
  const headers = ["Ref", "Name", "Phone", "Category", "Amount (AED)", "Date", "Description", "Submitted At"];
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1:H1`,
    });
    if (!res.data.values || res.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A1`,
        valueInputOption: "RAW",
        requestBody: { values: [headers] },
      });
    }
  } catch (err) {
    console.error("Error checking headers:", err.message);
  }
}

async function appendExpense({ ref, name, phone, category, amount, date, description, submittedAt }) {
  try {
    const sheets = await getClient();
    await ensureHeaders(sheets);

    const row = [ref, name, phone, category, amount, date, description, submittedAt];

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:H`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [row] },
    });

    console.log(`✅ Expense ${ref} logged to Google Sheets`);
    return response.data;
  } catch (err) {
    console.error("❌ Google Sheets error:", err.message);
    throw err;
  }
}

module.exports = { appendExpense };
