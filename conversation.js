const { sendMessage } = require("./letsbot");
const { appendExpense } = require("./sheets");
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

  amount: () =>
    `💰 *Step 2 of 5 — Amount*\nHow much did you spend? (in AED)\n\nExample: _120_ or _85.50_`,

  date: () =>
    `📅 *Step 3 of 5 — Date*\nWhat date was this expense?\n\nReply with:\n• *today*\n• *yesterday*\n• Or a date like _02-Sep_ or _02/09/2026_`,

  description: () =>
    `📝 *Step 4 of 5 — Description*\nAdd a short note about this expense.\n\nExample: _Petrol for site visit to Al Quoz_`,

  receipt: () =>
    `📎 *Step 5 of 5 — Receipt*\nPlease send a photo or PDF of your receipt.\n\nOr type *skip* to submit without a receipt.`,

  confirm: (s) =>
    `✅ *Please confirm your expense:*\n\n📂 Category: ${s.category}\n💰 Amount: AED ${s.amount}\n📅 Date: ${s.date}\n📝 Note: ${s.description}\n🧾 Receipt: ${s.receiptUrl ? "Attached ✅" : "None"}\n\nReply *YES* to submit or *NO* to start over.`,

  success: (ref) =>
    `🎉 *Expense logged successfully!*\n\n🔖 Reference: *${ref}*\n\nYour expense has been recorded. Thank you!`,

  cancelled: () =>
    `❌ Expense cancelled. Send any message to start a new one.`,

  invalid_amount: () =>
    `⚠️ That doesn't look like a valid amount. Please enter a number.\n\nExample: _120_ or _85.50_`,

  invalid_category: () =>
    `⚠️ Please reply with a number (1–7) or the category name.`,
};

function parseDate(input) {
  const lower = input.trim().toLowerCase();
  const today = new Date();
  if (lower === "today") {
    return today.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  }
  if (lower === "yesterday") {
    const y = new Date(today);
    y.setDate(y.getDate() - 1);
    return y.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  }
  const parsed = new Date(input.replace(/-/g, " "));
  if (!isNaN(parsed)) {
    return parsed.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  }
  return input.trim();
}

function parseCategory(input) {
  const num = parseInt(input.trim());
  if (num >= 1 && num <= CATEGORIES.length) return CATEGORIES[num - 1];
  const lower = input.toLowerCase();
  return CATEGORIES.find((c) => c.toLowerCase().includes(lower)) || null;
}

async function handleIncoming({ phone, message, name, mediaUrl, messageType }) {
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
      } else if (mediaUrl) {
        session.receiptUrl = mediaUrl;
      } else if (lower !== "") {
        // They typed something instead of sending a photo
        await sendMessage(phone, `⚠️ Please send a photo/PDF of your receipt, or type *skip* to continue without one.`);
        return;
      }
      session.step = "confirm";
      await sendMessage(phone, PROMPTS.confirm(session));
      break;
    }

    case "confirm": {
      if (lower === "yes" || lower === "y") {
        const ref = generateRef();
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
