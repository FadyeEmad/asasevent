const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const rows = [];
let locked = false;
let releases = 0;
const sheet = { getLastRow: () => rows.length + 1, getRange: () => ({ getDisplayValues: () => rows,
  setNumberFormat() { return this; }, setValues(values) { rows.push(values[0]); } }) };
const secret = 'test-secret';
const context = vm.createContext({
  SpreadsheetApp: { openById: () => ({ getSheetByName: () => sheet }), flush() {} },
  PropertiesService: { getScriptProperties: () => ({ getProperty: () => secret }) },
  LockService: { getScriptLock: () => ({ tryLock: () => !locked, releaseLock: () => releases++ }) },
  ContentService: { MimeType: { JSON: 'application/json' }, createTextOutput: text => ({ setMimeType: () => JSON.parse(text) }) }
});
vm.runInContext(fs.readFileSync(require.resolve('./google-sheets.gs'), 'utf8'), context);
const registration = { action: 'register', name: 'تسجيل اختبار', phone: '01000000000', unitType: 'residential', slot: '12-1' };
const run = data => context.doPost({ postData: { contents: JSON.stringify({ secret, ...data }) } });
async function verify() {
  assert.equal(run({ action: 'slots' }).counts['12-1'], 0);
  assert.equal(run({ ...registration, secret: 'wrong' }).code, 'not_authorized');
  assert.equal(rows.length, 0);
  assert.equal(run(registration).ok, true);
  assert.equal(rows[0][2], '01000000000');
  assert.equal(run(registration).code, 'duplicate_phone');
  assert.equal(run({ ...registration, slot: '1-2' }).code, 'duplicate_phone');
  for (let i = 1; i < 6; i++) assert.equal(run({ ...registration, phone: `0100000000${i}` }).ok, true);
  assert.equal(run({ ...registration, phone: '01000000006' }).code, 'slot_full');
  assert.equal(run({ ...registration, slot: 'other' }).code, 'invalid_data');
  assert.equal(run({ ...registration, phone: 'bad' }).code, 'invalid_data');
  assert.equal(run({ ...registration, phone: '01100000000', slot: '1-2', name: '=1+1' }).ok, true);
  assert.equal(rows[6][1], "'=1+1");
  assert.equal(run({ ...registration, phone: '01200000000', slot: '1-2', name: '' }).ok, true);
  assert.equal(rows[7][1], '');
  assert.equal(run({ ...registration, phone: '01200000000', slot: '3-4', name: '' }).code, 'duplicate_phone');
  locked = true;
  assert.equal(run({ ...registration, slot: '2-3' }).code, 'sheets_unavailable');
  locked = false;
  assert.ok(releases >= 9);
  const register = require('../api/register.js');
  const slots = require('../api/slots.js');
  const response = () => ({ setHeader() {}, status(s) { this.statusCode = s; return this; }, json(data) { this.data = data; return this; } });
  const originalFetch = global.fetch;
  delete process.env.GOOGLE_SCRIPT_URL; delete process.env.REGISTRATION_SECRET;
  let res = response(); await register({ method: 'POST', body: registration }, res);
  assert.equal(res.statusCode, 503); assert.equal(res.data.code, 'not_configured');
  res = response(); await register({ method: 'POST', body: { ...registration, phone: 'bad' } }, res);
  assert.equal(res.statusCode, 400);
  res = response(); await register({ method: 'GET' }, res); assert.equal(res.statusCode, 405);
  process.env.GOOGLE_SCRIPT_URL = 'https://example.invalid/test-only'; process.env.REGISTRATION_SECRET = secret;
  try {
    global.fetch = async (_, options) => ({ ok: true, json: async () => run(JSON.parse(options.body)) });
    res = response(); await slots({ method: 'GET' }, res); assert.equal(res.data['12-1'], 6);
    res = response(); await register({ method: 'POST', body: registration }, res); assert.equal(res.statusCode, 409);
    res = response(); await register({ method: 'POST', body: { ...registration, slot: '2-3' } }, res); assert.equal(res.statusCode, 409);
    res = response(); await register({ method: 'POST', body: { ...registration, name: '', phone: '01500000000', slot: '2-3' } }, res); assert.equal(res.statusCode, 201);
    global.fetch = async () => ({ ok: true, json: async () => ({ message: 'accepted' }) });
    res = response(); await register({ method: 'POST', body: registration }, res); assert.equal(res.statusCode, 503);
    global.fetch = async () => { throw new Error('network'); };
    res = response(); await register({ method: 'POST', body: registration }, res); assert.equal(res.statusCode, 503);
  } finally { global.fetch = originalFetch; delete process.env.GOOGLE_SCRIPT_URL; delete process.env.REGISTRATION_SECRET; }
  const html = fs.readFileSync(require.resolve('../index.html'), 'utf8');
  [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].forEach(match => new vm.Script(match[1]));
  console.log('PASS: Google Sheets auth, capacity, duplicates, locking, phone text, formula escaping, API failures, and browser syntax.');
}
verify().catch(error => { console.error(error); process.exitCode = 1; });
