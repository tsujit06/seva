const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// Asset paths
const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const GODDESS_LOGO_PATH = path.join(ASSETS_DIR, 'goddess-logo.png');
const WATERMARK_PATH = path.join(ASSETS_DIR, 'watermark.png');
const RECEIPT_BG_PATH = path.join(ASSETS_DIR, 'receipt-bg.png');
const KANNADA_FONT_PATH = path.join(ASSETS_DIR, 'NotoSansKannada.ttf');
const NOTO_SANS_PATH = path.join(ASSETS_DIR, 'NotoSans.ttf');

// Colors
const SAFFRON_HEX = '#CD5C08';
const MAROON_HEX = '#8B1A1A';
const GOLD_HEX = '#C9A227';
const DARK_BROWN_HEX = '#5D3A1A';

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const LEFT = 50;
const RIGHT = PAGE_W - 50;
const CONTENT_W = RIGHT - LEFT;

// ======================================================================
//  Utility helpers
// ======================================================================

function formatCurrency(amount) {
  return 'Rs.' + Number(amount).toLocaleString('en-IN');
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function numberToWords(num) {
  if (num === 0) return 'Zero';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  function c(n) {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + c(n % 100) : '');
    if (n < 100000) return c(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + c(n % 1000) : '');
    if (n < 10000000) return c(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + c(n % 100000) : '');
    return c(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + c(n % 10000000) : '');
  }
  return c(Math.floor(num));
}

function numberToKannadaWords(num) {
  if (num === 0) return '\u0CB8\u0CCA\u0CA8\u0CCD\u0CA8\u0CC6'; // ಸೊನ್ನೆ
  const ones = ['', '\u0C92\u0C82\u0CA6\u0CC1', '\u0C8E\u0CB0\u0CA1\u0CC1', '\u0CAE\u0CC2\u0CB0\u0CC1', '\u0CA8\u0CBE\u0CB2\u0CCD\u0C95\u0CC1', '\u0C90\u0CA6\u0CC1', '\u0C86\u0CB0\u0CC1', '\u0C8F\u0CB3\u0CC1', '\u0C8E\u0C82\u0C9F\u0CC1', '\u0C92\u0C82\u0CAC\u0CA4\u0CCD\u0CA4\u0CC1',
    '\u0CB9\u0CA4\u0CCD\u0CA4\u0CC1', '\u0CB9\u0CA8\u0CCD\u0CA8\u0CCA\u0C82\u0CA6\u0CC1', '\u0CB9\u0CA8\u0CCD\u0CA8\u0CC6\u0CB0\u0CA1\u0CC1', '\u0CB9\u0CA6\u0CBF\u0CAE\u0CC2\u0CB0\u0CC1', '\u0CB9\u0CA6\u0CBF\u0CA8\u0CBE\u0CB2\u0CCD\u0C95\u0CC1', '\u0CB9\u0CA6\u0CBF\u0CA8\u0CC8\u0CA6\u0CC1', '\u0CB9\u0CA6\u0CBF\u0CA8\u0CBE\u0CB0\u0CC1', '\u0CB9\u0CA6\u0CBF\u0CA8\u0CC7\u0CB3\u0CC1', '\u0CB9\u0CA6\u0CBF\u0CA8\u0CC6\u0C82\u0C9F\u0CC1', '\u0CB9\u0CA4\u0CCD\u0CA4\u0CCA\u0C82\u0CAC\u0CA4\u0CCD\u0CA4\u0CC1'];
  // ones = ['', 'ಒಂದು', 'ಎರಡು', 'ಮೂರು', 'ನಾಲ್ಕು', 'ಐದು', 'ಆರು', 'ಏಳು', 'ಎಂಟು', 'ಒಂಬತ್ತು', 'ಹತ್ತು', 'ಹನ್ನೊಂದು', 'ಹನ್ನೆರಡು', 'ಹದಿಮೂರು', 'ಹದಿನಾಲ್ಕು', 'ಹದಿನೈದು', 'ಹದಿನಾರು', 'ಹದಿನೇಳು', 'ಹದಿನೆಂಟು', 'ಹತ್ತೊಂಬತ್ತು']
  const tens = ['', '', '\u0C87\u0CAA\u0CCD\u0CAA\u0CA4\u0CCD\u0CA4\u0CC1', '\u0CAE\u0CC2\u0CB5\u0CA4\u0CCD\u0CA4\u0CC1', '\u0CA8\u0CB2\u0CB5\u0CA4\u0CCD\u0CA4\u0CC1', '\u0C90\u0CB5\u0CA4\u0CCD\u0CA4\u0CC1', '\u0C85\u0CB0\u0CB5\u0CA4\u0CCD\u0CA4\u0CC1', '\u0C8E\u0CAA\u0CCD\u0CAA\u0CA4\u0CCD\u0CA4\u0CC1', '\u0C8E\u0C82\u0CAC\u0CA4\u0CCD\u0CA4\u0CC1', '\u0CA4\u0CCA\u0C82\u0CAC\u0CA4\u0CCD\u0CA4\u0CC1'];
  // tens = ['', '', 'ಇಪ್ಪತ್ತು', 'ಮೂವತ್ತು', 'ನಲವತ್ತು', 'ಐವತ್ತು', 'ಅರವತ್ತು', 'ಎಪ್ಪತ್ತು', 'ಎಂಬತ್ತು', 'ತೊಂಬತ್ತು']
  function c(n) {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' \u0CA8\u0CC2\u0CB0\u0CC1' + (n % 100 ? ' ' + c(n % 100) : ''); // ನೂರು
    if (n < 100000) return c(Math.floor(n / 1000)) + ' \u0CB8\u0CBE\u0CB5\u0CBF\u0CB0' + (n % 1000 ? ' ' + c(n % 1000) : ''); // ಸಾವಿರ
    if (n < 10000000) return c(Math.floor(n / 100000)) + ' \u0CB2\u0C95\u0CCD\u0CB7' + (n % 100000 ? ' ' + c(n % 100000) : ''); // ಲಕ್ಷ
    return c(Math.floor(n / 10000000)) + ' \u0C95\u0CCB\u0C9F\u0CBF' + (n % 10000000 ? ' ' + c(n % 10000000) : ''); // ಕೋಟಿ
  }
  return c(Math.floor(num));
}

function getPlanDisplayName(pt) {
  return { archana: 'Archana Seva', sahasranama: 'Sahasranama Seva', nitya_archana: 'Nitya Archana Seva', saswatha: 'Saswatha Seva Membership', custom: 'Custom Seva / Donation' }[pt] || pt;
}

// ಸೇವಾ ಹೆಸರುಗಳು (Kannada plan names)
function getPlanDisplayNameKannada(pt) {
  return {
    archana: '\u0C85\u0CB0\u0CCD\u0C9A\u0CA8\u0CBE \u0CB8\u0CC7\u0CB5\u0CC6',               // ಅರ್ಚನಾ ಸೇವೆ
    sahasranama: '\u0CB8\u0CB9\u0CB8\u0CCD\u0CB0\u0CA8\u0CBE\u0CAE \u0CB8\u0CC7\u0CB5\u0CC6', // ಸಹಸ್ರನಾಮ ಸೇವೆ
    nitya_archana: '\u0CA8\u0CBF\u0CA4\u0CCD\u0CAF \u0C85\u0CB0\u0CCD\u0C9A\u0CA8\u0CBE \u0CB8\u0CC7\u0CB5\u0CC6', // ನಿತ್ಯ ಅರ್ಚನಾ ಸೇವೆ
    saswatha: '\u0CB6\u0CBE\u0CB6\u0CCD\u0CB5\u0CA4 \u0CB8\u0CC7\u0CB5\u0CBE \u0CB8\u0CA6\u0CB8\u0CCD\u0CAF\u0CA4\u0CCD\u0CB5', // ಶಾಶ್ವತ ಸೇವಾ ಸದಸ್ಯತ್ವ
    custom: '\u0CB5\u0CBF\u0CB6\u0CC7\u0CB7 \u0CB8\u0CC7\u0CB5\u0CC6 / \u0CA6\u0CBE\u0CA8',  // ವಿಶೇಷ ಸೇವೆ / ದಾನ
  }[pt] || pt;
}

