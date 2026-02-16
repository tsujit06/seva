const express = require('express');
const router = express.Router();
const db = require('../db');
const { generateReceipt } = require('../utils/pdf');
const { sendReceiptEmail } = require('../utils/email');
const { SEVA_PLANS } = require('../utils/plans');

/**
 * Admin authentication middleware
 */
function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).json({ success: false, error: 'Authentication required.' });
  }

  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
  const [username, password] = credentials.split(':');

  if (
    username === (process.env.ADMIN_USERNAME || 'admin') &&
    password === (process.env.ADMIN_PASSWORD || 'temple@admin123')
  ) {
    next();
  } else {
    res.status(401).json({ success: false, error: 'Invalid credentials.' });
  }
}

router.use(adminAuth);

/** POST /api/admin/login */
router.post('/login', (req, res) => {
  res.json({ success: true, message: 'Login successful.' });
});

/** GET /api/admin/dashboard */
router.get('/dashboard', (req, res) => {
  try {
    const stats = db.getDashboardStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, error: 'Failed to load dashboard.' });
  }
});

/** GET /api/admin/payments */
router.get('/payments', (req, res) => {
  try {
    const result = db.getFilteredPayments(req.query);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Admin payments error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch payments.' });
  }
});

/** PUT /api/admin/payments/:id/mark-cash-received */
router.put('/payments/:id/mark-cash-received', (req, res) => {
  try {
    const payment = db.getPayment(parseInt(req.params.id));
    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found.' });
    }
    if (payment.payment_method !== 'cash') {
      return res.status(400).json({ success: false, error: 'This is not a cash payment.' });
    }

    db.updatePayment(payment.id, { payment_status: 'completed', cash_received: 1 });
    db.updateMembershipStatus(payment.membership_id, 'active');

    res.json({ success: true, message: 'Cash payment marked as received. Membership activated.' });
  } catch (error) {
    console.error('Mark cash received error:', error);
    res.status(500).json({ success: false, error: 'Failed to update payment.' });
  }
});

/** POST /api/admin/payments/:id/resend-receipt */
router.post('/payments/:id/resend-receipt', async (req, res) => {
  try {
    const payment = db.getPaymentFull(parseInt(req.params.id));
    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found.' });
    }

    const pdfBuffer = await generateReceipt(payment);
    const emailResult = await sendReceiptEmail(
      payment.email, payment.full_name, payment.transaction_id, pdfBuffer
    );

    if (emailResult.success) {
      db.updatePayment(payment.id, { receipt_email_sent: 1 });
      res.json({ success: true, message: `Receipt resent to ${payment.email}` });
    } else {
      res.json({ success: false, error: `Email failed: ${emailResult.error}` });
    }
  } catch (error) {
    console.error('Resend receipt error:', error);
    res.status(500).json({ success: false, error: 'Failed to resend receipt.' });
  }
});

/** GET /api/admin/payments/:id/download-receipt */
router.get('/payments/:id/download-receipt', async (req, res) => {
  try {
    const payment = db.getPaymentFull(parseInt(req.params.id));
    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found.' });
    }

    const pdfBuffer = await generateReceipt(payment);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="SevaReceipt-${payment.transaction_id}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Download receipt error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate receipt.' });
  }
});

/**
 * POST /api/admin/create-entry
 * PRIMARY ENDPOINT — Admin creates a new devotee entry with payment details.
 * Transaction ID is manually entered by the admin (from actual payment receipt).
 */
