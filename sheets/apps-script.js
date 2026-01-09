/**
 * Lead Velocity - Google Sheets Apps Script
 *
 * Add this script to your Google Sheet:
 * 1. Open Sheet → Extensions → Apps Script
 * 2. Paste this code
 * 3. Save and authorize
 *
 * This script auto-generates IDs and timestamps for new rows.
 */

/**
 * Trigger: Runs when sheet is edited
 */
function onEdit(e) {
  const sheet = e.source.getActiveSheet();
  const range = e.range;

  // Only process "Leads" sheet
  if (sheet.getName() !== 'Leads') return;

  const row = range.getRow();
  const col = range.getColumn();

  // Skip header row
  if (row === 1) return;

  // Column indexes (1-based)
  const COL_ID = 1;           // A
  const COL_CREATED_AT = 40;  // AN
  const COL_UPDATED_AT = 41;  // AO

  const now = new Date();

  // If ID is empty and we're adding data, generate ID
  if (sheet.getRange(row, COL_ID).getValue() === '') {
    const id = generateLeadId();
    sheet.getRange(row, COL_ID).setValue(id);
    sheet.getRange(row, COL_CREATED_AT).setValue(now);
  }

  // Always update updated_at
  sheet.getRange(row, COL_UPDATED_AT).setValue(now);
}

/**
 * Generate unique lead ID
 * Format: LD-{timestamp}-{random}
 */
function generateLeadId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `LD-${timestamp}-${random}`;
}

/**
 * Calculate lead score for a row
 * Can be called as custom function: =LEAD_SCORE(H2, I2, K2, C2)
 *
 * @param {number} price - Asking price
 * @param {number} beds - Number of bedrooms
 * @param {number} sqft - Square footage
 * @param {Date} dateFound - When lead was found
 * @return {number} Lead score 0-100
 */
function LEAD_SCORE(price, beds, sqft, dateFound) {
  let score = 50;

  // Price scoring
  if (price >= 500000) score += 20;
  else if (price >= 300000) score += 10;

  // Beds scoring
  if (beds >= 4) score += 10;

  // Sqft scoring
  if (sqft >= 2000) score += 10;

  // Freshness scoring
  if (dateFound) {
    const daysOld = Math.floor((new Date() - new Date(dateFound)) / (1000 * 60 * 60 * 24));
    if (daysOld <= 7) score += 10;
    else if (daysOld <= 14) score += 5;
  }

  return Math.min(score, 100);
}

/**
 * Format phone number to standard format
 * Can be called as: =FORMAT_PHONE(L2)
 *
 * @param {string} phone - Raw phone number
 * @return {string} Formatted phone (xxx-xxx-xxxx)
 */
function FORMAT_PHONE(phone) {
  if (!phone) return '';

  // Remove all non-digits
  const digits = phone.toString().replace(/\D/g, '');

  // Handle 10 or 11 digit numbers
  if (digits.length === 10) {
    return `${digits.slice(0,3)}-${digits.slice(3,6)}-${digits.slice(6)}`;
  } else if (digits.length === 11 && digits[0] === '1') {
    return `${digits.slice(1,4)}-${digits.slice(4,7)}-${digits.slice(7)}`;
  }

  return phone; // Return original if can't format
}

/**
 * Validate phone number
 * Can be called as: =IS_VALID_PHONE(L2)
 *
 * @param {string} phone - Phone number to validate
 * @return {boolean} True if valid
 */
function IS_VALID_PHONE(phone) {
  if (!phone) return false;
  const digits = phone.toString().replace(/\D/g, '');
  return digits.length === 10 || (digits.length === 11 && digits[0] === '1');
}

/**
 * Menu for manual operations
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Lead Velocity')
    .addItem('Recalculate All Scores', 'recalculateAllScores')
    .addItem('Clean Phone Numbers', 'cleanAllPhones')
    .addItem('Archive Stale Leads', 'archiveStaleLeads')
    .addToUi();
}

/**
 * Recalculate lead scores for all rows
 */
function recalculateAllScores() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Leads');
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) return;

  const COL_PRICE = 8;      // H
  const COL_BEDS = 9;       // I
  const COL_SQFT = 11;      // K
  const COL_DATE = 3;       // C
  const COL_SCORE = 34;     // AH

  for (let row = 2; row <= lastRow; row++) {
    const price = sheet.getRange(row, COL_PRICE).getValue();
    const beds = sheet.getRange(row, COL_BEDS).getValue();
    const sqft = sheet.getRange(row, COL_SQFT).getValue();
    const dateFound = sheet.getRange(row, COL_DATE).getValue();

    const score = LEAD_SCORE(price, beds, sqft, dateFound);
    sheet.getRange(row, COL_SCORE).setValue(score);
  }

  SpreadsheetApp.getUi().alert(`Recalculated scores for ${lastRow - 1} leads.`);
}

/**
 * Format all phone numbers in the sheet
 */
function cleanAllPhones() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Leads');
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) return;

  const COL_PHONE = 12; // L
  let cleaned = 0;

  for (let row = 2; row <= lastRow; row++) {
    const phone = sheet.getRange(row, COL_PHONE).getValue();
    if (phone) {
      const formatted = FORMAT_PHONE(phone);
      if (formatted !== phone.toString()) {
        sheet.getRange(row, COL_PHONE).setValue(formatted);
        cleaned++;
      }
    }
  }

  SpreadsheetApp.getUi().alert(`Cleaned ${cleaned} phone numbers.`);
}

/**
 * Archive leads older than 30 days with no activity
 */
function archiveStaleLeads() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Leads');
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) return;

  const COL_DATE = 3;       // C
  const COL_STATUS = 15;    // O
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  let archived = 0;
  const staleStatuses = ['new', 'no_answer', 'voicemail', 'max_attempts'];

  for (let row = 2; row <= lastRow; row++) {
    const dateFound = new Date(sheet.getRange(row, COL_DATE).getValue());
    const status = sheet.getRange(row, COL_STATUS).getValue();

    if (dateFound < thirtyDaysAgo && staleStatuses.includes(status)) {
      sheet.getRange(row, COL_STATUS).setValue('archived');
      archived++;
    }
  }

  SpreadsheetApp.getUi().alert(`Archived ${archived} stale leads.`);
}
