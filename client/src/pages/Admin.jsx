import React, { useState, useEffect, useCallback } from 'react';
import {
  adminLogin,
  adminLogout,
  getDashboard,
  getAdminPayments,
  adminCreateEntry,
  markCashReceived,
  updatePayment,
  adminDeleteEntry,
  adminResendReceipt,
  adminDownloadReceipt,
  exportPayments,
} from '../utils/api';

const METHOD_NAMES = {
  upi: 'UPI',
  cash: 'Cash',
  debit_card: 'Debit Card',
  net_banking: 'Net Banking',
  direct_transfer: 'Direct Account Transfer',
};

const PLAN_OPTIONS = [
  { value: 'archana', label: 'Archana Seva — ₹1,251/year', amount: 1251 },
  { value: 'sahasranama', label: 'Sahasranama Seva — ₹5,400/year', amount: 5400 },
  { value: 'nitya_archana', label: 'Nitya Archana Seva — ₹25,200/year', amount: 25200 },
  { value: 'saswatha', label: 'Saswatha Seva — ₹1,08,000 (Lifetime)', amount: 108000 },
  { value: 'custom', label: 'Custom Seva / Donation', amount: '' },
];

const PLAN_NAMES = {
  archana: 'Archana Seva',
  sahasranama: 'Sahasranama Seva',
  nitya_archana: 'Nitya Archana Seva',
  saswatha: 'Saswatha Seva Membership',
  custom: 'Custom Seva / Donation',
};

const PLAN_BENEFITS = {
  archana: [
    'Name included in monthly Archana & Sankalpa',
    'Festival & puja notifications (Notification only)',
    'Digital membership certificate',
  ],
  sahasranama: [
    'Name included in monthly Archana & Sankalpa',
    'Prasadam on Temple visit',
    "Naivedya offered to the Goddess on a specific date in devotee's name",
    'Festival & puja notifications (Notification only)',
    'Digital membership certificate',
  ],
  nitya_archana: [
    'Name included in Daily Archana',
    'Name included in Annual Special Homam',
    'Monthly Prasadam Courier',
    'Festival & puja notifications (Notification only)',
    'Digital membership certificate',
  ],
  saswatha: [
    'Name included in Daily Archana',
    'Special pujas / archana and prasadam delivery on selected dates',
    'Annual opportunity to participate in a Homam or Special Puja',
    'Festival & puja notifications (Notification only)',
    'Special Blessings Letter from the Temple',
    'Digital membership certificate',
  ],
};

const PAYMENT_METHODS = [
  { value: 'upi', label: '📱 UPI' },
  { value: 'cash', label: '💵 Cash' },
  { value: 'debit_card', label: '💳 Debit Card' },
  { value: 'net_banking', label: '🏦 Net Banking' },
  { value: 'direct_transfer', label: '🔄 Direct Account Transfer' },
];

const EMPTY_FORM = {
  full_name: '', email: '', phone: '', address: '', city: '', state: '',
  pincode: '', gotra: '', nakshatra: '',
  plan_type: 'archana', amount: '1251',
  payment_method: 'upi', transaction_id: '',
  payment_status: 'completed', seva_notes: '',
};

