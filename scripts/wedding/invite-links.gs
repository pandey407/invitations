/**
 * Apps Script for the "Invitation List" Google Sheet (wedding + reception): the Guest list menu (add or insert a
 * guest row, tidy By Location) and the invite links.
 *
 * Install: in the sheet, Extensions → Apps Script, replace ALL the code with this file, Save, reload the sheet, then
 * run Guest list → Set up once (it asks for permission).
 *
 * Sheet1 columns:
 *   A SN · B Name · C Location · D Actual Name Ask? · E Physical Card · F Wedding · G चु: · H Salutation (dropdown;
 *   blank = श्री) · I Nepali Name (formula: "<salutation> <name in Nepali> ज्यू"; type over a cell to correct one) ·
 *   J Sent · K Invite Link (=INVITE_LINK(...), recalculates whenever its row changes)
 *
 * Who gets a link (one per row):
 *   Physical Card ticked                  → no link (they get the printed card)
 *   Actual Name Ask? ticked               → "Hold: ask actual name"
 *   "* N" in the name (several guests)    → "Hold: several guests"
 *   otherwise                             → their link: Wedding ticked → /wedding (wedding and reception),
 *                                           unticked → /reception (reception only)
 * The envelope shows the Nepali Name exactly as in column I, and the gold चु: stamp when चु: is ticked.
 *
 * The name travels inside the link (src/envelope/guest.ts reads it): base64url of UTF-8 JSON {n, c}. Keep the two
 * in step if either changes.
 */
const SITE = 'https://invite.ashleshpandey.com.np/';
const COLS = 11; // A..K
const TIMES = { ceremony: '0830', reception: '1730' }; // HHMM, 24-hour: the times the sheet's links show

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Guest list')
    .addItem('Add guest row', 'addGuestRow')
    .addItem('Insert guest row below the selected row', 'insertGuestRow')
    .addItem('Tidy By Location', 'mergeTitleBars')
    .addSeparator()
    .addItem('Set up: tidy after rows are deleted (run once)', 'setUpTriggers')
    .addToUi();
}

/** An edit to the guest list reshapes the By Location tab (it's one formula), so its title bars are merged afresh. */
function onEdit(e) {
  if (e && e.range.getSheet().getName() === 'Sheet1') mergeTitleBars();
}

/**
 * Deleting or inserting rows isn't an edit (onEdit doesn't hear it), so a change trigger tidies after those too.
 * It needs permission once: Guest list > Set up, then allow it. Running it again replaces the old trigger.
 */
function setUpTriggers() {
  ScriptApp.getProjectTriggers()
    .filter((t) => t.getHandlerFunction() === 'onRowsChanged')
    .forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('onRowsChanged').forSpreadsheet(SpreadsheetApp.getActive()).onChange().create();
  SpreadsheetApp.getUi().alert('Done: By Location now tidies itself after rows are deleted or inserted.');
}

function onRowsChanged(e) {
  if (e && /ROW/.test(e.changeType)) mergeTitleBars(); // INSERT_ROW, REMOVE_ROW
}

/**
 * By Location: each place's title row ("Banepa: 7 invites") merged across the table's nine columns. Merges stay on
 * fixed rows while the table's rows move, so they're all undone first, then made again where the titles are now.
 */
function mergeTitleBars() {
  const sheet = SpreadsheetApp.getActive().getSheetByName('By Location');
  if (!sheet) return;
  SpreadsheetApp.flush(); // let the formula settle into its new shape first
  sheet.getRange(2, 1, sheet.getMaxRows() - 1, 9).breakApart();
  sheet
    .getRange(1, 1, sheet.getLastRow(), 1)
    .getDisplayValues()
    .forEach(([v], i) => {
      if (/: \d+ invites?$/.test(v)) sheet.getRange(i + 1, 1, 1, 9).merge();
    });
}

// SN (column A) is one formula in the header cell A1 ("SN", then every named row numbered by its position), so it
// stays 1, 2, 3... however rows are added, inserted, deleted or moved. Nothing here writes to column A.