function getPaymentMethodName(m) {
  return { upi: 'UPI', cash: 'Cash', debit_card: 'Debit/Credit Card', net_banking: 'Net Banking', direct_transfer: 'Bank Transfer', cheque_dd: 'Cheque/DD' }[m] || m;
}

// English seva notes
function getSevaNote(pt) {
  const n = {
    archana: 'Note: Archana Seva includes 1. Name included in monthly Archana & Sankalpa, 2. Festival & puja notifications (Notification only), and 3. Digital membership certificate.',
    sahasranama: 'Note: Sahasranama Seva includes 1. Name included in monthly Archana & Sankalpa, 2. Prasadam on Temple visit, 3. Naivedya offered to the Goddess on a specific day in devotee\'s name, 4. Festival & puja notifications (Notification only), and Digital membership certificate.',
    nitya_archana: 'Note: Nitya Archana Seva includes 1. Name included in Daily Archana, 2. Name included in Annual Special Homam, 3. Monthly Prasadam Courier, 4. Festival & puja notifications (Notification only), and 5. Digital membership certificate.',
    saswatha: 'Note: Saswatha Seva Membership includes 1. Name included in Daily Archana, 2. Special pujas / archana and prasadam delivery on selected dates, 3. Annual opportunity to participate in a Homam or Special Puja, 4. Festival & puja notifications (Notification only), 5. Special Blessings Letter from the Temple, and 6. Digital membership certificate.',
    custom: '',
  };
  return n[pt] || '';
}

