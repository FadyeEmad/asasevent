const { SLOT_VALUES, callSheets, reply } = require("./_sheets.cjs");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, code: "method_not_allowed" });
  }
  let body;
  try { body = typeof req.body === "string" ? JSON.parse(req.body) : req.body; }
  catch (_) { return reply(res, { ok: false, code: "invalid_data" }); }
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const phone = typeof body?.phone === "string" ? body.phone : "";
  const unitType = body?.unitType;
  const slot = body?.slot;
  if (name.length < 3 || name.length > 120 || !/^01[0125]\d{8}$/.test(phone) ||
      !["residential", "commercial"].includes(unitType) || !SLOT_VALUES.includes(slot)) {
    return reply(res, { ok: false, code: "invalid_data" });
  }
  return reply(res, await callSheets({ action: "register", name, phone, unitType, slot }), 201);
};
