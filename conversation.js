const { sendMessage, downloadMedia } = require("./letsbot");
const { appendExpense } = require("./sheets");
const { uploadReceipt } = require("./drive");
const { generateRef } = require("./utils");

const sessions = {};

const CATEGORIES = [
  "Petrol / Transport",
  "Food / Meals",
  "Tools / Materials",
  "Accommodation",
  "Medical",
  "Communication",
  "Other",
];

const PROMPTS = {
  start: (name) =>
    `👋 Hi ${name}! Welcome to the Expense Bot.\n\nLet's log your expense. Type *cancel* anytime to start over.\n\n📂 *Step 1 of 5 — Category*\nWhat type of expense is this?\n\n${CATEGORIES.map((c, i) => `${i + 1}. ${c}`).join("\n")}\n\nReply with the number or name.`,
  amount: () => `💰 *Step 2 of 5 — Amount*\nHow much did you spend? (in AED)\n\nExample: _120_ or _85.50_`,
  date: () => `📅 *Step 3 of 5 — Date*\nWhat date was this expense?\n\nReply:\n• *today*\n• *yesterday*\n• Or _02-Sep_`,
  description: () => `📝 *Step 4 of 5 — Description*\nAdd a short note.\n\nExample: _Petrol for site visit to Al Quoz_`,
  receipt: () => `📎 *Step 5 of 5 — Receipt*\nPlease send a *photo* of your receipt.\n\nOr type *skip* to submit without one.`,
  confirm: (s) =>
    `✅ *Please confirm:*\n\n📂 Category: ${s.category}\n💰 Amount: AED ${s.amount}\n📅 Date: ${s.date}\n📝 Note: ${s.description}\n🧾 Receipt: ${s.receiptUrl ? "Attached ✅" : "Not provided"}\n\nReply *YES* to submit or *NO* to cancel.`,
  success: (ref) => `🎉 *Expense logged!*\n\n🔖 Reference: *${ref}*\n\nThank you!`,
  cancelled: () => `❌ Cancelled. Send any message to start over.`,
  invalid_amount: () => `⚠️ Please enter a valid amount. Example: _120_`,
  invalid_category: () => `⚠️ Please reply with a number (1–7) or category name.`,
};

function parseDate(input) {
  const lower = input.trim().toLowerCase();
  const today = new Date();
  if (lower === "today") return today.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  if (lower === "yesterday") {
    const y = new Date(today);
    y.setDate(y.getDate() - 1);
    return y.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  }
  const parsed = new Date(input.replace(/-/g, " "));
  if (!isNaN(parsed)) return parsed.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  return input.trim();
}

function parseCategory(input) {
  const num = parseInt(input.trim());
  if (num >= 1 && num <= CATEGORIES.length) return CATEGORIES[num - 1];
  const lower = input.toLowerCase();
  return CATEGORIES.find((c) => c.toLowerCase().includes(lower)) || null;
}

async function handleIncoming({ phone, message, name, imageUrl, messageType }) {
  const text = (message || "").trim();
  const lower = text.toLowerCase();

  if (lower === "cancel") {
    delete sessions[phone];
    await sendMessage(phone, PROMPTS.cancelled());
    return;
  }

  if (!sessions[phone]) {
    sessions[phone] = { step: "category", name };
    await sendMessage(phone, PROMPTS.start(name));
    return;
  }

  const session = sessions[phone];

  switch (session.step) {
    case "category": {
      const cat = parseCategory(text);
      if (!cat) { await sendMessage(phone, PROMPTS.invalid_category()); return; }
      session.category = cat;
      session.step = "amount";
      await sendMessage(phone, PROMPTS.amount());
      break;
    }
    case "amount": {
      const amt = parseFloat(text.replace(/[^0-9.]/g, ""));
      if (isNaN(amt) || amt <= 0) { await sendMessage(phone, PROMPTS.invalid_amount()); return; }
      session.amount = amt.toFixed(2);
      session.step = "date";
      await sendMessage(phone, PROMPTS.date());
      break;
    }
    case "date": {
      session.date = parseDate(text);
      session.step = "description";
      await sendMessage(phone, PROMPTS.description());
      break;
    }
    case "description": {
      session.description = text;
      session.receiptUrl = "";
      session.step = "receipt";
      await sendMessage(phone, PROMPTS.receipt());
      break;
    }
    case "receipt": {
      if (lower === "skip") {
        session.receiptUrl = "";
        session.step = "confirm";
        await sendMessage(phone, PROMPTS.confirm(session));
      } else if (messageType === "image" && imageUrl) {
        await sendMessage(phone, "⏳ Uploading your receipt...");
        const ref = session.ref || generateRef();
        session.ref = ref;
        const media = await downloadMedia(imageUrl);
        if (media) {
          const driveUrl = await uploadReceipt(media.buffer, media.contentType, `receipt-${ref}.jpg`);
          session.receiptUrl = driveUrl;
        }
        session.step = "confirm";
        await sendMessage(phone, PROMPTS.confirm(session));
      } else {
        await sendMessage(phone, `⚠️ Please send a *photo* of your receipt, or type *skip*.`);
      }
      break;
    }
    case "confirm": {
      if (lower === "yes" || lower === "y") {
        const ref = session.ref || generateRef();
        await appendExpense({
          ref,
          name: session.name,
          phone,
          category: session.category,
          amount: session.amount,
          date: session.date,
          description: session.description,
          receiptUrl: session.receiptUrl || "",
          submittedAt: new Date().toISOString(),
        });
        delete sessions[phone];
        await sendMessage(phone, PROMPTS.success(ref));
      } else {
        delete sessions[phone];
        await sendMessage(phone, PROMPTS.cancelled());
      }
      break;
    }
    default: {
      delete sessions[phone];
      sessions[phone] = { step: "category", name };
      await sendMessage(phone, PROMPTS.start(name));
    }
  }
}

module.exports = { handleIncoming };
