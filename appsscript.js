// ============================================================
//  CEC LEAD HUB — GOOGLE APPS SCRIPT
//  Paste this entire file into Google Apps Script and deploy
//  as a Web App (see instructions in the README).
// ============================================================

const SHEET_ID = "1PRXReoaS65P9QzwSNC_VW3U4DVu6xbG-QMCO5LOTuI0";
const COLUMNS  = ["Date","Lead Source","Clean Type","Name","Postcode","Contact Number","Email","Status","Chased Date","Notes","Quote"];

// ---- CORS helper ----
function buildResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ---- GET: read active leads ----
function doGet(e) {
  try {
    const ss    = SpreadsheetApp.openById(SHEET_ID);
    const sheet = getOrCreateMonthSheet(ss);
    const rows  = sheet.getDataRange().getValues();
    if (rows.length <= 1) return buildResponse({ leads: [] });

    const headers = rows[0];
    const leads   = rows.slice(1).map((row, i) => {
      const obj = {};
      headers.forEach((h, j) => obj[h] = row[j]);
      obj.__rowIndex = i + 2; // 1-based, skip header
      return obj;
    });
    return buildResponse({ leads });
  } catch(err) {
    return buildResponse({ error: err.message });
  }
}

// ---- POST: write a new lead ----
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);

    if (payload.action === "append") {
      const ss    = SpreadsheetApp.openById(SHEET_ID);
      const sheet = getOrCreateMonthSheet(ss);
      ensureHeaders(sheet);

      const row = COLUMNS.map(col => payload.data[col] || "");
      sheet.appendRow(row);
      return buildResponse({ success: true });
    }

    return buildResponse({ error: "Unknown action" });
  } catch(err) {
    return buildResponse({ error: err.message });
  }
}

// ---- Ensure the header row exists ----
function ensureHeaders(sheet) {
  const firstRow = sheet.getRange(1, 1, 1, COLUMNS.length).getValues()[0];
  const hasHeaders = firstRow.some(v => v !== "");
  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, COLUMNS.length).setValues([COLUMNS]);
    sheet.getRange(1, 1, 1, COLUMNS.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
}

// ---- Get or create the tab for the current month ----
function getOrCreateMonthSheet(ss) {
  const now       = new Date();
  const tabName   = Utilities.formatDate(now, Session.getScriptTimeZone(), "MMMM yyyy");
  let sheet       = ss.getSheetByName(tabName);

  if (!sheet) {
    sheet = ss.insertSheet(tabName);
    ensureHeaders(sheet);
  }
  return sheet;
}
