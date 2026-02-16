/**
 * Simple JSON file-based database for the Temple Seva system.
 * No native compilation required — works on any platform.
 */
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'temple-db.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Default database structure
const DEFAULT_DB = {
  members: [],
  memberships: [],
  payments: [],
  _counters: { members: 0, memberships: 0, payments: 0 },
};

class TempleDB {
  constructor() {
    this.data = this._load();
  }

  _load() {
    try {
      if (fs.existsSync(dbPath)) {
        const raw = fs.readFileSync(dbPath, 'utf8');
        const parsed = JSON.parse(raw);
        // Ensure all collections exist
        return { ...DEFAULT_DB, ...parsed };
      }
    } catch (err) {
      console.error('DB load error, starting fresh:', err.message);
    }
    return JSON.parse(JSON.stringify(DEFAULT_DB));
  }

  _save() {
    fs.writeFileSync(dbPath, JSON.stringify(this.data, null, 2), 'utf8');
  }

  // ===== MEMBERS =====

  insertMember(member) {
    this.data._counters.members += 1;
    const id = this.data._counters.members;
    const now = new Date().toISOString();
    const newMember = {
      id,
      ...member,
      created_at: now,
      updated_at: now,
    };
    this.data.members.push(newMember);
    this._save();
    return newMember;
  }

  getMember(id) {
    return this.data.members.find((m) => m.id === id) || null;
  }

  // ===== MEMBERSHIPS =====

  insertMembership(membership) {
    this.data._counters.memberships += 1;
    const id = this.data._counters.memberships;
    const newMembership = {
      id,
      ...membership,
      created_at: new Date().toISOString(),
    };
    this.data.memberships.push(newMembership);
    this._save();
    return newMembership;
  }

  getMembership(id) {
    return this.data.memberships.find((m) => m.id === id) || null;
  }

  getMembershipWithMember(id) {
    const membership = this.getMembership(id);
    if (!membership) return null;
    const member = this.getMember(membership.member_id);
    return { ...membership, ...this._prefixMember(member) };
  }

  updateMembershipStatus(id, status) {
    const m = this.data.memberships.find((m) => m.id === id);
    if (m) {
      m.status = status;
      this._save();
    }
  }

  // ===== PAYMENTS =====

  insertPayment(payment) {
    this.data._counters.payments += 1;
    const id = this.data._counters.payments;
    const newPayment = {
      id,
      receipt_sent: 0,
      receipt_email_sent: 0,
      cash_received: 0,
      ...payment,
      created_at: new Date().toISOString(),
    };
    this.data.payments.push(newPayment);
    this._save();
    return newPayment;
  }

  getPayment(id) {
    return this.data.payments.find((p) => p.id === id) || null;
  }

  getPaymentByTxnId(txnId) {
    return this.data.payments.find((p) => p.transaction_id === txnId) || null;
  }

  getPaymentFull(id) {
    const payment = this.getPayment(id);
    if (!payment) return null;
    const membership = this.getMembership(payment.membership_id);
    const member = this.getMember(payment.member_id);
    if (!membership || !member) return null;
    return {
      ...payment,
      plan_type: membership.plan_type,
      plan_name: membership.plan_name,
      seva_notes: membership.seva_notes,
      start_date: membership.start_date,
      end_date: membership.end_date,
      is_lifetime: membership.is_lifetime,
      membership_status: membership.status,
      full_name: member.full_name,
      email: member.email,
      phone: member.phone,
      address: member.address,
      city: member.city,
      state: member.state,
      pincode: member.pincode,
      gotra: member.gotra,
      nakshatra: member.nakshatra,
    };
  }

  updatePayment(id, updates) {
    const p = this.data.payments.find((p) => p.id === id);
    if (p) {
      Object.assign(p, updates);
      this._save();
    }
  }

  // ===== ADMIN QUERIES =====

  getDashboardStats() {
    const totalMembers = this.data.members.length;
    const activeMembers = this.data.memberships.filter((m) => m.status === 'active').length;
    const completedPayments = this.data.payments.filter((p) => p.payment_status === 'completed');
    const totalPayments = completedPayments.length;
    const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0);
    const pendingCash = this.data.payments.filter(
      (p) => p.payment_method === 'cash' && p.payment_status === 'pending'
    ).length;