/** Adds a guest row at the bottom: empty ticks and salutation, the row's formulas, the table's look. */
function addGuestRow() {
  const sheet = SpreadsheetApp.getActive().getSheetByName('Sheet1');
  const last = sheet.getLastRow();
  const row = last + 1;
  if (sheet.getMaxRows() < row) sheet.insertRowAfter(last);
  blankGuestRow(sheet, row, last);

  // Stretch the striped colours and filter buttons to cover the new row
  sheet.getBandings().forEach((b) => b.setRange(sheet.getRange(1, 1, row, COLS)));
  const filter = sheet.getFilter();
  if (filter) {
    filter.remove();
    sheet.getRange(1, 1, row, COLS).createFilter();
  }

  sheet.setActiveRange(sheet.getRange(row, 2));
}

/**
 * Inserts a guest row just below the selected one (select any cell in a row of Sheet1 first), set up like the rest.
 * The stripes and filter grow on their own (the row is inside them), and SN renumbers itself.
 */
function insertGuestRow() {
  const sheet = SpreadsheetApp.getActive().getSheetByName('Sheet1');
  const active = SpreadsheetApp.getActive().getActiveRange();
  // Not under the header: a row put in above row 2 would fall outside SN's formula (it numbers B2 down).
  if (!active || active.getSheet().getName() !== 'Sheet1' || active.getLastRow() < 2) {
    SpreadsheetApp.getUi().alert('Select a guest row on Sheet1 first: the new row goes just below it.');
    return;
  }
  const above = active.getLastRow();
  sheet.insertRowAfter(above);
  const row = above + 1;
  blankGuestRow(sheet, row, above);
  sheet.setActiveRange(sheet.getRange(row, 2));
}

/**
 * Makes `row` a fresh guest row like `from`: B..K copied (formats, check boxes, dropdown, the Nepali Name and Invite
 * Link formulas), then everything typed or ticked emptied (B..H and J); A just takes the look (SN's formula fills
 * it in).
 */
function blankGuestRow(sheet, row, from) {
  sheet.getRange(from, 2, 1, COLS - 1).copyTo(sheet.getRange(row, 2, 1, COLS - 1));
  sheet.getRange(from, 1).copyTo(sheet.getRange(row, 1), SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
  sheet.getRange(row, 2, 1, 7).clearContent(); // B..H: name, place, ticks, salutation
  sheet.getRange(row, 10).clearContent(); // J: Sent
  sheet.getRange(row, 4, 1, 4).setValue(false);
  sheet.getRange(row, 10).setValue(false);
}

/**
 * The guest's personal invite link, or why they don't have one yet.
 * @param {string} name Name (column B)
 * @param {boolean} askName Actual Name Ask? (column D)
 * @param {boolean} physical Physical Card (column E)
 * @param {boolean} wedding Wedding (column F)
 * @param {boolean} chu चु: (column G)
 * @param {string} nepali Nepali Name with salutation (column I)
 * @return {string} The link, or the reason it's held.
 * @customfunction
 */
function INVITE_LINK(name, askName, physical, wedding, chu, nepali) {
  if (!String(name || '').trim() || physical === true) return '';
  if (askName === true) return 'Hold: ask actual name';
  if (/\*\s*\d/.test(name)) return 'Hold: several guests';
  const shown = String(nepali || '').trim();
  if (!shown) return 'Needs Nepali name';
  // The time each link shows, in its code (src/envelope/guest.ts): the wedding ceremony at 8:30 AM for our wedding
  // guests (the card's own default is 10:30), the reception at 5:30 PM.
  const data = { n: shown };
  if (chu === true) data.c = 1;
  data.t = wedding === true ? { c: TIMES.ceremony } : { r: TIMES.reception };
  const payload = JSON.stringify(data);
  const token = Utilities.base64EncodeWebSafe(payload, Utilities.Charset.UTF_8).replace(/=+$/, '');
  return SITE + (wedding === true ? 'wedding' : 'reception') + '/?g=' + token;
}
