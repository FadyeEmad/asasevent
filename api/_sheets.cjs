const SLOT_VALUES = ["12-1", "1-2", "2-3", "3-4", "4-5", "5-6"];

async function callSheets(payload) {
  const url = process.env.GOOGLE_SCRIPT_URL;
  const secret = process.env.REGISTRATION_SECRET;
  if (!url || !secret) return { ok: false, code: "not_configured" };
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, secret }),
      signal: AbortSignal.timeout(45000)
    });
    if (!response.ok) return { ok: false, code: "sheets_unavailable" };
    const result = await response.json();
    return typeof result.ok === "boolean" ? result : { ok: false, code: "sheets_unavailable" };
  } catch (_) { return { ok: false, code: "sheets_unavailable" }; }
}

function reply(res, result, successStatus = 200) {
  res.setHeader("Cache-Control", "no-store");
  const status = result.ok ? successStatus :
    ["slot_full", "duplicate_phone"].includes(result.code) ? 409 :
    result.code === "invalid_data" ? 400 : 503;
  return res.status(status).json(result);
}

module.exports = { SLOT_VALUES, callSheets, reply };