// Kannada seva notes (ಸೇವಾ ಸೂಚನೆಗಳು)
function getSevaNoteKannada(pt) {
  const n = {
    archana: '\u0CB8\u0CC2\u0C9A\u0CA8\u0CC6: \u0C85\u0CB0\u0CCD\u0C9A\u0CA8\u0CBE \u0CB8\u0CC7\u0CB5\u0CC6\u0CAF\u0CC1 \u0C92\u0CB3\u0C97\u0CCA\u0C82\u0CA1\u0CBF\u0CB0\u0CC1\u0CB5\u0CC1\u0CA6\u0CC1 1. \u0CAE\u0CBE\u0CB8\u0CBF\u0C95 \u0C85\u0CB0\u0CCD\u0C9A\u0CA8\u0CC6 \u0CAE\u0CA4\u0CCD\u0CA4\u0CC1 \u0CB8\u0C82\u0C95\u0CB2\u0CCD\u0CAA\u0CA6\u0CB2\u0CCD\u0CB2\u0CBF \u0CB9\u0CC6\u0CB8\u0CB0\u0CC1 \u0CB8\u0CC7\u0CB0\u0CCD\u0CAA\u0CA1\u0CC6, 2. \u0CB9\u0CAC\u0CCD\u0CAC \u0CAE\u0CA4\u0CCD\u0CA4\u0CC1 \u0CAA\u0CC2\u0C9C\u0CC6 \u0CB8\u0CC2\u0C9A\u0CA8\u0CC6\u0C97\u0CB3\u0CC1 (\u0CB8\u0CC2\u0C9A\u0CA8\u0CC6 \u0CAE\u0CBE\u0CA4\u0CCD\u0CB0), \u0CAE\u0CA4\u0CCD\u0CA4\u0CC1 3. \u0CA1\u0CBF\u0C9C\u0CBF\u0C9F\u0CB2\u0CCD \u0CB8\u0CA6\u0CB8\u0CCD\u0CAF\u0CA4\u0CCD\u0CB5 \u0CAA\u0CCD\u0CB0\u0CAE\u0CBE\u0CA3\u0CAA\u0CA4\u0CCD\u0CB0.',
    // ಸೂಚನೆ: ಅರ್ಚನಾ ಸೇವೆಯು ಒಳಗೊಂಡಿರುವುದು 1. ಮಾಸಿಕ ಅರ್ಚನೆ ಮತ್ತು ಸಂಕಲ್ಪದಲ್ಲಿ ಹೆಸರು ಸೇರ್ಪಡೆ, 2. ಹಬ್ಬ ಮತ್ತು ಪೂಜೆ ಸೂಚನೆಗಳು (ಸೂಚನೆ ಮಾತ್ರ), ಮತ್ತು 3. ಡಿಜಿಟಲ್ ಸದಸ್ಯತ್ವ ಪ್ರಮಾಣಪತ್ರ.
    sahasranama: '\u0CB8\u0CC2\u0C9A\u0CA8\u0CC6: \u0CB8\u0CB9\u0CB8\u0CCD\u0CB0\u0CA8\u0CBE\u0CAE \u0CB8\u0CC7\u0CB5\u0CC6\u0CAF\u0CC1 \u0C92\u0CB3\u0C97\u0CCA\u0C82\u0CA1\u0CBF\u0CB0\u0CC1\u0CB5\u0CC1\u0CA6\u0CC1 1. \u0CAE\u0CBE\u0CB8\u0CBF\u0C95 \u0C85\u0CB0\u0CCD\u0C9A\u0CA8\u0CC6 \u0CAE\u0CA4\u0CCD\u0CA4\u0CC1 \u0CB8\u0C82\u0C95\u0CB2\u0CCD\u0CAA\u0CA6\u0CB2\u0CCD\u0CB2\u0CBF \u0CB9\u0CC6\u0CB8\u0CB0\u0CC1 \u0CB8\u0CC7\u0CB0\u0CCD\u0CAA\u0CA1\u0CC6, 2. \u0CA6\u0CC7\u0CB5\u0CB8\u0CCD\u0CA5\u0CBE\u0CA8\u0C95\u0CCD\u0C95\u0CC6 \u0CAD\u0CC7\u0C9F\u0CBF \u0CA8\u0CC0\u0CA1\u0CBF\u0CA6\u0CBE\u0C97 \u0CAA\u0CCD\u0CB0\u0CB8\u0CBE\u0CA6, 3. \u0CAD\u0C95\u0CCD\u0CA4\u0CB0 \u0CB9\u0CC6\u0CB8\u0CB0\u0CBF\u0CA8\u0CB2\u0CCD\u0CB2\u0CBF \u0CA8\u0CBF\u0CB0\u0CCD\u0CA6\u0CBF\u0CB7\u0CCD\u0C9F \u0CA6\u0CBF\u0CA8\u0CA6\u0C82\u0CA6\u0CC1 \u0CA6\u0CC7\u0CB5\u0CBF\u0C97\u0CC6 \u0CA8\u0CC8\u0CB5\u0CC7\u0CA6\u0CCD\u0CAF, 4. \u0CB9\u0CAC\u0CCD\u0CAC \u0CAE\u0CA4\u0CCD\u0CA4\u0CC1 \u0CAA\u0CC2\u0C9C\u0CC6 \u0CB8\u0CC2\u0C9A\u0CA8\u0CC6\u0C97\u0CB3\u0CC1 (\u0CB8\u0CC2\u0C9A\u0CA8\u0CC6 \u0CAE\u0CBE\u0CA4\u0CCD\u0CB0), \u0CAE\u0CA4\u0CCD\u0CA4\u0CC1 \u0CA1\u0CBF\u0C9C\u0CBF\u0C9F\u0CB2\u0CCD \u0CB8\u0CA6\u0CB8\u0CCD\u0CAF\u0CA4\u0CCD\u0CB5 \u0CAA\u0CCD\u0CB0\u0CAE\u0CBE\u0CA3\u0CAA\u0CA4\u0CCD\u0CB0.',
    // ಸೂಚನೆ: ಸಹಸ್ರನಾಮ ಸೇವೆಯು ಒಳಗೊಂಡಿರುವುದು 1. ಮಾಸಿಕ ಅರ್ಚನೆ ಮತ್ತು ಸಂಕಲ್ಪದಲ್ಲಿ ಹೆಸರು ಸೇರ್ಪಡೆ, 2. ದೇವಸ್ಥಾನಕ್ಕೆ ಭೇಟಿ ನೀಡಿದಾಗ ಪ್ರಸಾದ, 3. ಭಕ್ತರ ಹೆಸರಿನಲ್ಲಿ ನಿರ್ದಿಷ್ಟ ದಿನದಂದು ದೇವಿಗೆ ನೈವೇದ್ಯ, 4. ಹಬ್ಬ ಮತ್ತು ಪೂಜೆ ಸೂಚನೆಗಳು (ಸೂಚನೆ ಮಾತ್ರ), ಮತ್ತು ಡಿಜಿಟಲ್ ಸದಸ್ಯತ್ವ ಪ್ರಮಾಣಪತ್ರ.
    nitya_archana: '\u0CB8\u0CC2\u0C9A\u0CA8\u0CC6: \u0CA8\u0CBF\u0CA4\u0CCD\u0CAF \u0C85\u0CB0\u0CCD\u0C9A\u0CA8\u0CBE \u0CB8\u0CC7\u0CB5\u0CC6\u0CAF\u0CC1 \u0C92\u0CB3\u0C97\u0CCA\u0C82\u0CA1\u0CBF\u0CB0\u0CC1\u0CB5\u0CC1\u0CA6\u0CC1 1. \u0CA6\u0CC8\u0CA8\u0C82\u0CA6\u0CBF\u0CA8 \u0C85\u0CB0\u0CCD\u0C9A\u0CA8\u0CC6\u0CAF\u0CB2\u0CCD\u0CB2\u0CBF \u0CB9\u0CC6\u0CB8\u0CB0\u0CC1 \u0CB8\u0CC7\u0CB0\u0CCD\u0CAA\u0CA1\u0CC6, 2. \u0CB5\u0CBE\u0CB0\u0CCD\u0CB7\u0CBF\u0C95 \u0CB5\u0CBF\u0CB6\u0CC7\u0CB7 \u0CB9\u0CCB\u0CAE\u0CA6\u0CB2\u0CCD\u0CB2\u0CBF \u0CB9\u0CC6\u0CB8\u0CB0\u0CC1 \u0CB8\u0CC7\u0CB0\u0CCD\u0CAA\u0CA1\u0CC6, 3. \u0CAE\u0CBE\u0CB8\u0CBF\u0C95 \u0CAA\u0CCD\u0CB0\u0CB8\u0CBE\u0CA6 \u0C95\u0CCA\u0CB0\u0CBF\u0CAF\u0CB0\u0CCD, 4. \u0CB9\u0CAC\u0CCD\u0CAC \u0CAE\u0CA4\u0CCD\u0CA4\u0CC1 \u0CAA\u0CC2\u0C9C\u0CC6 \u0CB8\u0CC2\u0C9A\u0CA8\u0CC6\u0C97\u0CB3\u0CC1 (\u0CB8\u0CC2\u0C9A\u0CA8\u0CC6 \u0CAE\u0CBE\u0CA4\u0CCD\u0CB0), \u0CAE\u0CA4\u0CCD\u0CA4\u0CC1 5. \u0CA1\u0CBF\u0C9C\u0CBF\u0C9F\u0CB2\u0CCD \u0CB8\u0CA6\u0CB8\u0CCD\u0CAF\u0CA4\u0CCD\u0CB5 \u0CAA\u0CCD\u0CB0\u0CAE\u0CBE\u0CA3\u0CAA\u0CA4\u0CCD\u0CB0.',
    // ಸೂಚನೆ: ನಿತ್ಯ ಅರ್ಚನಾ ಸೇವೆಯು ಒಳಗೊಂಡಿರುವುದು 1. ದೈನಂದಿನ ಅರ್ಚನೆಯಲ್ಲಿ ಹೆಸರು ಸೇರ್ಪಡೆ, 2. ವಾರ್ಷಿಕ ವಿಶೇಷ ಹೋಮದಲ್ಲಿ ಹೆಸರು ಸೇರ್ಪಡೆ, 3. ಮಾಸಿಕ ಪ್ರಸಾದ ಕೊರಿಯರ್, 4. ಹಬ್ಬ ಮತ್ತು ಪೂಜೆ ಸೂಚನೆಗಳು (ಸೂಚನೆ ಮಾತ್ರ), ಮತ್ತು 5. ಡಿಜಿಟಲ್ ಸದಸ್ಯತ್ವ ಪ್ರಮಾಣಪತ್ರ.
    saswatha: '\u0CB8\u0CC2\u0C9A\u0CA8\u0CC6: \u0CB6\u0CBE\u0CB6\u0CCD\u0CB5\u0CA4 \u0CB8\u0CC7\u0CB5\u0CBE \u0CB8\u0CA6\u0CB8\u0CCD\u0CAF\u0CA4\u0CCD\u0CB5\u0CB5\u0CC1 \u0C92\u0CB3\u0C97\u0CCA\u0C82\u0CA1\u0CBF\u0CB0\u0CC1\u0CB5\u0CC1\u0CA6\u0CC1 1. \u0CA6\u0CC8\u0CA8\u0C82\u0CA6\u0CBF\u0CA8 \u0C85\u0CB0\u0CCD\u0C9A\u0CA8\u0CC6\u0CAF\u0CB2\u0CCD\u0CB2\u0CBF \u0CB9\u0CC6\u0CB8\u0CB0\u0CC1 \u0CB8\u0CC7\u0CB0\u0CCD\u0CAA\u0CA1\u0CC6, 2. \u0C86\u0CAF\u0CCD\u0C95\u0CC6 \u0CAE\u0CBE\u0CA1\u0CBF\u0CA6 \u0CA6\u0CBF\u0CA8\u0CBE\u0C82\u0C95\u0C97\u0CB3\u0CB2\u0CCD\u0CB2\u0CBF \u0CB5\u0CBF\u0CB6\u0CC7\u0CB7 \u0CAA\u0CC2\u0C9C\u0CC6/\u0C85\u0CB0\u0CCD\u0C9A\u0CA8\u0CC6 \u0CAE\u0CA4\u0CCD\u0CA4\u0CC1 \u0CAA\u0CCD\u0CB0\u0CB8\u0CBE\u0CA6 \u0CB5\u0CBF\u0CA4\u0CB0\u0CA3\u0CC6, 3. \u0CB9\u0CCB\u0CAE \u0C85\u0CA5\u0CB5\u0CBE \u0CB5\u0CBF\u0CB6\u0CC7\u0CB7 \u0CAA\u0CC2\u0C9C\u0CC6\u0CAF\u0CB2\u0CCD\u0CB2\u0CBF \u0CAD\u0CBE\u0C97\u0CB5\u0CB9\u0CBF\u0CB8\u0CB2\u0CC1 \u0CB5\u0CBE\u0CB0\u0CCD\u0CB7\u0CBF\u0C95 \u0C85\u0CB5\u0C95\u0CBE\u0CB6, 4. \u0CB9\u0CAC\u0CCD\u0CAC \u0CAE\u0CA4\u0CCD\u0CA4\u0CC1 \u0CAA\u0CC2\u0C9C\u0CC6 \u0CB8\u0CC2\u0C9A\u0CA8\u0CC6\u0C97\u0CB3\u0CC1 (\u0CB8\u0CC2\u0C9A\u0CA8\u0CC6 \u0CAE\u0CBE\u0CA4\u0CCD\u0CB0), 5. \u0CA6\u0CC7\u0CB5\u0CB8\u0CCD\u0CA5\u0CBE\u0CA8\u0CA6\u0CBF\u0C82\u0CA6 \u0CB5\u0CBF\u0CB6\u0CC7\u0CB7 \u0C86\u0CB6\u0CC0\u0CB0\u0CCD\u0CB5\u0CBE\u0CA6 \u0CAA\u0CA4\u0CCD\u0CB0, \u0CAE\u0CA4\u0CCD\u0CA4\u0CC1 6. \u0CA1\u0CBF\u0C9C\u0CBF\u0C9F\u0CB2\u0CCD \u0CB8\u0CA6\u0CB8\u0CCD\u0CAF\u0CA4\u0CCD\u0CB5 \u0CAA\u0CCD\u0CB0\u0CAE\u0CBE\u0CA3\u0CAA\u0CA4\u0CCD\u0CB0.',
    // ಸೂಚನೆ: ಶಾಶ್ವತ ಸೇವಾ ಸದಸ್ಯತ್ವವು ಒಳಗೊಂಡಿರುವುದು 1. ದೈನಂದಿನ ಅರ್ಚನೆಯಲ್ಲಿ ಹೆಸರು ಸೇರ್ಪಡೆ, 2. ಆಯ್ಕೆ ಮಾಡಿದ ದಿನಾಂಕಗಳಲ್ಲಿ ವಿಶೇಷ ಪೂಜೆ/ಅರ್ಚನೆ ಮತ್ತು ಪ್ರಸಾದ ವಿತರಣೆ, 3. ಹೋಮ ಅಥವಾ ವಿಶೇಷ ಪೂಜೆಯಲ್ಲಿ ಭಾಗವಹಿಸಲು ವಾರ್ಷಿಕ ಅವಕಾಶ, 4. ಹಬ್ಬ ಮತ್ತು ಪೂಜೆ ಸೂಚನೆಗಳು (ಸೂಚನೆ ಮಾತ್ರ), 5. ದೇವಸ್ಥಾನದಿಂದ ವಿಶೇಷ ಆಶೀರ್ವಾದ ಪತ್ರ, ಮತ್ತು 6. ಡಿಜಿಟಲ್ ಸದಸ್ಯತ್ವ ಪ್ರಮಾಣಪತ್ರ.
    custom: '',
  };
  return n[pt] || '';
}

