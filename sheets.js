const { google } = require("googleapis");

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || "Sheet1";

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

async function appendExpense({ ref, name, phone, category, amount, date, description, submittedAt }) {
  try {
    const sheets = await getClient();

    // Match exact column order: ExenseID | SubmittedAt | WorkerPhone | WorkerName | Team | Project | Amount (AED) | Description | ReceiptURL | Status
    const row = [
      ref,          // ExenseID
      submittedAt,  // SubmittedAt
      phone,        // WorkerPhone
      name,         // WorkerName
      "",           // Team (blank for now)
      category,     // Project (using category)
      amount,       // Amount (AED)
      description,  // Description
      "",           // ReceiptURL (blank for now)
      "Pending",    // Status
    ];

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:J`,
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
