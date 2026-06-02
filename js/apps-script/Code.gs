const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID';
const SHEET_NAME = 'Valuations';
const ADMIN_PASSWORD = 'btdc@2026#';
const HEADERS = ['ValuationID','CustomerName','RefNumber','PropertyAddress','ValuationType','ValuationDate','ValuationAmount','Status','InitiatedBy','VerifiedBy','CreatedAt','UpdatedAt'];

function doGet(e) {
  try {
    if (!e || !e.parameter || !e.parameter.action) {
      return jsonResponse({ error: 'Missing action parameter' });
    }
    const action = e.parameter.action;
    if (action === 'getValuations') {
      if (e.parameter.password !== ADMIN_PASSWORD) return jsonResponse({ error: 'Unauthorized' });
      return jsonResponse(getAllValuations());
    }
    if (action === 'getValuation') {
      const q = (e.parameter.q || '').trim().toLowerCase();
      if (!q) return jsonResponse({ error: 'Search query required' });
      return jsonResponse(searchValuation(q));
    }
    if (action === 'getNextId') {
      if (e.parameter.password !== ADMIN_PASSWORD) return jsonResponse({ error: 'Unauthorized' });
      return jsonResponse({ nextId: getNextValuationId() });
    }
    if (action === 'verifyPassword') {
      return jsonResponse({ valid: e.parameter.password === ADMIN_PASSWORD });
    }
    return jsonResponse({ error: 'Unknown action' });
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

function doPost(e) {
  try {
    if (!e || !e.parameter || !e.parameter.action) {
      return jsonResponse({ error: 'Missing action parameter' });
    }
    if (e.parameter.password !== ADMIN_PASSWORD) {
      return jsonResponse({ error: 'Unauthorized' });
    }
    const action = e.parameter.action;
    if (action === 'addValuation') return jsonResponse(addValuation(e.parameter));
    if (action === 'updateValuation') return jsonResponse(updateValuation(e.parameter));
    if (action === 'deleteValuation') return jsonResponse(deleteValuation(e.parameter));
    return jsonResponse({ error: 'Unknown action' });
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

function getSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
  }
  return sheet;
}

function getAllValuations() {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return { valuations: [] };
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const obj = {};
    HEADERS.forEach((h, idx) => { obj[h] = row[idx] !== undefined ? String(row[idx]) : ''; });
    rows.push(obj);
  }
  return { valuations: rows };
}

function searchValuation(q) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return { valuations: [] };
  const results = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const matchFields = [String(row[0] || '').toLowerCase(), String(row[1] || '').toLowerCase(), String(row[2] || '').toLowerCase(), String(row[7] || '').toLowerCase()];
    if (matchFields.some(f => f.includes(q))) {
      const obj = {};
      HEADERS.forEach((h, idx) => { obj[h] = row[idx] !== undefined ? String(row[idx]) : ''; });
      results.push(obj);
    }
  }
  return { valuations: results };
}

function addValuation(params) {
  const sheet = getSheet();
  const now = new Date().toISOString();
  const row = [
    getNextValuationId(),
    params.CustomerName || '',
    params.RefNumber || '',
    params.PropertyAddress || '',
    params.ValuationType || '',
    params.ValuationDate || '',
    params.ValuationAmount || '',
    params.Status || 'Pending',
    params.InitiatedBy || '',
    params.VerifiedBy || '',
    now, now
  ];
  sheet.appendRow(row);
  return { success: true, message: 'Valuation added', id: row[0] };
}

function updateValuation(params) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  const targetId = params.ValuationID;
  if (!targetId) return { success: false, message: 'ValuationID required' };
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(targetId)) {
      const now = new Date().toISOString();
      const row = [
        targetId,
        params.CustomerName || data[i][1],
        params.RefNumber || data[i][2],
        params.PropertyAddress || data[i][3],
        params.ValuationType || data[i][4],
        params.ValuationDate || data[i][5],
        params.ValuationAmount || data[i][6],
        params.Status || data[i][7],
        params.InitiatedBy || data[i][8],
        params.VerifiedBy || data[i][9],
        data[i][10], now
      ];
      sheet.getRange(i + 1, 1, 1, row.length).setValues([row]);
      return { success: true, message: 'Valuation updated' };
    }
  }
  return { success: false, message: 'Valuation not found' };
}

function deleteValuation(params) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  const targetId = params.ValuationID;
  if (!targetId) return { success: false, message: 'ValuationID required' };
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(targetId)) {
      sheet.deleteRow(i + 1);
      return { success: true, message: 'Valuation deleted' };
    }
  }
  return { success: false, message: 'Valuation not found' };
}

function getNextValuationId() {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  let maxId = 0;
  for (let i = 1; i < data.length; i++) {
    const id = parseInt(data[i][0], 10);
    if (!isNaN(id) && id > maxId) maxId = id;
  }
  const next = maxId + 1;
  return String(next).padStart(4, '0');
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