// ======================================================================
//  English → Kannada phonetic transliteration
// ======================================================================

/**
 * Converts English (Latin) text to approximate Kannada script using
 * phonetic mapping.  Numbers, punctuation, and already-Kannada text
 * are preserved unchanged.
 *
 * Examples:  Sujith → ಸುಜಿಥ್,  Lakshmi → ಲಕ್ಷ್ಮಿ,  Nandini → ನಂದಿನಿ
 */
function transliterateToKannada(text) {
  if (!text) return '';
  // Already contains Kannada characters — return as-is
  if (/[\u0C80-\u0CFF]/.test(text)) return text;

  const VIRAMA = '\u0CCD'; // ್

  // --- Consonant map (longest keys checked first) ---
  const C = {
    'ksh': '\u0C95\u0CCD\u0CB7',   // ಕ್ಷ
    'chh': '\u0C9B',                // ಛ
    'nch': '\u0C82\u0C9A',          // ಂಚ
    'jn':  '\u0C9C\u0CCD\u0C9E',   // ಜ್ಞ
    'gn':  '\u0C9C\u0CCD\u0C9E',   // ಜ್ಞ
    'kh':  '\u0C96',   // ಖ
    'gh':  '\u0C98',   // ಘ
    'ch':  '\u0C9A',   // ಚ
    'jh':  '\u0C9D',   // ಝ
    'th':  '\u0CA5',   // ಥ
    'dh':  '\u0CA7',   // ಧ
    'ph':  '\u0CAB',   // ಫ
    'bh':  '\u0CAD',   // ಭ
    'sh':  '\u0CB6',   // ಶ
    'nk':  '\u0C82\u0C95', // ಂಕ
    'ng':  '\u0C82\u0C97', // ಂಗ
    'nj':  '\u0C82\u0C9C', // ಂಜ
    'nt':  '\u0C82\u0CA4', // ಂತ
    'nd':  '\u0C82\u0CA6', // ಂದ
    'mp':  '\u0C82\u0CAA', // ಂಪ
    'mb':  '\u0C82\u0CAC', // ಂಬ
    'k':   '\u0C95',   // ಕ
    'g':   '\u0C97',   // ಗ
    'c':   '\u0C9A',   // ಚ
    'j':   '\u0C9C',   // ಜ
    't':   '\u0CA4',   // ತ
    'd':   '\u0CA6',   // ದ
    'n':   '\u0CA8',   // ನ
    'p':   '\u0CAA',   // ಪ
    'f':   '\u0CAB',   // ಫ
    'b':   '\u0CAC',   // ಬ
    'm':   '\u0CAE',   // ಮ
    'y':   '\u0CAF',   // ಯ
    'r':   '\u0CB0',   // ರ
    'l':   '\u0CB2',   // ಲ
    'v':   '\u0CB5',   // ವ
    'w':   '\u0CB5',   // ವ
    's':   '\u0CB8',   // ಸ
    'h':   '\u0CB9',   // ಹ
    'z':   '\u0C9C',   // ಜ
    'q':   '\u0C95',   // ಕ
  };

  // --- Vowel map: [independent form, dependent/matra form] ---
  const V = {
    'aa': ['\u0C86', '\u0CBE'],   // ಆ / ಾ
    'ee': ['\u0C88', '\u0CC0'],   // ಈ / ೀ
    'ii': ['\u0C88', '\u0CC0'],   // ಈ / ೀ
    'oo': ['\u0C8A', '\u0CC2'],   // ಊ / ೂ
    'uu': ['\u0C8A', '\u0CC2'],   // ಊ / ೂ
    'ai': ['\u0C90', '\u0CC8'],   // ಐ / ೈ
    'au': ['\u0C94', '\u0CCC'],   // ಔ / ೌ
    'ou': ['\u0C93', '\u0CCB'],   // ಓ / ೋ
    'ei': ['\u0C8F', '\u0CC7'],   // ಏ / ೇ
    'oa': ['\u0C93', '\u0CCB'],   // ಓ / ೋ
    'a':  ['\u0C85', ''],         // ಅ / (inherent — no matra)
    'i':  ['\u0C87', '\u0CBF'],   // ಇ / ಿ
    'u':  ['\u0C89', '\u0CC1'],   // ಉ / ು
    'e':  ['\u0C8E', '\u0CC6'],   // ಎ / ೆ
    'o':  ['\u0C92', '\u0CCA'],   // ಒ / ೊ
  };

  // Pre-sort keys longest-first for greedy matching
  const cKeys = Object.keys(C).sort((a, b) => b.length - a.length);
  const vKeys = Object.keys(V).sort((a, b) => b.length - a.length);

  /** Convert a single English word to Kannada script */
  function convert(word) {
    const w = word.toLowerCase();
    let out = '';
    let i = 0;
    let ac = false; // after-consonant flag

    while (i < w.length) {
      let hit = false;

      // 1. Try consonant match (longest key first)
      for (const k of cKeys) {
        if (i + k.length <= w.length && w.substring(i, i + k.length) === k) {
          if (ac) out += VIRAMA; // conjunct: add virama before this consonant
          out += C[k];
          ac = true;
          i += k.length;
          hit = true;
          break;
        }
      }
      if (hit) continue;

      // 2. Try vowel match (longest key first)
      for (const k of vKeys) {
        if (i + k.length <= w.length && w.substring(i, i + k.length) === k) {
          out += ac ? V[k][1] : V[k][0]; // matra if after consonant, else independent
          ac = false;
          i += k.length;
          hit = true;
          break;
        }
      }
      if (hit) continue;

      // 3. Unknown character — pass through as-is
      ac = false;
      out += word[i];
      i++;
    }

    // Word-final consonant: add virama to suppress inherent 'a'
    if (ac) out += VIRAMA;
    return out;
  }

  // Only transliterate alphabetic runs; preserve numbers, spaces, punctuation
  return text.replace(/[a-zA-Z]+/g, convert);
}