    // Plan breakdown
    const planMap = {};
    completedPayments.forEach((p) => {
      const membership = this.getMembership(p.membership_id);
      if (membership) {
        if (!planMap[membership.plan_type]) {
          planMap[membership.plan_type] = {
            plan_type: membership.plan_type,
            plan_name: membership.plan_name,
            count: 0,
            revenue: 0,
          };
        }
        planMap[membership.plan_type].count += 1;
        planMap[membership.plan_type].revenue += p.amount;
      }
    });
    const planBreakdown = Object.values(planMap);

    // Recent payments
    const recentPayments = this.data.payments
      .slice()
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10)
      .map((p) => {
        const membership = this.getMembership(p.membership_id);
        const member = this.getMember(p.member_id);
        return {
          ...p,
          plan_name: membership?.plan_name || 'N/A',
          full_name: member?.full_name || 'N/A',
          email: member?.email || '',
          phone: member?.phone || '',
        };
      });

    return {
      totalMembers,
      activeMembers,
      totalPayments,
      totalRevenue,
      pendingCash,
      planBreakdown,
      recentPayments,
    };
  }

  getFilteredPayments(filters = {}) {
    let results = this.data.payments.slice();

    // Join with membership and member data
    results = results.map((p) => {
      const membership = this.getMembership(p.membership_id);
      const member = this.getMember(p.member_id);
      return {
        ...p,
        plan_type: membership?.plan_type || '',
        plan_name: membership?.plan_name || 'N/A',
        seva_notes: membership?.seva_notes || '',
        start_date: membership?.start_date || '',
        end_date: membership?.end_date || '',
        is_lifetime: membership?.is_lifetime || 0,
        full_name: member?.full_name || 'N/A',
        email: member?.email || '',
        phone: member?.phone || '',
      };
    });

    // Apply filters
    if (filters.plan_type) {
      results = results.filter((p) => p.plan_type === filters.plan_type);
    }
    if (filters.payment_status) {
      results = results.filter((p) => p.payment_status === filters.payment_status);
    }
    if (filters.payment_method) {
      results = results.filter((p) => p.payment_method === filters.payment_method);
    }
    if (filters.search) {
      const s = filters.search.toLowerCase();
      results = results.filter(
        (p) =>
          (p.full_name && p.full_name.toLowerCase().includes(s)) ||
          (p.email && p.email.toLowerCase().includes(s)) ||
          (p.phone && p.phone.includes(s)) ||
          (p.transaction_id && p.transaction_id.toLowerCase().includes(s))
      );
    }

    // Sort by date descending
    results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const total = results.length;
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 50;
    const offset = (page - 1) * limit;
    const paginated = results.slice(offset, offset + limit);

    return {
      payments: paginated,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  getAllPaymentsForExport(filters = {}) {
    let results = this.data.payments.slice();

    results = results.map((p) => {
      const membership = this.getMembership(p.membership_id);
      const member = this.getMember(p.member_id);
      return {
        ...p,
        plan_type: membership?.plan_type || '',
        plan_name: membership?.plan_name || '',
        seva_notes: membership?.seva_notes || p.notes || '',
        start_date: membership?.start_date || '',
        end_date: membership?.end_date || '',
        is_lifetime: membership?.is_lifetime || 0,
        full_name: member?.full_name || '',
        email: member?.email || '',
        phone: member?.phone || '',
        address: member?.address || '',
        city: member?.city || '',
        state: member?.state || '',
        pincode: member?.pincode || '',
        gotra: member?.gotra || '',
        nakshatra: member?.nakshatra || '',
      };
    });

    if (filters.plan_type) {
      results = results.filter((p) => p.plan_type === filters.plan_type);
    }
    if (filters.payment_status) {
      results = results.filter((p) => p.payment_status === filters.payment_status);
    }

    results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return results;
  }

  // Helper to prefix member fields to avoid collisions
  _prefixMember(member) {
    if (!member) return {};
    return {
      full_name: member.full_name,
      email: member.email,
      phone: member.phone,
    };
  }
}

// Singleton
const db = new TempleDB();
module.exports = db;
