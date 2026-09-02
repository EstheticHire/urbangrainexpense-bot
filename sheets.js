const { google } = require("googleapis");

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || "Expenses";

async function getClient() {
  const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_B64;
  const json = Buffer.from(b64, "base64").toString("utf8");
  const credentials = JSON.parse(json);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

async function ensureHeaders(sheets) {
  const headers = ["Ref", "Submitted At", "Phone", "Name", "Team", "Category", "Amount (AED)", "Description", "Receipt URL", "Status"];
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1:J1`,
  });
  if (!res.data.values || res.data.values.length === 0 || !res.data.values[0][0]) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [headers] },
    });
    console.log("✅ Headers written");
  }
}

async function appendExpense({ ref, name, phone, category, amount, date, description, receiptUrl, submittedAt }) {
  try {
    const sheets = await getClient();
    await ensureHeaders(sheets);

    const row = [ref, submittedAt, phone, name, "", category, amount, description, receiptUrl || "", "Pending"];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:J`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [row] },
    });

    console.log(`✅ Expense ${ref} logged`);
  } catch (err) {
    console.error("❌ Google Sheets error:", err.message);
    throw err;
  }
}

module.exports = { appendExpense };