// ======================================================================
//  Shared drawing functions
// ======================================================================

/** Draw full-page background image (includes header + watermark) */
function drawBackground(doc) {
  try {
    if (fs.existsSync(RECEIPT_BG_PATH)) {
      doc.image(RECEIPT_BG_PATH, 0, 0, { width: PAGE_W, height: PAGE_H });
      return true; // background drawn successfully
    }
  } catch (_) { /* fallback to manual drawing */ }
  return false;
}

/** Draw the watermark background (fallback when no background image) */
function drawWatermark(doc) {
  try {
    if (fs.existsSync(WATERMARK_PATH)) {
      doc.opacity(0.08);
      doc.image(WATERMARK_PATH, (PAGE_W - 340) / 2, (PAGE_H - 480) / 2 + 40, { width: 340, height: 480 });
      doc.opacity(1);
    }
  } catch (_) { /* optional */ }
}

/** Draw the common saffron header bar with logo, temple name, address (fallback when no background image) */
function drawHeader(doc, hasKannadaFont, logoEndX) {
  // Header background
  doc.rect(0, 0, PAGE_W, 82).fill('#FFF3E0');

  // Gold & saffron lines
  doc.moveTo(0, 82).lineTo(PAGE_W, 82).lineWidth(2.5).strokeColor(GOLD_HEX).stroke();
  doc.moveTo(0, 85).lineTo(PAGE_W, 85).lineWidth(0.5).strokeColor(SAFFRON_HEX).stroke();

  // Goddess logo
  try {
    if (fs.existsSync(GODDESS_LOGO_PATH)) {
      doc.image(GODDESS_LOGO_PATH, 12, 5, { width: 55, height: 72 });
    }
  } catch (_) { /* optional */ }

  // Regd.no
  doc.fontSize(7).fillColor(DARK_BROWN_HEX).font('Helvetica')
    .text('Regd.no: KRI-4-00406-2019-20', RIGHT - 140, 8, { width: 140, align: 'right' });

  // Temple name English
  doc.fontSize(15).fillColor(MAROON_HEX).font('Helvetica-Bold')
    .text('SHREE SAMRAJYALAKSHMI TEMPLE', logoEndX, 10, { width: PAGE_W - logoEndX - 160, align: 'center' });

  // Temple name Kannada
  if (hasKannadaFont) {
    doc.fontSize(12).font('Kannada').fillColor(MAROON_HEX)
      .text('\u0CB6\u0CCD\u0CB0\u0CC0 \u0CB8\u0CBE\u0CAE\u0CCD\u0CB0\u0CBE\u0C9C\u0CB2\u0C95\u0CCD\u0CB7\u0CCD\u0CAE\u0CBF \u0CA6\u0CC7\u0CB5\u0CBE\u0CB2\u0CAF',
        logoEndX, 28, { width: PAGE_W - logoEndX - 160, align: 'center' });
  }

  const subY = hasKannadaFont ? 43 : 30;
  doc.fontSize(7).fillColor(DARK_BROWN_HEX).font('Helvetica-Oblique')
    .text('(Managed & Administered by Shree Samrajyalakshmi Maha Samsthanam)', logoEndX, subY, { width: PAGE_W - logoEndX - 160, align: 'center' });

  doc.fontSize(7).font('Helvetica').fillColor(DARK_BROWN_HEX)
    .text('Thonachagondanahalli Village, Madhugiri Taluk, Karnataka (Bharat) - 572112', logoEndX, subY + 11, { width: PAGE_W - logoEndX - 160, align: 'center' });

  doc.fontSize(6.5).font('Helvetica').fillColor('#0000CC')
    .text('Website: www.samrajyalakshmitemple.org | Email: samrajyalakshmitemple@gmail.com', logoEndX, subY + 22, { width: PAGE_W - logoEndX - 160, align: 'center', underline: true });
}

/** Draw payment method checkboxes with green tick. Optional fontOverride for Kannada rendering. */
function drawPaymentCheckboxes(doc, currentY, selectedMethod, labels, fontOverride) {
  const labelBoldFont = fontOverride || 'Helvetica-Bold';
  const labelNormalFont = fontOverride || 'Helvetica';

  doc.fontSize(10).fillColor('#000000').font(labelBoldFont)
    .text(labels.modeLabel + ' ', LEFT, currentY, { continued: false });

  doc.font(labelBoldFont).fontSize(10);
  let pmX = LEFT + doc.widthOfString(labels.modeLabel + ' ') + 5;
  labels.methods.forEach((pm) => {
    const sel = selectedMethod === pm.key;

    doc.save();
    doc.rect(pmX, currentY + 1, 10, 10).lineWidth(0.8).strokeColor('#000000').stroke();
    if (sel) {
      doc.save();
      doc.moveTo(pmX + 2, currentY + 6).lineTo(pmX + 4.5, currentY + 9).lineTo(pmX + 9, currentY + 3)
        .lineWidth(2).lineJoin('round').lineCap('round').strokeColor('#1B8A2A').stroke();
      doc.restore();
    }
    doc.restore();

    const methodFont = sel ? labelBoldFont : labelNormalFont;
    doc.fontSize(8.5).font(methodFont).fillColor('#000000')
      .text(pm.label, pmX + 13, currentY + 1, { continued: false });
    doc.font(methodFont).fontSize(8.5);
    pmX += 13 + doc.widthOfString(pm.label) + 12;
  });
}

// ======================================================================
//  PAGE 1 — ENGLISH RECEIPT
// ======================================================================

