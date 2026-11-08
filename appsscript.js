// ============================================================
//  CEC LEAD HUB — GOOGLE APPS SCRIPT
//  Paste this entire file into Google Apps Script and deploy
//  as a Web App (see instructions in the README).
//
//  SECURITY: this script refuses every request that doesn't
//  carry the right key. Keys live in Project Settings >
//  Script properties, NEVER in this file or on GitHub:
//    APP_KEY        - typed into the Lead Hub once per device
//    WEBHOOK_TOKEN  - part of the webhook URLs given to Kapso
//                     (WhatsApp) and Zernio (Messenger)
// ============================================================

const SHEET_ID = "1_AxunlP0AUEa0pzAK-8Pq7WFp1ZGy1lWh18m72Dba3E";
const COLUMNS  = ["Date","Lead Source","Clean Type","Name","Postcode","Contact Number","Email","Status","Chased Date","Notes","Quote"];

// Every WhatsApp / Messenger message is logged here. Deliberately has
// no "Name" column, so the Lead Hub never mistakes it for a lead tab.
const MESSAGES_TAB  = "Messages";
const MESSAGE_COLS  = ["Received","Channel","Direction","Contact","Contact ID","Phone","Message","Message ID","Conversation ID"];

// A message from someone we haven't heard from in this many days
// becomes a new lead row.
const NEW_LEAD_AFTER_DAYS = 60;
const NEW_LEAD_STATUS     = "New";

