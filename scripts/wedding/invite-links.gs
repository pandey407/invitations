/**
 * Apps Script for the "Invitation List" Google Sheet (wedding + reception): the Add Row button and the invite links.
 *
 * Install: in the sheet, Extensions → Apps Script, replace ALL the code with this file, Save. (It includes the
 * Add Row button's addGuestRow, so the button keeps working.)
 *
 * Sheet1 columns:
 *   A SN · B Name · C Location · D Actual Name Ask? · E Physical Card · F Wedding · G चु: · H Salutation (dropdown;
 *   blank = श्री) · I Nepali Name (formula: "<salutation> <name in Nepali> ज्यू"; type over a cell to correct one) ·
 *   J Invite Link (=INVITE_LINK(...), recalculates whenever its row changes) · K Sent
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

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Guest list')
    .addItem('Add guest row', 'addGuestRow')
    .addItem('Tidy By Location', 'mergeTitleBars')
    .addToUi();
}

/** An edit to the guest list reshapes the By Location tab (it's one formula), so its title bars are merged afresh. */
function onEdit(e) {
  if (e && e.range.getSheet().getName() === 'Sheet1') mergeTitleBars();
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

/** Adds a guest row at the bottom: next SN, empty ticks and salutation, the row's formulas, the table's look. */
function addGuestRow() {
  const sheet = SpreadsheetApp.getActive().getSheetByName('Sheet1');
  const last = sheet.getLastRow();
  const row = last + 1;
  if (sheet.getMaxRows() < row) sheet.insertRowAfter(last);

  // Copy the last row whole (formats, check boxes, dropdown, the Nepali Name and Invite Link formulas), then
  // empty everything typed or ticked: A..H and K.
  sheet.getRange(last, 1, 1, COLS).copyTo(sheet.getRange(row, 1, 1, COLS));
  sheet.getRange(row, 1, 1, 8).clearContent();
  sheet.getRange(row, 11).clearContent();
  sheet.getRange(row, 4, 1, 4).setValue(false);
  sheet.getRange(row, 11).setValue(false);

  // Next SN number
  const sns = sheet.getRange(2, 1, last - 1, 1).getValues().flat().filter((v) => typeof v === 'number');
  sheet.getRange(row, 1).setValue(sns.length ? Math.max(...sns) + 1 : 1);

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
  const payload = JSON.stringify(chu === true ? { n: shown, c: 1 } : { n: shown });
  const token = Utilities.base64EncodeWebSafe(payload, Utilities.Charset.UTF_8).replace(/=+$/, '');
  return SITE + (wedding === true ? 'wedding' : 'reception') + '/?g=' + token;
}