function drawEnglishPage(doc, data, hasKannadaFont) {
  const logoEndX = fs.existsSync(GODDESS_LOGO_PATH) ? 72 : 45;

  // Try full-page background image first, fallback to manual header + watermark
  const hasBg = drawBackground(doc);
  if (!hasBg) {
    drawWatermark(doc);
    drawHeader(doc, hasKannadaFont, logoEndX);
  }

  // RECEIPT title — push down if background image is used (header is taller)
  let y = hasBg ? 140 : 102;
  doc.fontSize(14).fillColor(MAROON_HEX).font('Helvetica-Bold')
    .text('RECEIPT', 0, y, { width: PAGE_W, align: 'center', underline: true });

  // Receipt No & Date
  y += 28;
  doc.fontSize(10).fillColor('#000000').font('Helvetica-Bold')
    .text('Receipt No: ', LEFT, y, { continued: true }).font('Helvetica').text(data.transaction_id || 'N/A');
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000')
    .text('Date: ' + formatDate(data.created_at || new Date().toISOString()), 0, y, { width: RIGHT, align: 'right' });

  // Devotee Details
  y += 30;
  doc.fontSize(11).fillColor(MAROON_HEX).font('Helvetica-Bold')
    .text('Devotee Details', LEFT, y, { underline: true });

  y += 20;
  const vx = LEFT + 135;
  function field(label, val, fy) {
    doc.fontSize(10).fillColor('#000000').font('Helvetica-Bold').text(label, LEFT, fy);
    doc.fontSize(10).font('Helvetica').text(val || '\u2014', vx, fy, { width: CONTENT_W - 135 });
    // Return the bottom Y so we can handle multi-line wrapping
    return Math.max(fy + 14, doc.y);
  }

  y = field('Devotee Name:', data.full_name, y) + 4;
  y = field('Gotra:', data.gotra, y) + 4;
  y = field('Nakshatra:', data.nakshatra, y) + 4;
  const addr = [data.address, data.city, data.state, data.pincode].filter(Boolean).join(', ');
  y = field('Address:', addr, y) + 4;
  y = field('Mobile No:', data.phone, y) + 4;
  y = field('Email ID:', data.email, y) + 4;

  // Transaction Reference
  y += 6;
  doc.fontSize(10).fillColor('#000000').font('Helvetica-Bold')
    .text('Transaction Reference No: ', LEFT, y, { continued: true }).font('Helvetica').text(data.transaction_id || 'N/A');

  // Mode of Payment
  y += 24;
  drawPaymentCheckboxes(doc, y, data.payment_method, {
    modeLabel: 'Mode of Payment:',
    methods: [
      { key: 'cash', label: 'Cash' }, { key: 'upi', label: 'UPI' },
      { key: 'debit_card', label: 'Debit/Credit Card' }, { key: 'direct_transfer', label: 'Bank Transfer' },
      { key: 'cheque_dd', label: 'Cheque/DD' },
    ],
  });

  // Amount
  y += 28;
  const amt = Number(data.amount);
  const sevaName = data.plan_name || getPlanDisplayName(data.plan_type);
  doc.fontSize(10).fillColor('#000000').font('Helvetica-Bold')
    .text('Amount: ', LEFT, y, { continued: true }).font('Helvetica')
    .text(`Rs. ${amt.toLocaleString('en-IN')}  (In words: ${numberToWords(amt)} Rupees only)`, { width: CONTENT_W });

  y += 18;
  doc.fontSize(10).font('Helvetica')
    .text('is received as a voluntary devotional contribution towards ', LEFT, y, { continued: true, width: CONTENT_W })
    .font('Helvetica-Bold').text(sevaName, { continued: true })
    .font('Helvetica').text(' Seva/Temple Activities of Shree Samrajyalakshmi Temple.', { width: CONTENT_W });

  // Custom Seva Notes / Remarks (entered by admin)
  if (data.seva_notes && data.seva_notes.trim()) {
    y = doc.y + 14;
    doc.fontSize(10).fillColor('#000000').font('Helvetica-Bold')
      .text('Remarks: ', LEFT, y, { continued: true })
      .font('Helvetica-Oblique')
      .text(data.seva_notes.trim(), { width: CONTENT_W - 70 });
  }

  // Seva Note (plan-specific inclusions)
  const sevaNote = getSevaNote(data.plan_type);
  if (sevaNote) {
    y = doc.y + 16;
    doc.fontSize(8).fillColor(DARK_BROWN_HEX).font('Helvetica-Oblique')
      .text(sevaNote, LEFT, y, { width: CONTENT_W, lineGap: 2 });
  }

  // Blessing
  y = Math.max(doc.y + 30, 640);
  doc.fontSize(10).fillColor(MAROON_HEX).font('Helvetica-Bold')
    .text('May Goddess Shree Samrajyalakshmi Devi shower her divine blessings upon', 0, y, { width: PAGE_W, align: 'center' });
  y += 16;
  doc.text('the devotee and family, granting health, prosperity, peace, and spiritual well-being.', 0, y, { width: PAGE_W, align: 'center' });

  // Footer
  doc.fontSize(7.5).fillColor('#666666').font('Helvetica-Oblique')
    .text('**************  This is a computer-generated receipt and does not require any physical signature.  **************',
      0, PAGE_H - 50, { width: PAGE_W, align: 'center' });
}

// ======================================================================
//  PAGE 2 — KANNADA RECEIPT (ರಶೀದಿ)
// ======================================================================

