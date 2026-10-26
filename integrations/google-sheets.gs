const SPREADSHEET_ID = '1cXvtHo0-Ao0btfnmas0cW0_7rcOXvqbV2T9FBdQF2KI';
const SHEET_NAME = 'تسجيلات الفعالية';
const SLOTS = ['12-1', '1-2', '2-3', '3-4', '4-5', '5-6'];
const LABELS = ['12 – 1 ظهراً', '1 – 2 ظهراً', '2 – 3 عصراً', '3 – 4 عصراً', '4 – 5 مساءً', '5 – 6 مساءً'];

function setup() {
  const book = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = book.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = book.insertSheet(SHEET_NAME);
  if (!sheet.getLastRow()) {
    sheet.getRange(1, 1, 1, 6).setValues([['وقت التسجيل', 'الاسم', 'الموبايل', 'نوع الوحدة', 'كود الموعد', 'الموعد']]);
    sheet.setRightToLeft(true);
    sheet.setFrozenRows(1);
    sheet.getRange('A1:F1').setBackground('#16306E').setFontColor('#FFFFFF').setFontWeight('bold');
    sheet.setColumnWidth(1, 170);
    sheet.setColumnWidth(2, 200);
    sheet.setColumnWidths(3, 4, 140);
    sheet.getRange('A2:A').setNumberFormat('yyyy-mm-dd hh:mm:ss');
    sheet.getRange('B2:F').setNumberFormat('@');
    sheet.getRange('A1:F1').createFilter();
  }
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('REGISTRATION_SECRET')) props.setProperty('REGISTRATION_SECRET', Utilities.getUuid() + Utilities.getUuid());
  return sheet;
}

function doGet() {
  return json_({ ok: true, counts: counts_(rows_()) });
}

function doPost(e) {
  let data;
  try { data = JSON.parse(e.postData.contents); }
  catch (_) { return json_({ ok: false, code: 'invalid_data' }); }
  if (!data || typeof data !== 'object') return json_({ ok: false, code: 'invalid_data' });
  if (data.action === 'slots') return doGet();
  const secret = PropertiesService.getScriptProperties().getProperty('REGISTRATION_SECRET');
  if (!secret || data.secret !== secret) return json_({ ok: false, code: 'not_authorized' });
  const name = typeof data.name === 'string' ? data.name.trim() : '';
  if (data.action !== 'register' || name.length < 3 || name.length > 120 ||
      !/^01[0125]\d{8}$/.test(data.phone || '') || !SLOTS.includes(data.slot) ||
      !['residential', 'commercial'].includes(data.unitType)) return json_({ ok: false, code: 'invalid_data' });
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return json_({ ok: false, code: 'sheets_unavailable' });
  try {
    const rows = rows_();
    if (rows.some(row => row[2] === data.phone && row[4] === data.slot)) return json_({ ok: false, code: 'duplicate_phone' });
    if (counts_(rows)[data.slot] >= 6) return json_({ ok: false, code: 'slot_full' });
    const sheet = setup();
    const row = sheet.getLastRow() + 1;
    const safeName = /^[=+\-@]/.test(name) ? "'" + name : name;
    sheet.getRange(row, 2, 1, 5).setNumberFormat('@');
    sheet.getRange(row, 1, 1, 6).setValues([[new Date(), safeName, data.phone,
      data.unitType === 'residential' ? 'سكني' : 'تجاري', data.slot, LABELS[SLOTS.indexOf(data.slot)]]]);
    SpreadsheetApp.flush();
    return json_({ ok: true });
  } finally { lock.releaseLock(); }
}

function rows_() {
  const sheet = setup();
  return sheet.getLastRow() < 2 ? [] : sheet.getRange(2, 1, sheet.getLastRow() - 1, 6).getDisplayValues();
}

function counts_(rows) {
  const counts = {};
  SLOTS.forEach(slot => { counts[slot] = rows.filter(row => row[4] === slot).length; });
  return counts;
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