// ---- Response helper (JSON, or JSONP when a callback is given) ----
function buildResponse(data, callback) {
  const json = JSON.stringify(data);
  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + json + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

// ---- Key checks ----
function getProp(name) {
  return PropertiesService.getScriptProperties().getProperty(name) || "";
}
function keyMatches(given, propName) {
  const expected = getProp(propName);
  return expected !== "" && String(given || "") === expected;
}
const UNAUTHORISED = { error: "Unauthorised" };

// ---- GET: read leads OR update a status (Lead Hub, via JSONP) ----
function doGet(e) {
  const p        = e.parameter || {};
  const callback = /^[A-Za-z0-9_]+$/.test(p.callback || "") ? p.callback : null;
  if (!keyMatches(p.key, "APP_KEY")) return buildResponse(UNAUTHORISED, callback);

  if (p.action === 'updateStatus') {
    try {
      const ss        = SpreadsheetApp.openById(SHEET_ID);
      const sheet     = ss.getSheetByName(p.sheet);
      if (!sheet) throw new Error('Sheet not found: ' + p.sheet);
      const row       = parseInt(p.row, 10);
      const headers   = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      const statusCol = headers.indexOf('Status') + 1;
      if (statusCol === 0) throw new Error('Status column not found');
      sheet.getRange(row, statusCol).setValue(p.status);
      return buildResponse({ success: true }, callback);
    } catch(err) {
      return buildResponse({ error: err.message }, callback);
    }
  }

  // Default: return all leads
  try {
    const ss     = SpreadsheetApp.openById(SHEET_ID);
    let allLeads = [];

    ss.getSheets().forEach(function(sheet) {
      const rows = sheet.getDataRange().getValues();
      if (rows.length <= 1) return; // empty or header only

      const headers = rows[0];
      // Only process sheets that look like lead sheets (have a "Name" column)
      if (!headers.includes("Name")) return;

      rows.slice(1).forEach(function(row, i) {
        if (row.every(function(cell) { return cell === "" || cell === null; })) return;

        const obj = {};
        headers.forEach(function(h, j) {
          const normalised = String(h).trim()
            .replace(/^lead source$/i, "Lead Source")
            .replace(/^clean type$/i, "Clean Type")
            .replace(/^chased date$/i, "Chased Date")
            .replace(/^contact number$/i, "Contact Number");
          obj[normalised] = row[j];
        });
        obj.__sheet    = sheet.getName();
        obj.__rowIndex = i + 2;
        allLeads.push(obj);
      });
    });

    return buildResponse({ leads: allLeads }, callback);
  } catch(err) {
    return buildResponse({ error: err.message }, callback);
  }
}

// ---- POST: Lead Hub form, or webhooks from Kapso / Zernio ----
function doPost(e) {
  try {
    const p = e.parameter || {};

    // Webhooks: URL looks like .../exec?src=kapso&token=XXXX
    if (p.src) {
      if (!keyMatches(p.token, "WEBHOOK_TOKEN")) return buildResponse(UNAUTHORISED);
      const body = JSON.parse(e.postData.contents);
      if (p.src === "kapso")  return buildResponse(handleKapso(body));
      if (p.src === "zernio") return buildResponse(handleZernio(body));
      return buildResponse({ error: "Unknown source" });
    }

    // Lead Hub form
    const payload = JSON.parse(e.postData.contents);
    if (!keyMatches(payload.key, "APP_KEY")) return buildResponse(UNAUTHORISED);

    if (payload.action === "append") {
      const sheet = getOrCreateMonthSheet(SpreadsheetApp.openById(SHEET_ID));
      ensureHeaders(sheet);
      sheet.appendRow(COLUMNS.map(function(col) { return payload.data[col] || ""; }));
      return buildResponse({ success: true });
    }

    return buildResponse({ error: "Unknown action" });
  } catch(err) {
    return buildResponse({ error: err.message });
  }
}

// ============================================================
//  WEBHOOK HANDLERS
//  Each turns the provider's payload into one standard message
//  and passes it to recordMessage().
// ============================================================

// Kapso (WhatsApp). Subscribed to whatsapp.message.received and
// whatsapp.message.sent; replies typed on the phone arrive as "sent"
// with origin "business_app".
function handleKapso(body) {
  const items = body.batch === true && Array.isArray(body.data) ? body.data : [body];
  items.forEach(function(item) {
    const m = item.message || {};
    const c = item.conversation || {};
    const k = m.kapso || {};
    if (!m.id) return;
    const inbound = k.direction === "inbound";
    if (!inbound && k.direction !== "outbound") return;
    recordMessage({
      channel:        "WhatsApp",
      direction:      inbound ? "In" : "Out",
      contactName:    c.contact_name || "",
      contactId:      c.phone_number || m.from || m.to || "",
      phone:          c.phone_number || m.from || m.to || "",
      text:           k.content || (m.text && m.text.body) || ("[" + (m.type || "message") + "]"),
      messageId:      m.id,
      conversationId: c.id || ""
    });
  });
  return { ok: true };
}

// Zernio (Facebook Messenger, and Instagram if ever connected).
function handleZernio(body) {
  const ev = body.event || "";
  if (ev !== "message.received" && ev !== "message.sent") return { ok: true, ignored: ev };
  const m = body.message || {};
  if (!m.id) return { ok: true };
  const inbound  = ev === "message.received";
  const platform = String(m.platform || (body.account && body.account.platform) || "facebook");
  const sender   = m.sender || {};
  recordMessage({
    channel:        platform === "instagram" ? "Instagram" : "Facebook",
    direction:      inbound ? "In" : "Out",
    contactName:    inbound ? (sender.name || sender.username || "") : "",
    contactId:      m.conversationId || (body.conversation && body.conversation.id) || "",
    phone:          "",
    text:           m.text || "[attachment]",
    messageId:      m.id,
    conversationId: m.conversationId || ""
  });
  return { ok: true };
}

// ============================================================
//  CORE: log the message, and add a lead if it's someone new
// ============================================================
function recordMessage(msg) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const ss    = SpreadsheetApp.openById(SHEET_ID);
    const log   = getOrCreateMessagesSheet(ss);
    const rows  = log.getDataRange().getValues().slice(1);
    const idCol = MESSAGE_COLS.indexOf("Message ID");
    const dirCol = MESSAGE_COLS.indexOf("Direction");

    // Providers retry deliveries, so skip anything already logged
    const seen = rows.some(function(r) {
      return r[idCol] === msg.messageId && r[dirCol] === msg.direction;
    });
    if (seen) return;

    // Outbound messages don't carry the customer's name, so reuse the
    // name from earlier messages in the same chat
    if (!msg.contactName) {
      const cidCol = MESSAGE_COLS.indexOf("Contact ID");
      const nmCol  = MESSAGE_COLS.indexOf("Contact");
      for (let i = rows.length - 1; i >= 0; i--) {
        if (rows[i][cidCol] === msg.contactId && rows[i][nmCol]) { msg.contactName = rows[i][nmCol]; break; }
      }
    }

    const now = new Date();
    const isNewContact = msg.direction === "In" && !heardFromRecently(rows, msg.contactId, now);

    log.appendRow([now, msg.channel, msg.direction, msg.contactName, msg.contactId,
                   msg.phone, String(msg.text).slice(0, 2000), msg.messageId, msg.conversationId]);

    if (isNewContact) addLead(ss, msg, now);
  } finally {
    lock.releaseLock();
  }
}