function drawKannadaPage(doc, data, hasKannadaFont) {
  const logoEndX = fs.existsSync(GODDESS_LOGO_PATH) ? 72 : 45;
  const KF = hasKannadaFont ? 'Kannada' : 'Helvetica-Bold';

  // Try full-page background image first, fallback to manual header + watermark
  const hasBg = drawBackground(doc);
  if (!hasBg) {
    drawWatermark(doc);
    drawHeader(doc, hasKannadaFont, logoEndX);
  }

  // ರಶೀದಿ title — push down if background image is used
  let y = hasBg ? 140 : 102;
  if (hasKannadaFont) {
    doc.fontSize(14).fillColor(MAROON_HEX).font(KF)
      .text('\u0CB0\u0CB6\u0CC0\u0CA6\u0CBF', 0, y, { width: PAGE_W, align: 'center', underline: true });
  } else {
    doc.fontSize(14).fillColor(MAROON_HEX).font('Helvetica-Bold')
      .text('RECEIPT', 0, y, { width: PAGE_W, align: 'center', underline: true });
  }

  // ರಶೀದಿ ಸಂಖ್ಯೆ & ದಿನಾಂಕ
  y += 28;
  if (hasKannadaFont) {
    doc.fontSize(10).fillColor('#000000').font(KF)
      .text('\u0CB0\u0CB6\u0CC0\u0CA6\u0CBF \u0CB8\u0C82\u0C96\u0CCD\u0CAF\u0CC6: ', LEFT, y, { continued: true })
      .font('Helvetica').text(data.transaction_id || 'N/A');
    doc.fontSize(10).font(KF).fillColor('#000000')
      .text('\u0CA6\u0CBF\u0CA8\u0CBE\u0C82\u0C95: ' + formatDate(data.created_at || new Date().toISOString()), 0, y, { width: RIGHT, align: 'right' });
  } else {
    doc.fontSize(10).fillColor('#000000').font('Helvetica-Bold')
      .text('Receipt No: ', LEFT, y, { continued: true }).font('Helvetica').text(data.transaction_id || 'N/A');
    doc.fontSize(10).font('Helvetica-Bold')
      .text('Date: ' + formatDate(data.created_at || new Date().toISOString()), 0, y, { width: RIGHT, align: 'right' });
  }

  // ಭಕ್ತರ ವಿವರಗಳು
  y += 30;
  if (hasKannadaFont) {
    doc.fontSize(11).fillColor(MAROON_HEX).font(KF)
      .text('\u0CAD\u0C95\u0CCD\u0CA4\u0CB0 \u0CB5\u0CBF\u0CB5\u0CB0\u0C97\u0CB3\u0CC1', LEFT, y, { underline: true });
  } else {
    doc.fontSize(11).fillColor(MAROON_HEX).font('Helvetica-Bold')
      .text('Devotee Details', LEFT, y, { underline: true });
  }

  y += 20;
  const vx = LEFT + 155;

  function kField(kanLabel, engLabel, val, fy) {
    const label = hasKannadaFont ? kanLabel : engLabel;
    doc.fontSize(10).fillColor('#000000').font(hasKannadaFont ? KF : 'Helvetica-Bold').text(label, LEFT, fy);
    const valStr = val || '\u2014';
    // Use Kannada font if the value contains Kannada characters
    const valFont = (hasKannadaFont && /[\u0C80-\u0CFF]/.test(valStr)) ? KF : 'Helvetica';
    doc.fontSize(10).font(valFont).text(valStr, vx, fy, { width: CONTENT_W - 155 });
    // Return the bottom Y so we can handle multi-line wrapping
    return Math.max(fy + 14, doc.y);
  }

  // Transliterate text fields to Kannada (only when Kannada font is available)
  const kanName = hasKannadaFont ? transliterateToKannada(data.full_name) : data.full_name;
  const kanGotra = hasKannadaFont ? transliterateToKannada(data.gotra) : data.gotra;
  const kanNakshatra = hasKannadaFont ? transliterateToKannada(data.nakshatra) : data.nakshatra;
  const addr = [data.address, data.city, data.state, data.pincode].filter(Boolean).join(', ');
  const kanAddr = hasKannadaFont ? transliterateToKannada(addr) : addr;

  // ಭಕ್ತರ ಹೆಸರು / Devotee Name
  y = kField('\u0CAD\u0C95\u0CCD\u0CA4\u0CB0 \u0CB9\u0CC6\u0CB8\u0CB0\u0CC1:', 'Devotee Name:', kanName, y) + 4;
  // ಗೋತ್ರ / Gotra
  y = kField('\u0C97\u0CCB\u0CA4\u0CCD\u0CB0:', 'Gotra:', kanGotra, y) + 4;
  // ನಕ್ಷತ್ರ / Nakshatra
  y = kField('\u0CA8\u0C95\u0CCD\u0CB7\u0CA4\u0CCD\u0CB0:', 'Nakshatra:', kanNakshatra, y) + 4;
  // ವಿಳಾಸ / Address
  y = kField('\u0CB5\u0CBF\u0CB3\u0CBE\u0CB8:', 'Address:', kanAddr, y) + 4;
  // ಮೊಬೈಲ್ ಸಂಖ್ಯೆ / Mobile No  (keep in digits — no transliteration)
  y = kField('\u0CAE\u0CCA\u0CAC\u0CC8\u0CB2\u0CCD \u0CB8\u0C82\u0C96\u0CCD\u0CAF\u0CC6:', 'Mobile No:', data.phone, y) + 4;
  // ಇಮೇಲ್ ಐಡಿ / Email ID  (keep in English — no transliteration)
  y = kField('\u0C87\u0CAE\u0CC7\u0CB2\u0CCD \u0C90\u0CA1\u0CBF:', 'Email ID:', data.email, y) + 4;

  // ವ್ಯವಹಾರ ಉಲ್ಲೇಖ ಸಂಖ್ಯೆ / Transaction Reference No
  y += 6;
  if (hasKannadaFont) {
    doc.fontSize(10).fillColor('#000000').font(KF)
      .text('\u0CB5\u0CCD\u0CAF\u0CB5\u0CB9\u0CBE\u0CB0 \u0C89\u0CB2\u0CCD\u0CB2\u0CC7\u0C96 \u0CB8\u0C82\u0C96\u0CCD\u0CAF\u0CC6: ', LEFT, y, { continued: true })
      .font('Helvetica').text(data.transaction_id || 'N/A');
  } else {
    doc.fontSize(10).fillColor('#000000').font('Helvetica-Bold')
      .text('Transaction Reference No: ', LEFT, y, { continued: true }).font('Helvetica').text(data.transaction_id || 'N/A');
  }

  // ಪಾವತಿ ವಿಧಾನ / Mode of Payment
  y += 24;
  if (hasKannadaFont) {
    drawPaymentCheckboxes(doc, y, data.payment_method, {
      modeLabel: '\u0CAA\u0CBE\u0CB5\u0CA4\u0CBF \u0CB5\u0CBF\u0CA7\u0CBE\u0CA8:', // ಪಾವತಿ ವಿಧಾನ:
      methods: [
        { key: 'cash', label: '\u0CA8\u0C97\u0CA6\u0CC1' },           // ನಗದು
        { key: 'upi', label: '\u0CAF\u0CC1\u0CAA\u0CBF\u0C90' },     // ಯುಪಿಐ
        { key: 'debit_card', label: '\u0CA1\u0CC6\u0CAC\u0CBF\u0C9F\u0CCD/\u0C95\u0CCD\u0CB0\u0CC6\u0CA1\u0CBF\u0C9F\u0CCD \u0C95\u0CBE\u0CB0\u0CCD\u0CA1\u0CCD' }, // ಡೆಬಿಟ್/ಕ್ರೆಡಿಟ್ ಕಾರ್ಡ್
        { key: 'direct_transfer', label: '\u0CAC\u0CCD\u0CAF\u0CBE\u0C82\u0C95\u0CCD \u0CB5\u0CB0\u0CCD\u0C97\u0CBE\u0CB5\u0CA3\u0CC6' }, // ಬ್ಯಾಂಕ್ ವರ್ಗಾವಣೆ
        { key: 'cheque_dd', label: '\u0C9A\u0CC6\u0C95\u0CCD/\u0CA1\u0CBF\u0CA1\u0CBF' },    // ಚೆಕ್/ಡಿಡಿ
      ],
    }, KF);
  } else {
    drawPaymentCheckboxes(doc, y, data.payment_method, {
      modeLabel: 'Mode of Payment:',
      methods: [
        { key: 'cash', label: 'Cash' }, { key: 'upi', label: 'UPI' },
        { key: 'debit_card', label: 'Debit/Credit Card' }, { key: 'direct_transfer', label: 'Bank Transfer' },
        { key: 'cheque_dd', label: 'Cheque/DD' },
      ],
    });
  }

  // ಮೊತ್ತ / Amount
  y += 28;
  const amt = Number(data.amount);
  const sevaNameKn = hasKannadaFont ? (getPlanDisplayNameKannada(data.plan_type) || data.plan_name || getPlanDisplayName(data.plan_type)) : null;
  const sevaName = data.plan_name || getPlanDisplayName(data.plan_type);

  if (hasKannadaFont) {
    // ಮೊತ್ತ: ರೂ. X,XXX (ಅಕ್ಷರಗಳಲ್ಲಿ: ... ರೂಪಾಯಿಗಳು ಮಾತ್ರ)
    doc.fontSize(10).fillColor('#000000').font(KF)
      .text('\u0CAE\u0CCA\u0CA4\u0CCD\u0CA4: ', LEFT, y, { continued: true }) // ಮೊತ್ತ:
      .text('\u0CB0\u0CC2. ' + amt.toLocaleString('en-IN') + '  (\u0C85\u0C95\u0CCD\u0CB7\u0CB0\u0C97\u0CB3\u0CB2\u0CCD\u0CB2\u0CBF: ' + numberToKannadaWords(amt) + ' \u0CB0\u0CC2\u0CAA\u0CBE\u0CAF\u0CBF\u0C97\u0CB3\u0CC1 \u0CAE\u0CBE\u0CA4\u0CCD\u0CB0)', { width: CONTENT_W });
      // ರೂ. ... (ಅಕ್ಷರಗಳಲ್ಲಿ: ... ರೂಪಾಯಿಗಳು ಮಾತ್ರ)
  } else {
    doc.fontSize(10).fillColor('#000000').font('Helvetica-Bold')
      .text('Amount: ', LEFT, y, { continued: true })
      .font('Helvetica')
      .text(`Rs. ${amt.toLocaleString('en-IN')}  (In words: ${numberToWords(amt)} Rupees only)`, { width: CONTENT_W });
  }

  // Contribution text — Kannada paragraph
  y += 18;
  if (hasKannadaFont) {
    doc.fontSize(10).font(KF).fillColor('#000000')
      .text(sevaNameKn + ' \u0CB6\u0CCD\u0CB0\u0CC0 \u0CB8\u0CBE\u0CAE\u0CCD\u0CB0\u0CBE\u0C9C\u0CCD\u0CAF\u0CB2\u0C95\u0CCD\u0CB7\u0CCD\u0CAE\u0CBF \u0CA6\u0CC7\u0CB5\u0CB8\u0CCD\u0CA5\u0CBE\u0CA8\u0CA6 \u0CB8\u0CC7\u0CB5\u0CC6/\u0CA6\u0CC7\u0CB5\u0CBE\u0CB2\u0CAF \u0C9A\u0C9F\u0CC1\u0CB5\u0C9F\u0CBF\u0C95\u0CC6\u0C97\u0CB3\u0CBF\u0C97\u0CC6 \u0CB8\u0CCD\u0CB5\u0CAF\u0C82\u0CAA\u0CCD\u0CB0\u0CC7\u0CB0\u0CBF\u0CA4 \u0CAD\u0C95\u0CCD\u0CA4\u0CBF \u0C95\u0CCA\u0CA1\u0CC1\u0C97\u0CC6\u0CAF\u0CBE\u0C97\u0CBF \u0CB8\u0CCD\u0CB5\u0CC0\u0C95\u0CB0\u0CBF\u0CB8\u0CB2\u0CBE\u0C97\u0CBF\u0CA6\u0CC6.',
        LEFT, y, { width: CONTENT_W });
  } else {
    doc.fontSize(10).font('Helvetica')
      .text('is received as a voluntary devotional contribution towards ', LEFT, y, { continued: true, width: CONTENT_W })
      .font('Helvetica-Bold').text(sevaName, { continued: true })
      .font('Helvetica').text(' Seva/Temple Activities of Shree Samrajyalakshmi Temple.', { width: CONTENT_W });
  }

  // Custom Seva Notes / Remarks (entered by admin)
  if (data.seva_notes && data.seva_notes.trim()) {
    y = doc.y + 14;
    if (hasKannadaFont) {
      const kanRemarks = transliterateToKannada(data.seva_notes.trim());
      doc.fontSize(10).fillColor('#000000').font(KF)
        .text('\u0C9F\u0CBF\u0CAA\u0CCD\u0CAA\u0CA3\u0CBF\u0C97\u0CB3\u0CC1: ', LEFT, y, { continued: true }) // ಟಿಪ್ಪಣಿಗಳು:
        .text(kanRemarks, { width: CONTENT_W - 90 });
    } else {
      doc.fontSize(10).fillColor('#000000').font('Helvetica-Bold')
        .text('Remarks: ', LEFT, y, { continued: true })
        .font('Helvetica-Oblique')
        .text(data.seva_notes.trim(), { width: CONTENT_W - 70 });
    }
  }

  // Seva Note (plan-specific inclusions) — Kannada note on Kannada page
  if (hasKannadaFont) {
    const sevaNoteKn = getSevaNoteKannada(data.plan_type);
    if (sevaNoteKn) {
      y = doc.y + 16;
      doc.fontSize(8).fillColor(DARK_BROWN_HEX).font(KF)
        .text(sevaNoteKn, LEFT, y, { width: CONTENT_W, lineGap: 2 });
    }
  } else {
    const sevaNote = getSevaNote(data.plan_type);
    if (sevaNote) {
      y = doc.y + 16;
      doc.fontSize(8).fillColor(DARK_BROWN_HEX).font('Helvetica-Oblique')
        .text(sevaNote, LEFT, y, { width: CONTENT_W, lineGap: 2 });
    }
  }

  // Blessing in Kannada
  y = Math.max(doc.y + 30, 640);
  if (hasKannadaFont) {
    doc.fontSize(10).fillColor(MAROON_HEX).font(KF)
      .text('\u0CB6\u0CCD\u0CB0\u0CC0 \u0CB8\u0CBE\u0CAE\u0CCD\u0CB0\u0CBE\u0C9C\u0CCD\u0CAF\u0CB2\u0C95\u0CCD\u0CB7\u0CCD\u0CAE\u0CBF \u0CA6\u0CC7\u0CB5\u0CBF\u0CAF\u0CC1 \u0CAD\u0C95\u0CCD\u0CA4 \u0CAE\u0CA4\u0CCD\u0CA4\u0CC1 \u0C95\u0CC1\u0C9F\u0CC1\u0C82\u0CAC\u0CA6 \u0CAE\u0CC7\u0CB2\u0CC6 \u0CA4\u0CA8\u0CCD\u0CA8 \u0CA6\u0CC8\u0CB5\u0CBF\u0C95',
        0, y, { width: PAGE_W, align: 'center' });
    y += 16;
    doc.text('\u0C86\u0CB6\u0CC0\u0CB0\u0CCD\u0CB5\u0CBE\u0CA6\u0CB5\u0CA8\u0CCD\u0CA8\u0CC1 \u0CB8\u0CC1\u0CB0\u0CBF\u0CB8\u0CB2\u0CBF, \u0C85\u0CA6\u0CC1 \u0C86\u0CB0\u0CCB\u0C97\u0CCD\u0CAF, \u0CB8\u0CAE\u0CC3\u0CA6\u0CCD\u0CA7\u0CBF, \u0CB6\u0CBE\u0C82\u0CA4\u0CBF \u0CAE\u0CA4\u0CCD\u0CA4\u0CC1 \u0C86\u0CA7\u0CCD\u0CAF\u0CBE\u0CA4\u0CCD\u0CAE\u0CBF\u0C95',
      0, y, { width: PAGE_W, align: 'center' });
    y += 16;
    doc.text('\u0CAF\u0CCB\u0C97\u0C95\u0CCD\u0CB7\u0CC7\u0CAE\u0CB5\u0CA8\u0CCD\u0CA8\u0CC1 \u0CA8\u0CC0\u0CA1\u0CC1\u0CA4\u0CCD\u0CA4\u0CA6\u0CC6.',
      0, y, { width: PAGE_W, align: 'center' });
  } else {
    doc.fontSize(10).fillColor(MAROON_HEX).font('Helvetica-Bold')
      .text('May Goddess Shree Samrajyalakshmi Devi shower her divine blessings upon', 0, y, { width: PAGE_W, align: 'center' });
    y += 16;
    doc.text('the devotee and family, granting health, prosperity, peace, and spiritual well-being.', 0, y, { width: PAGE_W, align: 'center' });
  }

  // Footer in Kannada
  if (hasKannadaFont) {
    doc.fontSize(7).fillColor('#666666').font(KF)
      .text('***************\u0C87\u0CA6\u0CC1 \u0C95\u0C82\u0CAA\u0CCD\u0CAF\u0CC2\u0C9F\u0CB0\u0CCD-\u0CB0\u0C9A\u0CBF\u0CA4 \u0CB0\u0CB6\u0CC0\u0CA6\u0CBF\u0CAF\u0CBE\u0C97\u0CBF\u0CA6\u0CCD\u0CA6\u0CC1, \u0CAF\u0CBE\u0CB5\u0CC1\u0CA6\u0CC7 \u0CAD\u0CCC\u0CA4\u0CBF\u0C95 \u0CB8\u0CB9\u0CBF \u0C85\u0C97\u0CA4\u0CCD\u0CAF\u0CB5\u0CBF\u0CB2\u0CCD\u0CB2.****************',
        0, PAGE_H - 50, { width: PAGE_W, align: 'center' });
  } else {
    doc.fontSize(7.5).fillColor('#666666').font('Helvetica-Oblique')
      .text('**************  This is a computer-generated receipt and does not require any physical signature.  **************',
        0, PAGE_H - 50, { width: PAGE_W, align: 'center' });
  }
}

