const { google } = require("googleapis");

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID; // From your Google Sheet URL
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || "Expenses"; // Tab name

/**
 * Get authenticated Google Sheets client using Service Account
 */
async function getClient() {
  // Credentials stored as a JSON string in environment variable
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

/**
 * Ensure the header row exists in the sheet
 */
async function ensureHeaders(sheets) {
  const headers = [
    "Ref",
    "Name",
    "Phone",
    "Category",
    "Amount (AED)",
    "Date",
    "Description",
    "Submitted At",
  ];

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1:H1`,
    });

    // If row 1 is empty, write headers
    if (!res.data.values || res.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A1`,
        valueInputOption: "RAW",
        requestBody: { values: [headers] },
      });
      console.log("✅ Headers written to sheet");
    }
  } catch (err) {
    console.error("Error checking headers:", err.message);
  }
}

/**
 * Append an expense row to Google Sheets
 */
async function appendExpense({
  ref,
  name,
  phone,
  category,
  amount,
  date,
  description,
  submittedAt,
}) {
  try {
    const sheets = await getClient();
    await ensureHeaders(sheets);

    const row = [
      ref,
      name,
      phone,
      category,
      amount,
      date,
      description,
      submittedAt,
    ];

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