export default function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!sessionStorage.getItem('adminCreds'));
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [activeTab, setActiveTab] = useState('new-entry');
  const [dashData, setDashData] = useState(null);
  const [payments, setPayments] = useState([]);
  const [totalPayments, setTotalPayments] = useState(0);
  const [filters, setFilters] = useState({
    plan_type: '', payment_status: '', payment_method: '', search: '',
  });
  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState({ type: '', text: '' });

  // New entry form
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [formLoading, setFormLoading] = useState(false);
  const [lastCreated, setLastCreated] = useState(null);

  useEffect(() => {
    if (isLoggedIn) {
      loadDashboard();
    }
  }, [isLoggedIn]);

  const loadDashboard = async () => {
    try {
      const result = await getDashboard();
      setDashData(result.data);
    } catch (err) {
      if (err.message.includes('Authentication') || err.message.includes('credentials')) {
        handleLogout();
      }
    }
  };

  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAdminPayments(filters);
      setPayments(result.data.payments);
      setTotalPayments(result.data.total);
    } catch (err) {
      console.error('Load payments error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (isLoggedIn && activeTab === 'transactions') {
      loadPayments();
    }
  }, [filters, activeTab, isLoggedIn, loadPayments]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      await adminLogin(loginForm.username, loginForm.password);
      setIsLoggedIn(true);
    } catch (err) {
      setLoginError(err.message || 'Invalid credentials');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    adminLogout();
    setIsLoggedIn(false);
    setDashData(null);
    setPayments([]);
  };

  // ---- New Entry Handlers ----
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      // Auto-fill amount when plan changes
      if (name === 'plan_type') {
        const planOpt = PLAN_OPTIONS.find((p) => p.value === value);
        updated.amount = planOpt ? String(planOpt.amount) : '';
      }
      return updated;
    });
  };

  const handleCreateEntry = async (e) => {
    e.preventDefault();
    setActionMsg({ type: '', text: '' });

    // Client-side required field validation
    if (!form.full_name.trim()) {
      setActionMsg({ type: 'error', text: '⚠️ Devotee Name is required.' });
      return;
    }
    if (!form.phone.trim()) {
      setActionMsg({ type: 'error', text: '⚠️ Phone Number is required.' });
      return;
    }
    if (!form.plan_type) {
      setActionMsg({ type: 'error', text: '⚠️ Seva Type is required.' });
      return;
    }
    if (!form.amount || Number(form.amount) < 1) {
      setActionMsg({ type: 'error', text: '⚠️ Amount is required and must be at least ₹1.' });
      return;
    }
    if (!form.payment_method) {
      setActionMsg({ type: 'error', text: '⚠️ Payment Method is required.' });
      return;
    }
    if (form.payment_method !== 'cash' && !form.transaction_id.trim()) {
      setActionMsg({ type: 'error', text: '⚠️ Transaction ID is required for non-cash payments.' });
      return;
    }

    setFormLoading(true);

    try {
      const payload = {
        ...form,
        plan_name: PLAN_NAMES[form.plan_type] || form.plan_type,
      };
      const result = await adminCreateEntry(payload);

      setLastCreated({
        payment_id: result.data.payment_id,
        transaction_id: result.data.transaction_id,
        name: form.full_name,
        plan: PLAN_NAMES[form.plan_type],
        amount: form.amount,
      });

      setActionMsg({
        type: 'success',
        text: `✅ Entry created for "${form.full_name}" | Txn ID: ${result.data.transaction_id} | Amount: ₹${Number(form.amount).toLocaleString('en-IN')}`,
      });

      // Reset form for next entry
      setForm({ ...EMPTY_FORM });
      loadDashboard();

      // Scroll to top so admin sees the success message (after React re-render)
      setTimeout(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }, 100);
    } catch (err) {
      setActionMsg({ type: 'error', text: err.message });
    } finally {
      setFormLoading(false);
    }
  };

  // ---- Transaction Actions ----
  const handleMarkCash = async (paymentId) => {
    if (!window.confirm('Confirm that cash payment has been received?')) return;
    try {
      await markCashReceived(paymentId);
      setActionMsg({ type: 'success', text: 'Cash payment confirmed. Membership activated.' });
      loadPayments();
      loadDashboard();
    } catch (err) {
      setActionMsg({ type: 'error', text: err.message });
    }
  };

  const handleResendEmail = async (paymentId) => {
    try {
      setActionMsg({ type: 'info', text: 'Sending email...' });
      await adminResendReceipt(paymentId);
      setActionMsg({ type: 'success', text: 'Receipt email sent successfully.' });
      loadPayments();
    } catch (err) {
      setActionMsg({ type: 'error', text: err.message });
    }
  };

  const handleDownload = async (paymentId, txnId) => {
    try {
      await adminDownloadReceipt(paymentId, txnId);
    } catch (err) {
      setActionMsg({ type: 'error', text: 'Download failed: ' + err.message });
    }
  };

  const handleExport = async () => {
    try {
      await exportPayments(filters);
      setActionMsg({ type: 'success', text: 'CSV exported successfully with all transaction data.' });
    } catch (err) {
      setActionMsg({ type: 'error', text: 'Export failed: ' + err.message });
    }
  };

  const handleDeleteEntry = async (paymentId, devoteName, txnId) => {
    if (!window.confirm(`⚠️ Are you sure you want to DELETE this entry?\n\nDevotee: ${devoteName}\nTxn ID: ${txnId}\n\nThis action cannot be undone.`)) return;
    try {
      await adminDeleteEntry(paymentId);
      setActionMsg({ type: 'success', text: `🗑️ Entry for "${devoteName}" (${txnId}) deleted successfully.` });
      loadPayments();
      loadDashboard();
    } catch (err) {
      setActionMsg({ type: 'error', text: err.message });
    }
  };

  const handleUpdateStatus = async (paymentId, newStatus) => {
    try {
      await updatePayment(paymentId, { payment_status: newStatus });
      setActionMsg({ type: 'success', text: `Payment status updated to "${newStatus}".` });
      loadPayments();
      loadDashboard();
    } catch (err) {
      setActionMsg({ type: 'error', text: err.message });
    }
  };

  // ========== LOGIN SCREEN ==========
  if (!isLoggedIn) {
    return (
      <div className="page-container">
        <div className="admin-login">
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
          <h2 style={{ fontFamily: "'Cinzel', serif", color: '#8B1A1A' }}>Temple Admin Portal</h2>
          <p style={{ color: '#8B7355', fontSize: 14 }}>Internal Seva Management System</p>

          <div className="form-container" style={{ marginTop: 24 }}>
            {loginError && <div className="alert alert-error">⚠️ {loginError}</div>}
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  placeholder="Admin username"
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="Admin password"
                  required
                />
              </div>
              <button type="submit" className="btn btn-maroon btn-block" disabled={loginLoading}>
                {loginLoading ? <><span className="spinner" /> Authenticating...</> : '🔑 Login'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ========== ADMIN DASHBOARD ==========
  return (
    <div className="admin-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <img src="/goddess-logo.png" alt="Temple Logo"
            style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: '50%', border: '2px solid #C9A227' }} />
          <div>
            <h2 style={{ fontFamily: "'Cinzel', serif", color: '#8B1A1A', fontSize: 22 }}>
              Shree Samrajyalakshmi Temple
            </h2>
            <p style={{ color: '#8B7355', fontSize: 13, marginTop: 4 }}>
              Internal Seva Management — Admin Dashboard
            </p>
          </div>
        </div>
        <button onClick={handleLogout} className="btn btn-outline btn-sm">🚪 Logout</button>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        <button className={`tab-btn ${activeTab === 'new-entry' ? 'active' : ''}`}
          onClick={() => setActiveTab('new-entry')}>
          ✍️ New Entry
        </button>
        <button className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}>
          📋 All Transactions
        </button>
        <button className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}>
          📊 Dashboard
        </button>
      </div>

      {/* Messages */}
      {actionMsg.text && (
        <div className={`alert alert-${actionMsg.type}`} style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ flex: 1 }}>{actionMsg.text}</span>
          <button onClick={() => setActionMsg({ type: '', text: '' })}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, marginLeft: 12, lineHeight: 1 }}>
            ✕
          </button>
        </div>
      )}

      {/* ===== NEW ENTRY TAB (Primary) ===== */}
      {activeTab === 'new-entry' && (
        <div className="admin-manual-form">
          <h3 style={{ fontFamily: "'Cinzel', serif", color: '#8B1A1A', fontSize: 18, marginBottom: 4 }}>
            ✍️ Create New Seva Entry & Generate Bill
          </h3>
          <p style={{ color: '#8B7355', fontSize: 13, marginBottom: 20 }}>
            Enter the devotee details, select the seva plan, choose the payment method, and enter the actual transaction ID from the payment receipt.
          </p>

          {/* Last created entry — quick actions */}
          {lastCreated && (
            <div style={{
              background: '#E8F5E9', border: '1px solid #C8E6C9', borderRadius: 10,
              padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#2E7D32' }}>
                  ✅ Last Entry: {lastCreated.name} — {lastCreated.plan} — ₹{Number(lastCreated.amount).toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: 12, color: '#388E3C', fontFamily: "'Courier New', monospace" }}>
                  Txn: {lastCreated.transaction_id}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-sm btn-primary"
                  onClick={() => handleDownload(lastCreated.payment_id, lastCreated.transaction_id)}>
                  📄 Download Bill
                </button>
                <button className="btn btn-sm btn-outline"
                  onClick={() => handleResendEmail(lastCreated.payment_id)}>
                  📧 Email Bill
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleCreateEntry}>
            {/* ----- DEVOTEE DETAILS ----- */}
            <div className="form-section-title">👤 Devotee Information</div>
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Devotee Name (as per Sankalpa) <span className="required">*</span></label>
                <input type="text" name="full_name" value={form.full_name} onChange={handleFormChange}
                  placeholder="Sri / Smt. Full Name" required />
              </div>
              <div className="form-group">
                <label>Phone Number <span className="required">*</span></label>
                <input type="tel" name="phone" value={form.phone} onChange={handleFormChange}
                  placeholder="+91 98765 43210" required />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" name="email" value={form.email} onChange={handleFormChange}
                  placeholder="devotee@email.com" />
                <div className="input-hint">For sending bill via email</div>
              </div>
              <div className="form-group full-width">
                <label>Address</label>
                <input type="text" name="address" value={form.address} onChange={handleFormChange}
                  placeholder="House/Flat No., Street, Locality" />
              </div>
              <div className="form-group">
                <label>City</label>
                <input type="text" name="city" value={form.city} onChange={handleFormChange} placeholder="City" />
              </div>
              <div className="form-group">
                <label>State</label>
                <input type="text" name="state" value={form.state} onChange={handleFormChange} placeholder="State" />
              </div>
              <div className="form-group">
                <label>Pincode</label>
                <input type="text" name="pincode" value={form.pincode} onChange={handleFormChange}
                  placeholder="500001" maxLength="6" />
              </div>
              <div className="form-group">
                <label>Gotra</label>
                <input type="text" name="gotra" value={form.gotra} onChange={handleFormChange}
                  placeholder="e.g., Bharadwaja" />
              </div>
              <div className="form-group">
                <label>Nakshatra</label>
                <input type="text" name="nakshatra" value={form.nakshatra} onChange={handleFormChange}
                  placeholder="e.g., Rohini" />
              </div>
            </div>

            {/* ----- SEVA & PAYMENT DETAILS ----- */}
            <div className="form-section-title">🪔 Seva & Payment Details</div>
            <div className="form-grid">
              <div className="form-group">
                <label>Seva Type <span className="required">*</span></label>
                <select name="plan_type" value={form.plan_type} onChange={handleFormChange}>
                  {PLAN_OPTIONS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Amount (₹) <span className="required">*</span></label>
                <input type="number" name="amount" value={form.amount} onChange={handleFormChange}
                  placeholder="Enter amount" required min="1"
                  readOnly={form.plan_type !== 'custom'}
                  style={form.plan_type !== 'custom' ? { background: '#f0ebe4' } : {}} />
                {form.plan_type !== 'custom' && (
                  <div className="input-hint">Amount is fixed for this seva plan</div>
                )}
              </div>

              {/* Seva Benefits Note */}
              {PLAN_BENEFITS[form.plan_type] && (
                <div className="form-group full-width">
                  <div style={{
                    background: 'linear-gradient(135deg, #FFF8F0, #FFF3E0)',
                    border: '1px solid rgba(201, 162, 39, 0.3)',
                    borderLeft: '4px solid #C9A227',
                    borderRadius: '0 8px 8px 0',
                    padding: '14px 18px',
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#8B1A1A', marginBottom: 8, fontFamily: "'Cinzel', serif" }}>
                      📜 {PLAN_NAMES[form.plan_type]} Includes:
                    </div>
                    <ol style={{ margin: 0, paddingLeft: 20 }}>
                      {PLAN_BENEFITS[form.plan_type].map((benefit, idx) => (
                        <li key={idx} style={{ fontSize: 12, color: '#5D3A1A', lineHeight: 1.8, paddingLeft: 4 }}>
                          {benefit}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}
              <div className="form-group">
                <label>Payment Method <span className="required">*</span></label>
                <select name="payment_method" value={form.payment_method} onChange={handleFormChange}>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              {form.payment_method !== 'cash' ? (
                <div className="form-group">
                  <label>Transaction / Reference ID <span className="required">*</span></label>
                  <input type="text" name="transaction_id" value={form.transaction_id} onChange={handleFormChange}
                    placeholder="Enter txn ID from payment receipt" required
                    style={{ fontFamily: "'Courier New', monospace", letterSpacing: 1 }} />
                  <div className="input-hint">Enter the actual transaction ID from the payment confirmation</div>
                </div>
              ) : (
                <div className="form-group">
                  <label>Reference Note (Optional for Cash)</label>
                  <input type="text" name="transaction_id" value={form.transaction_id} onChange={handleFormChange}
                    placeholder="Optional — auto-generated if left blank"
                    style={{ fontFamily: "'Courier New', monospace", letterSpacing: 1 }} />
                  <div className="input-hint">Cash payments don't need a transaction ID. A reference will be auto-generated.</div>
                </div>
              )}
              <div className="form-group">
                <label>Payment Status</label>
                <select name="payment_status" value={form.payment_status} onChange={handleFormChange}>
                  <option value="completed">✅ Completed / Received</option>
                  <option value="pending">⏳ Pending</option>
                </select>
              </div>
              <div className="form-group full-width">
                <label>Seva Notes / Remarks</label>
                <textarea name="seva_notes" value={form.seva_notes} onChange={handleFormChange}
                  placeholder="Any additional notes about this seva, donation purpose, special instructions, etc."
                  rows="2"
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #DDD2C4', borderRadius: 6, fontFamily: "'Poppins', sans-serif", fontSize: 14, background: '#FFFAF5', resize: 'vertical' }}
                />
              </div>
            </div>

            {/* Submit */}
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button type="submit" className="btn btn-maroon" disabled={formLoading}
                style={{ padding: '14px 32px', fontSize: 15 }}>
                {formLoading ? <><span className="spinner" /> Creating...</> : '✍️ Create Entry & Save'}
              </button>
              <button type="button" className="btn btn-outline"
                onClick={() => { setForm({ ...EMPTY_FORM }); setLastCreated(null); setActionMsg({ type: '', text: '' }); }}>
                🔄 Clear Form
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===== ALL TRANSACTIONS TAB ===== */}
      {activeTab === 'transactions' && (
        <>
          {/* Filters */}
          <div className="admin-toolbar">
            <select value={filters.plan_type}
              onChange={(e) => setFilters({ ...filters, plan_type: e.target.value })}>
              <option value="">All Seva Types</option>
              <option value="archana">Archana Seva</option>
              <option value="sahasranama">Sahasranama Seva</option>
              <option value="nitya_archana">Nitya Archana Seva</option>
              <option value="saswatha">Saswatha Seva</option>
              <option value="custom">Custom / Donation</option>
            </select>

            <select value={filters.payment_status}
              onChange={(e) => setFilters({ ...filters, payment_status: e.target.value })}>
              <option value="">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>

            <select value={filters.payment_method}
              onChange={(e) => setFilters({ ...filters, payment_method: e.target.value })}>
              <option value="">All Methods</option>
              <option value="upi">UPI</option>
              <option value="cash">Cash</option>
              <option value="debit_card">Debit Card</option>
              <option value="net_banking">Net Banking</option>
              <option value="direct_transfer">Direct Transfer</option>
            </select>

            <input type="text" placeholder="🔍 Search name, phone, email, txn ID..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              style={{ flex: 1, minWidth: 200 }} />

            <button className="btn btn-sm btn-gold" onClick={handleExport}>
              📤 Export Full CSV
            </button>
            <button className="btn btn-sm btn-outline" onClick={loadPayments}>
              🔄 Refresh
            </button>
          </div>

          <div style={{ fontSize: 13, color: '#8B7355', marginBottom: 12 }}>
            Showing {payments.length} of {totalPayments} transactions
          </div>

          {/* Transactions Table */}
          <div className="admin-table-container">
            {loading ? (
              <div className="loading-container"><div className="spinner spinner-large" /></div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Transaction ID</th>
                    <th>Devotee Name</th>
                    <th>Phone</th>
                    <th>Seva Type</th>
                    <th>Amount (₹)</th>
                    <th>Payment Method</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan="10" style={{ textAlign: 'center', padding: 40, color: '#8B7355' }}>
                        No transactions found. Use "New Entry" to create the first record.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p, idx) => (
                      <tr key={p.id}>
                        <td>{idx + 1}</td>
                        <td className="txn-id">{p.transaction_id}</td>
                        <td>
                          <div>{p.full_name}</div>
                          {p.email && <div style={{ fontSize: 11, color: '#8B7355' }}>{p.email}</div>}
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>{p.phone}</td>
                        <td>{p.plan_name}</td>
                        <td style={{ fontWeight: 600 }}>₹{Number(p.amount).toLocaleString('en-IN')}</td>
                        <td>{METHOD_NAMES[p.payment_method] || p.payment_method}</td>
                        <td>
                          <span className={`status-badge status-${p.payment_status}`}>
                            {p.payment_status}
                          </span>
                        </td>
                        <td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>
                          {new Date(p.created_at).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric'
                          })}
                        </td>
                        <td>
                          <div className="table-actions">
                            <button className="action-btn action-btn-receipt" title="Download Bill PDF"
                              onClick={() => handleDownload(p.id, p.transaction_id)}>
                              📄 Bill
                            </button>
                            {p.email && (
                              <button className="action-btn action-btn-email" title="Email Bill"
                                onClick={() => handleResendEmail(p.id)}>
                                📧
                              </button>
                            )}
                            {p.payment_method === 'cash' && p.payment_status === 'pending' && (
                              <button className="action-btn action-btn-cash" title="Mark Cash Received"
                                onClick={() => handleMarkCash(p.id)}>
                                ✅ Cash
                              </button>
                            )}
                            {p.payment_status === 'pending' && p.payment_method !== 'cash' && (
                              <button className="action-btn action-btn-cash" title="Mark as Completed"
                                onClick={() => handleUpdateStatus(p.id, 'completed')}>
                                ✅
                              </button>
                            )}
                            <button className="action-btn action-btn-delete" title="Delete Entry"
                              onClick={() => handleDeleteEntry(p.id, p.full_name, p.transaction_id)}>
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* ===== DASHBOARD TAB ===== */}
      {activeTab === 'dashboard' && dashData && (
        <>
          <div className="admin-stats">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-value">{dashData.totalMembers}</div>
              <div className="stat-label">Total Devotees</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-value">{dashData.activeMembers}</div>
              <div className="stat-label">Active Memberships</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-value">₹{Number(dashData.totalRevenue).toLocaleString('en-IN')}</div>
              <div className="stat-label">Total Revenue</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📋</div>
              <div className="stat-value">{dashData.totalPayments}</div>
              <div className="stat-label">Completed Payments</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏳</div>
              <div className="stat-value" style={{ color: '#E65100' }}>{dashData.pendingCash}</div>
              <div className="stat-label">Pending Payments</div>
            </div>
          </div>

          {/* Plan Breakdown */}
          {dashData.planBreakdown && dashData.planBreakdown.length > 0 && (
            <div style={{ background: 'white', borderRadius: 10, padding: 20, border: '1px solid rgba(201,162,39,0.15)', marginBottom: 24 }}>
              <h3 style={{ fontFamily: "'Cinzel', serif", color: '#8B1A1A', fontSize: 16, marginBottom: 16 }}>
                Seva Wise Breakdown
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                {dashData.planBreakdown.map((plan) => (
                  <div key={plan.plan_type} style={{ background: '#FFF8F0', borderRadius: 8, padding: 14, border: '1px solid rgba(201,162,39,0.2)' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#8B1A1A' }}>{plan.plan_name}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#E8700A', marginTop: 4 }}>
                      {plan.count} <span style={{ fontSize: 12, fontWeight: 400, color: '#8B7355' }}>devotees</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#8B7355' }}>₹{Number(plan.revenue).toLocaleString('en-IN')}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Transactions */}
          {dashData.recentPayments && dashData.recentPayments.length > 0 && (
            <div>
              <h3 style={{ fontFamily: "'Cinzel', serif", color: '#8B1A1A', fontSize: 16, marginBottom: 12 }}>
                Recent Transactions
              </h3>
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Transaction ID</th>
                      <th>Devotee</th>
                      <th>Seva</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashData.recentPayments.map((p) => (
                      <tr key={p.id}>
                        <td className="txn-id">{p.transaction_id}</td>
                        <td>{p.full_name}</td>
                        <td>{p.plan_name}</td>
                        <td>₹{Number(p.amount).toLocaleString('en-IN')}</td>
                        <td>{METHOD_NAMES[p.payment_method]}</td>
                        <td>
                          <span className={`status-badge status-${p.payment_status}`}>{p.payment_status}</span>
                        </td>
                        <td>{new Date(p.created_at).toLocaleDateString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {dashData.totalMembers === 0 && (
            <div style={{ textAlign: 'center', padding: 60, color: '#8B7355' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
              <h3 style={{ fontFamily: "'Cinzel', serif", color: '#8B1A1A', marginBottom: 8 }}>No Entries Yet</h3>
              <p>Go to the "New Entry" tab to create the first seva record.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
