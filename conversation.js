const { sendMessage } = require("./letsbot");
const { appendExpense } = require("./sheets");
const { generateRef } = require("./utils");

// In-memory session store (persists while server is running)
// For production, swap with Redis or a simple JSON file
const sessions = {};

const STEPS = ["category", "amount", "date", "description", "confirm"];

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
    `👋 Hi ${name}! Welcome to the Expense Bot.\n\nLet's log your expense. You can type *cancel* at any time to start over.\n\n📂 *Step 1 of 4 — Category*\nWhat type of expense is this?\n\n${CATEGORIES.map((c, i) => `${i + 1}. ${c}`).join("\n")}\n\nReply with the number or name.`,

  amount: () =>
    `💰 *Step 2 of 4 — Amount*\nHow much did you spend? (in AED)\n\nExample: _120_ or _85.50_`,

  date: () =>
    `📅 *Step 3 of 4 — Date*\nWhat date was this expense?\n\nReply with:\n• *today*\n• *yesterday*\n• Or a date like _02-Sep_ or _02/09/2026_`,

  description: () =>
    `📝 *Step 4 of 4 — Description*\nAdd a short note about this expense.\n\nExample: _Petrol for site visit to Al Quoz_`,

  confirm: (s) =>
    `✅ *Please confirm your expense:*\n\n📂 Category: ${s.category}\n💰 Amount: AED ${s.amount}\n📅 Date: ${s.date}\n📝 Note: ${s.description}\n\nReply *YES* to submit or *NO* to start over.`,

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
    return today.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }
  if (lower === "yesterday") {
    const y = new Date(today);
    y.setDate(y.getDate() - 1);
    return y.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  // Try parsing various formats
  const parsed = new Date(input.replace(/-/g, " "));
  if (!isNaN(parsed)) {
    return parsed.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  // Return as-is if can't parse
  return input.trim();
}

function parseCategory(input) {
  const num = parseInt(input.trim());
  if (num >= 1 && num <= CATEGORIES.length) {
    return CATEGORIES[num - 1];
  }
  // Try fuzzy match
  const lower = input.toLowerCase();
  const match = CATEGORIES.find((c) => c.toLowerCase().includes(lower));
  return match || null;
}

async function handleIncoming({ phone, message, name }) {
  const text = message.trim();
  const lower = text.toLowerCase();

  // Cancel anytime
  if (lower === "cancel") {
    delete sessions[phone];
    await sendMessage(phone, PROMPTS.cancelled());
    return;
  }

  // No active session — start fresh
  if (!sessions[phone]) {
    sessions[phone] = { step: "category", name };
    await sendMessage(phone, PROMPTS.start(name));
    return;
  }

  const session = sessions[phone];

  switch (session.step) {
    case "category": {
      const cat = parseCategory(text);
      if (!cat) {
        await sendMessage(phone, PROMPTS.invalid_category());
        return;
      }
      session.category = cat;
      session.step = "amount";
      await sendMessage(phone, PROMPTS.amount());
      break;
    }

    case "amount": {
      const amt = parseFloat(text.replace(/[^0-9.]/g, ""));
      if (isNaN(amt) || amt <= 0) {
        await sendMessage(phone, PROMPTS.invalid_amount());
        return;
      }
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