router.post('/create-entry', async (req, res) => {
  try {
    const {
      full_name, email, phone, address, city, state, pincode, gotra, nakshatra,
      plan_type, plan_name, amount, payment_method, transaction_id,
      payment_status, seva_notes,
    } = req.body;

    // Validation
    if (!full_name || !phone || !plan_type || !amount || !payment_method) {
      return res.status(400).json({
        success: false,
        error: 'Devotee name, phone, seva type, amount, and payment method are required.',
      });
    }

    // Transaction ID is required for non-cash payments, optional for cash
    if (payment_method !== 'cash' && (!transaction_id || !transaction_id.trim())) {
      return res.status(400).json({
        success: false,
        error: 'Transaction ID is required for non-cash payments. Please enter the payment transaction/reference number.',
      });
    }

    // Generate a reference number for cash if not provided
    let finalTransactionId = transaction_id ? transaction_id.trim() : '';
    if (payment_method === 'cash' && !finalTransactionId) {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
      const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
      finalTransactionId = `CASH-${dateStr}-${rand}`;
    }

    // Check for duplicate transaction ID (only if one is provided)
    if (finalTransactionId) {
      const existingTxn = db.getPaymentByTxnId(finalTransactionId);
      if (existingTxn) {
        return res.status(400).json({
          success: false,
          error: `Transaction ID "${finalTransactionId}" already exists. Please check and enter a unique transaction ID.`,
        });
      }
    }

    const startDate = new Date().toISOString().split('T')[0];
    let endDate = null;
    let isLifetime = 0;

    if (plan_type === 'saswatha') {
      isLifetime = 1;
    } else if (plan_type !== 'custom') {
      const end = new Date();
      end.setFullYear(end.getFullYear() + 1);
      endDate = end.toISOString().split('T')[0];
    } else {
      // Custom — default to 1 year
      const end = new Date();
      end.setFullYear(end.getFullYear() + 1);
      endDate = end.toISOString().split('T')[0];
    }

    const planInfo = SEVA_PLANS[plan_type];
    const resolvedPlanName = plan_name || planInfo?.name || plan_type;
    const resolvedStatus = payment_status || 'completed';

    // Insert member
    const member = db.insertMember({
      full_name,
      email: email || '',
      phone,
      address: address || null,
      city: city || null,
      state: state || null,
      pincode: pincode || null,
      gotra: gotra || null,
      nakshatra: nakshatra || null,
    });

    // Insert membership
    const membership = db.insertMembership({
      member_id: member.id,
      plan_type,
      plan_name: resolvedPlanName,
      amount: parseFloat(amount),
      seva_notes: seva_notes || null,
      start_date: startDate,
      end_date: endDate,
      is_lifetime: isLifetime,
      status: resolvedStatus === 'completed' ? 'active' : 'pending',
    });

    // Insert payment with transaction ID (manually entered or auto-generated for cash)
    const payment = db.insertPayment({
      membership_id: membership.id,
      member_id: member.id,
      transaction_id: finalTransactionId,
      amount: parseFloat(amount),
      payment_method,
      payment_status: resolvedStatus,
      cash_received: (payment_method === 'cash' && resolvedStatus === 'completed') ? 1 : 0,
      notes: seva_notes || null,
    });

    res.json({
      success: true,
      data: {
        payment_id: payment.id,
        member_id: member.id,
        membership_id: membership.id,
        transaction_id: finalTransactionId,
        message: payment_method === 'cash' && !transaction_id
          ? `Entry created successfully for ${full_name}. Cash Reference: ${finalTransactionId}`
          : `Entry created successfully for ${full_name}. Transaction ID: ${finalTransactionId}`,
      },
    });
  } catch (error) {
    console.error('Create entry error:', error);
    res.status(500).json({ success: false, error: 'Failed to create entry. ' + error.message });
  }
});

/**
 * PUT /api/admin/payments/:id/update
 * Update payment details (e.g. change status, update notes)
 */
router.put('/payments/:id/update', (req, res) => {
  try {
    const payment = db.getPayment(parseInt(req.params.id));
    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found.' });
    }

    const { payment_status, notes } = req.body;
    const updates = {};

    if (payment_status) {
      updates.payment_status = payment_status;
      if (payment_status === 'completed') {
        updates.cash_received = payment.payment_method === 'cash' ? 1 : 0;
        db.updateMembershipStatus(payment.membership_id, 'active');
      }
    }
    if (notes !== undefined) {
      updates.notes = notes;
    }

    db.updatePayment(payment.id, updates);
    res.json({ success: true, message: 'Payment updated successfully.' });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({ success: false, error: 'Failed to update payment.' });
  }
});

/** GET /api/admin/export - Export ALL payments as CSV */
router.get('/export', (req, res) => {
  try {
    const payments = db.getAllPaymentsForExport(req.query);

    const headers = [
      'S.No',
      'Transaction ID',
      'Date',
      'Devotee Name',
      'Phone',
      'Email',
      'Gotra',
      'Nakshatra',
      'Address',
      'City',
      'State',
      'Pincode',
      'Seva Type',
      'Seva Plan',
      'Seva Notes',
      'Amount (₹)',
      'Payment Method',
      'Payment Status',
      'Cash Received',
      'Start Date',
      'End Date',
      'Lifetime Membership',
      'Receipt Sent',
      'Email Sent',
    ];

    let csv = '\uFEFF'; // BOM for Excel UTF-8 compatibility
    csv += headers.join(',') + '\n';

    payments.forEach((p, index) => {
      const row = [
        index + 1,
        `"${p.transaction_id || ''}"`,
        `"${p.created_at || ''}"`,
        `"${(p.full_name || '').replace(/"/g, '""')}"`,
        `"${p.phone || ''}"`,
        `"${p.email || ''}"`,
        `"${p.gotra || ''}"`,
        `"${p.nakshatra || ''}"`,
        `"${(p.address || '').replace(/"/g, '""')}"`,
        `"${p.city || ''}"`,
        `"${p.state || ''}"`,
        `"${p.pincode || ''}"`,
        `"${p.plan_type || ''}"`,
        `"${p.plan_name || ''}"`,
        `"${(p.seva_notes || '').replace(/"/g, '""')}"`,
        p.amount || 0,
        `"${p.payment_method || ''}"`,
        `"${p.payment_status || ''}"`,
        p.cash_received ? 'Yes' : 'No',
        `"${p.start_date || ''}"`,
        `"${p.end_date || 'N/A'}"`,
        p.is_lifetime ? 'Yes' : 'No',
        p.receipt_sent ? 'Yes' : 'No',
        p.receipt_email_sent ? 'Yes' : 'No',
      ];
      csv += row.join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="SSLT-Transactions-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ success: false, error: 'Failed to export data.' });
  }
});

module.exports = router;
