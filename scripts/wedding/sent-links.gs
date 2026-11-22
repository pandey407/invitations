/**
 * Saved links: every link made with the link maker (/wedding/settings) is kept as a row in the "Sent links" tab, and
 * the invite reads its details from that row when it opens (the receiver's name, the चु: stamp, English or not, and the
 * times), so a link already sent can still be changed. The Sent links page (/wedding/settings/sent) lists the saved
 * links and changes them (behind the passcode below); the tab can be edited by hand too (times as "10:00 AM",
 * चु: and English as Yes or blank).
 *
 * Install (once), in the same Apps Script project as invite-links.gs:
 *   1. Extensions → Apps Script → + → Script, name it "sent-links", paste this file.
 *   2. Change PASSCODE below to one of your own, Save.
 *   3. Deploy → New deployment → type "Web app": Execute as "Me", Who has access "Anyone" → Deploy (allow access).
 *   4. Copy the Web app URL (…/exec) and send it to be put in the site (savedLinks in src/events/wedding/content.ts).
 *   The link maker asks for the passcode once on each device.
 * After editing this file later: Deploy → Manage deployments → edit → Version "New version" → Deploy (same URL).
 *
 * The web app:
 *   GET  ?id=…  → {"s":"groom","n":"…","c":1,"l":"en","t":{"j":"0830","c":"1000"}}: that one link's details (its
 *               side: groom, bride or reception, which card it opens; what its card asks;
 *               the id is in the link, which carries the same name anyway)
 *   POST {key, action:'save', id, side, name, chu, english, times:{janti,ceremony,reception}, link} → adds a row
 *   POST {key, action:'list'}                       → every saved link
 *   POST {key, action:'set', id, side, name, chu, english, times, link} → changes a link's details (any of side, name,
 *        chu, english, times given; a new side moves the link to that card), adding its row first if it has none (links sent before ids are kept under their code)
 */
const SENT_TAB = 'Sent links';
const SENT_HEAD = ['ID', 'Made', 'Side', 'Receiver', 'चु:', 'English', 'Janti', 'Ceremony', 'Reception', 'Link', 'Note'];
const TIME_COLS = { j: 7, c: 8, r: 9 }; // 1-based columns of the times above
const PARTS = { janti: 'j', ceremony: 'c', reception: 'r' };
const ID_RE = /^[A-Za-z0-9_-]{4,400}$/; // a saved link's id, or for a link without one (sent before ids), its whole code
const PASSCODE = 'change-me'; // the link maker asks for this before it saves, lists or changes links

function sentSheet_() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = book.getSheetByName(SENT_TAB);
  if (!sheet) {
    sheet = book.insertSheet(SENT_TAB);
    sheet.getRange(1, 1, 1, SENT_HEAD.length).setValues([SENT_HEAD]).setFontWeight('bold').setBackground('#e8f0e3');
    sheet.setFrozenRows(1);
    sheet.getRange('G:I').setNumberFormat('@'); // times stay as typed ("10:00 AM"), not turned into dates
    sheet.setColumnWidth(4, 220);
    sheet.setColumnWidth(10, 360);
  }
  return sheet;
}