function heardFromRecently(rows, contactId, now) {
  if (!contactId) return false;
  const cutoff = now.getTime() - NEW_LEAD_AFTER_DAYS * 24 * 60 * 60 * 1000;
  const cidCol = MESSAGE_COLS.indexOf("Contact ID");
  const tCol   = MESSAGE_COLS.indexOf("Received");
  return rows.some(function(r) {
    return r[cidCol] === contactId && new Date(r[tCol]).getTime() >= cutoff;
  });
}

function addLead(ss, msg, now) {
  const sheet = getOrCreateMonthSheet(ss);
  ensureHeaders(sheet);
  const data = {
    "Date":           now,
    "Lead Source":    msg.channel,
    "Name":           msg.contactName || "(unknown)",
    "Contact Number": msg.phone ? "+" + String(msg.phone).replace(/^\+/, "") : "",
    "Status":         NEW_LEAD_STATUS,
    "Notes":          "Auto-added from " + msg.channel + ": " + String(msg.text).slice(0, 300)
  };
  sheet.appendRow(COLUMNS.map(function(col) { return data[col] || ""; }));
}

// ============================================================
//  SHEET HELPERS
// ============================================================
function ensureHeaders(sheet) {
  const firstRow = sheet.getRange(1, 1, 1, COLUMNS.length).getValues()[0];
  const hasHeaders = firstRow.some(function(v) { return v !== ""; });
  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, COLUMNS.length).setValues([COLUMNS]);
    sheet.getRange(1, 1, 1, COLUMNS.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
}

function getOrCreateMonthSheet(ss) {
  const tabName = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "MMMM yyyy");
  let sheet = ss.getSheetByName(tabName);
  if (!sheet) {
    sheet = ss.insertSheet(tabName);
    ensureHeaders(sheet);
  }
  return sheet;
}

function getOrCreateMessagesSheet(ss) {
  let sheet = ss.getSheetByName(MESSAGES_TAB);
  if (!sheet) {
    sheet = ss.insertSheet(MESSAGES_TAB);
    sheet.getRange(1, 1, 1, MESSAGE_COLS.length).setValues([MESSAGE_COLS]).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// ============================================================
//  ONE-OFF SETUP: run this once from the editor (select
//  setupKeys in the toolbar, click Run). It creates both keys
//  and prints them in the Execution log. Running it again does
//  nothing unless the keys have been deleted.
// ============================================================
function setupKeys() {
  const props = PropertiesService.getScriptProperties();
  ["APP_KEY", "WEBHOOK_TOKEN"].forEach(function(name) {
    if (!props.getProperty(name)) props.setProperty(name, Utilities.getUuid().replace(/-/g, ""));
  });
  Logger.log("APP_KEY (type into the Lead Hub): " + props.getProperty("APP_KEY"));
  Logger.log("WEBHOOK_TOKEN (for Kapso / Zernio URLs): " + props.getProperty("WEBHOOK_TOKEN"));
}
