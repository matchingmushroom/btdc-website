const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID';
const CONTACT_SHEET = 'Contact';
const VALUATION_SHEET = 'Valuations';

function doGet(e) {
  return handleCors(e);
}

function doPost(e) {
  return handleCors(e);
}

function handleCors(e) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  if (e && e.parameter && e.parameter.action === 'contact') {
    return handleContact(e, headers);
  }
  if (e && e.parameter && e.parameter.action === 'valuation') {
    return handleValuation(e, headers);
  }
  return ContentService.createTextOutput(JSON.stringify({ error: 'Invalid action' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleContact(e, headers) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(CONTACT_SHEET) || ss.insertSheet(CONTACT_SHEET);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Timestamp', 'Name', 'Email', 'Phone', 'Message']);
    }
    sheet.appendRow([
      new Date(),
      e.parameter.name || '',
      e.parameter.email || '',
      e.parameter.phone || '',
      e.parameter.message || ''
    ]);
    return buildResponse({ success: true, message: 'Thank you! We will contact you soon.' }, headers);
  } catch (err) {
    return buildResponse({ success: false, message: 'Error: ' + err.message }, headers);
  }
}

function handleValuation(e, headers) {
  try {
    const propertyType = e.parameter.propertyType || '';
    const location = e.parameter.location || '';
    const landArea = parseFloat(e.parameter.landArea) || 0;
    const builtUpArea = parseFloat(e.parameter.builtUpArea) || 0;
    const condition = e.parameter.condition || 'average';
    const name = e.parameter.name || '';
    const email = e.parameter.email || '';
    const phone = e.parameter.phone || '';

    const baseRates = {
      residential: 5000,
      commercial: 8000,
      industrial: 6000,
      land: 3000,
      agricultural: 2000
    };
    const conditionFactors = { poor: 0.7, average: 1.0, good: 1.2, excellent: 1.4 };
    const locationFactors = { urban: 1.5, suburban: 1.0, rural: 0.7 };

    const baseRate = baseRates[propertyType] || 5000;
    const condFactor = conditionFactors[condition] || 1.0;
    const locFactor = locationFactors[location] || 1.0;

    const estimatedValue = (landArea * baseRate * locFactor * condFactor) + (builtUpArea * baseRate * 1.5 * condFactor);
    const rangeLow = Math.round(estimatedValue * 0.9);
    const rangeHigh = Math.round(estimatedValue * 1.1);

    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(VALUATION_SHEET) || ss.insertSheet(VALUATION_SHEET);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Timestamp', 'Name', 'Email', 'Phone', 'PropertyType', 'Location', 'LandArea(sqft)', 'BuiltUpArea(sqft)', 'Condition', 'EstimateLow', 'EstimateHigh']);
    }
    sheet.appendRow([new Date(), name, email, phone, propertyType, location, landArea, builtUpArea, condition, rangeLow, rangeHigh]);

    return buildResponse({
      success: true,
      estimate: { low: rangeLow, high: rangeHigh, currency: 'NPR' },
      propertyType, location, landArea, builtUpArea, condition
    }, headers);
  } catch (err) {
    return buildResponse({ success: false, message: 'Error: ' + err.message }, headers);
  }
}

function buildResponse(data, headers) {
  const output = ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}