/** Text as typed, never read as a formula. */
function text_(v, n) {
  const s = String(v || '').slice(0, n);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

/** "10:00 AM", "10 am", "22:00", "1000" or a time cell → "1000" (24-hour HHMM), else ''. */
function hhmm_(value) {
  if (value instanceof Date) return Utilities.formatDate(value, Session.getScriptTimeZone(), 'HHmm');
  const m = /^\s*(\d{1,2})(?::?(\d{2}))?\s*([ap]\.?m\.?)?\s*$/i.exec(String(value));
  if (!m) return '';
  let h = Number(m[1]);
  const min = Number(m[2] || 0);
  if (m[3]) h = (h % 12) + (/^p/i.test(m[3]) ? 12 : 0);
  if (h > 23 || min > 59) return '';
  return ('0' + h).slice(-2) + ('0' + min).slice(-2);
}

/** "1000" → "10:00 AM" (what the sheet shows). */
function say_(t) {
  if (!t) return '';
  const h = Number(t.slice(0, 2));
  return ((h % 12) || 12) + ':' + t.slice(2) + (h < 12 ? ' AM' : ' PM');
}

function findRow_(sheet, id) {
  const last = sheet.getLastRow();
  if (last < 2) return 0;
  const ids = sheet.getRange(2, 1, last - 1, 1).getDisplayValues();
  for (let i = 0; i < ids.length; i++) if (ids[i][0] === id) return i + 2;
  return 0;
}

function detailsOf_(r) {
  return { s: String(r[2]), n: String(r[3]), c: /^y/i.test(String(r[4])) ? 1 : 0, l: /^y/i.test(String(r[5])) ? 'en' : 'np', t: timesOf_(r) };
}

function doGet(e) {
  const id = String((e && e.parameter && e.parameter.id) || '');
  if (!ID_RE.test(id)) return json_({ error: 'id' });
  const sheet = sentSheet_();
  const row = findRow_(sheet, id);
  if (!row) return json_({ error: 'missing' });
  return json_(detailsOf_(sheet.getRange(row, 1, 1, SENT_HEAD.length).getValues()[0]));
}

function timesOf_(cells) {
  const t = {};
  Object.keys(TIME_COLS).forEach((k) => {
    const v = hhmm_(cells[TIME_COLS[k] - 1]);
    if (v) t[k] = v;
  });
  return t;
}

function doPost(e) {
  let d;
  try {
    d = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ error: 'body' });
  }
  if (PASSCODE === 'change-me' || String(d.key || '') !== PASSCODE) return json_({ error: 'passcode' });
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = sentSheet_();
    const times = d.times || {};
    if (d.action === 'list') {
      const last = sheet.getLastRow();
      const rows = last < 2 ? [] : sheet.getRange(2, 1, last - 1, SENT_HEAD.length).getValues();
      return json_({
        links: rows
          .filter((r) => r[0])
          .map((r) => ({
            id: String(r[0]),
            made: r[1] instanceof Date ? r[1].toISOString() : String(r[1]),
            side: String(r[2]),
            name: String(r[3]),
            chu: /^y/i.test(String(r[4])),
            english: /^y/i.test(String(r[5])),
            t: timesOf_(r),
            link: String(r[9]),
          })),
      });
    }
    const id = String(d.id || '');
    if (!ID_RE.test(id)) return json_({ error: 'id' });
    const row = findRow_(sheet, id);
    if (d.action === 'set' && !row) {
      appendLink_(sheet, id, d);
      return json_(Object.assign({ ok: true }, detailsOf_(sheet.getRange(sheet.getLastRow(), 1, 1, SENT_HEAD.length).getValues()[0])));
    }
    if (d.action === 'times' || d.action === 'set') {
      if (!row) return json_({ error: 'missing' });
      if (d.side && /^(groom|bride|reception)$/.test(d.side)) sheet.getRange(row, 3).setValue(d.side);
      if ('name' in d) sheet.getRange(row, 4).setValue(text_(d.name, 80));
      if ('chu' in d) sheet.getRange(row, 5).setValue(d.chu ? 'Yes' : '');
      if ('english' in d) sheet.getRange(row, 6).setValue(d.english ? 'Yes' : '');
      Object.keys(PARTS).forEach((part) => {
        if (part in times) sheet.getRange(row, TIME_COLS[PARTS[part]]).setValue(say_(hhmm_(times[part] || '')));
      });
      return json_(Object.assign({ ok: true }, detailsOf_(sheet.getRange(row, 1, 1, SENT_HEAD.length).getValues()[0])));
    }
    if (d.action !== 'save') return json_({ error: 'action' });
    if (row) return json_({ ok: true, existed: true });
    appendLink_(sheet, id, d);
    return json_({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

function appendLink_(sheet, id, d) {
  const times = d.times || {};
  const clip = text_;
  sheet.getRange(sheet.getLastRow() + 1, 1).setNumberFormat('@');
  sheet.appendRow([
      id,
      new Date(),
      clip(d.side, 40),
      clip(d.name, 80),
      d.chu ? 'Yes' : '',
      d.english ? 'Yes' : '',
      say_(hhmm_(times.janti || '')),
      say_(hhmm_(times.ceremony || '')),
      say_(hhmm_(times.reception || '')),
      clip(d.link, 600),
      '',
    ]);
}
