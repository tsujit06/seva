const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// Asset paths
const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const GODDESS_LOGO_PATH = path.join(ASSETS_DIR, 'goddess-logo.png');
const WATERMARK_PATH = path.join(ASSETS_DIR, 'watermark.png');
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

function getPlanDisplayName(pt) {
  return { archana: 'Archana Seva', sahasranama: 'Sahasranama Seva', nitya_archana: 'Nitya Archana Seva', saswatha: 'Saswatha Seva Membership', custom: 'Custom Seva / Donation' }[pt] || pt;
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

// ======================================================================
//  Shared drawing functions
// ======================================================================

/** Draw the watermark background */
function drawWatermark(doc) {
  try {
    if (fs.existsSync(WATERMARK_PATH)) {
      doc.opacity(0.08);
      doc.image(WATERMARK_PATH, (PAGE_W - 340) / 2, (PAGE_H - 480) / 2 + 40, { width: 340, height: 480 });
      doc.opacity(1);
    }
  } catch (_) { /* optional */ }
}

/** Draw the common saffron header bar with logo, temple name, address */
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

/** Draw payment method checkboxes with green tick */
function drawPaymentCheckboxes(doc, currentY, selectedMethod, labels) {
  doc.fontSize(10).fillColor('#000000').font('Helvetica-Bold')
    .text(labels.modeLabel + ' ', LEFT, currentY, { continued: false });

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

    doc.fontSize(8.5).font(sel ? 'Helvetica-Bold' : 'Helvetica').fillColor('#000000')
      .text(pm.label, pmX + 13, currentY + 1, { continued: false });
    pmX += 13 + doc.widthOfString(pm.label) + 12;
  });
}

// ======================================================================
//  PAGE 1 — ENGLISH RECEIPT
// ======================================================================

function drawEnglishPage(doc, data, hasKannadaFont) {
  const logoEndX = fs.existsSync(GODDESS_LOGO_PATH) ? 72 : 45;

  // Watermark
  drawWatermark(doc);

  // Header
  drawHeader(doc, hasKannadaFont, logoEndX);

  // RECEIPT title
  let y = 102;
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
  }

  field('Devotee Name:', data.full_name, y); y += 18;
  field('Gotra:', data.gotra, y); y += 18;
  field('Nakshatra:', data.nakshatra, y); y += 18;
  const addr = [data.address, data.city, data.state, data.pincode].filter(Boolean).join(', ');
  field('Address:', addr, y); y += 18;
  field('Mobile No:', data.phone, y); y += 18;
  field('Email ID:', data.email, y); y += 18;

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

  // Watermark
  drawWatermark(doc);

  // Header (same bilingual header)
  drawHeader(doc, hasKannadaFont, logoEndX);

  // ರಶೀದಿ title
  let y = 102;
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
    doc.fontSize(10).font('Helvetica').text(val || '\u2014', vx, fy, { width: CONTENT_W - 155 });
  }

  // ಭಕ್ತರ ಹೆಸರು / Devotee Name
  kField('\u0CAD\u0C95\u0CCD\u0CA4\u0CB0 \u0CB9\u0CC6\u0CB8\u0CB0\u0CC1:', 'Devotee Name:', data.full_name, y); y += 18;
  // ಗೋತ್ರ / Gotra
  kField('\u0C97\u0CCB\u0CA4\u0CCD\u0CB0:', 'Gotra:', data.gotra, y); y += 18;
  // ನಕ್ಷತ್ರ / Nakshatra
  kField('\u0CA8\u0C95\u0CCD\u0CB7\u0CA4\u0CCD\u0CB0:', 'Nakshatra:', data.nakshatra, y); y += 18;
  // ವಿಳಾಸ / Address
  const addr = [data.address, data.city, data.state, data.pincode].filter(Boolean).join(', ');
  kField('\u0CB5\u0CBF\u0CB3\u0CBE\u0CB8:', 'Address:', addr, y); y += 18;
  // ಮೊಬೈಲ್ ಸಂಖ್ಯೆ / Mobile No
  kField('\u0CAE\u0CCA\u0CAC\u0CC8\u0CB2\u0CCD \u0CB8\u0C82\u0C96\u0CCD\u0CAF\u0CC6:', 'Mobile No:', data.phone, y); y += 18;
  // ಇಮೇಲ್ ಐಡಿ / Email ID
  kField('\u0C87\u0CAE\u0CC7\u0CB2\u0CCD \u0C90\u0CA1\u0CBF:', 'Email ID:', data.email, y); y += 18;

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

  // ಪಾವತಿ ವಿಧಾನ / Mode of Payment — use English labels for consistent rendering
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

  // Amount label in Kannada, value in English — rendered separately to avoid font mixing
  doc.fontSize(10).fillColor('#000000').font('Helvetica-Bold')
    .text('Amount: ', LEFT, y, { continued: true })
    .font('Helvetica')
    .text(`Rs. ${amt.toLocaleString('en-IN')}  (In words: ${numberToWords(amt)} Rupees only)`, { width: CONTENT_W });

  // Contribution text — Kannada paragraph
  y += 18;
  if (hasKannadaFont) {
    doc.fontSize(10).font(KF).fillColor('#000000')
      .text(sevaName + ' \u0CB6\u0CCD\u0CB0\u0CC0 \u0CB8\u0CBE\u0CAE\u0CCD\u0CB0\u0CBE\u0C9C\u0CCD\u0CAF\u0CB2\u0C95\u0CCD\u0CB7\u0CCD\u0CAE\u0CBF \u0CA6\u0CC7\u0CB5\u0CB8\u0CCD\u0CA5\u0CBE\u0CA8\u0CA6 \u0CB8\u0CC7\u0CB5\u0CC6/\u0CA6\u0CC7\u0CB5\u0CBE\u0CB2\u0CAF \u0C9A\u0C9F\u0CC1\u0CB5\u0C9F\u0CBF\u0C95\u0CC6\u0C97\u0CB3\u0CBF\u0C97\u0CC6 \u0CB8\u0CCD\u0CB5\u0CAF\u0C82\u0CAA\u0CCD\u0CB0\u0CC7\u0CB0\u0CBF\u0CA4 \u0CAD\u0C95\u0CCD\u0CA4\u0CBF \u0C95\u0CCA\u0CA1\u0CC1\u0C97\u0CC6\u0CAF\u0CBE\u0C97\u0CBF \u0CB8\u0CCD\u0CB5\u0CC0\u0C95\u0CB0\u0CBF\u0CB8\u0CB2\u0CBE\u0C97\u0CBF\u0CA6\u0CC6.',
        LEFT, y, { width: CONTENT_W });
  } else {
    doc.fontSize(10).font('Helvetica')
      .text('is received as a voluntary devotional contribution towards ', LEFT, y, { continued: true, width: CONTENT_W })
      .font('Helvetica-Bold').text(sevaName, { continued: true })
      .font('Helvetica').text(' Seva/Temple Activities of Shree Samrajyalakshmi Temple.', { width: CONTENT_W });
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
