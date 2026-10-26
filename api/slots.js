const { SLOT_VALUES, callSheets, reply } = require("./_sheets.cjs");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, code: "method_not_allowed" });
  }
  const result = await callSheets({ action: "slots" });
  if (!result.ok) return reply(res, result);
  if (!result.counts || SLOT_VALUES.some(slot => !Number.isInteger(result.counts[slot]) || result.counts[slot] < 0)) {
    return reply(res, { ok: false, code: "sheets_unavailable" });
  }
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json(Object.fromEntries(SLOT_VALUES.map(slot => [slot, result.counts[slot]])));
};