// ======================================================================
//  MAIN: Generate 2-page receipt (English + Kannada)
// ======================================================================

function generateReceipt(data) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 30, bottom: 30, left: 40, right: 40 },
        info: {
          Title: `Seva Receipt - ${data.transaction_id || 'Receipt'}`,
          Author: 'Shree Samrajyalakshmi Temple',
          Subject: 'Seva Receipt',
          Creator: 'SSLT Seva Management System',
        },
      });

      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Register custom fonts
      let hasKannadaFont = false;
      try {
        if (fs.existsSync(KANNADA_FONT_PATH)) {
          doc.registerFont('Kannada', KANNADA_FONT_PATH);
          hasKannadaFont = true;
        }
      } catch (e) { console.warn('Kannada font not available:', e.message); }

      try {
        if (fs.existsSync(NOTO_SANS_PATH)) {
          doc.registerFont('NotoSans', NOTO_SANS_PATH);
        }
      } catch (e) { /* optional */ }

      // ========== PAGE 1: ENGLISH ==========
      drawEnglishPage(doc, data, hasKannadaFont);

      // ========== PAGE 2: KANNADA ==========
      doc.addPage({
        size: 'A4',
        margins: { top: 30, bottom: 30, left: 40, right: 40 },
      });
      drawKannadaPage(doc, data, hasKannadaFont);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generateReceipt, formatCurrency, formatDate, getPlanDisplayName, getPaymentMethodName };
