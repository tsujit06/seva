const express = require('express');
const router = express.Router();
const { SEVA_PLANS } = require('../utils/plans');

/**
 * GET /api/members/plans - Get all available seva plans (public info)
 */
router.get('/plans', (req, res) => {
  res.json({ success: true, plans: SEVA_PLANS });
});

module.exports = router;
