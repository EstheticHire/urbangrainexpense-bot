/**
 * Generate a unique expense reference ID
 * Format: EXP-YYYYMMDD-XXXX (e.g. EXP-20260902-A3F1)
 */
function generateRef() {
  const date = new Date();
  const datePart = date.toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `EXP-${datePart}-${randomPart}`;
}

module.exports = { generateRef };
