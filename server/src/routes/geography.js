const express = require('express');
const router = express.Router();
const { District, Constituency, Panchayat, Ward } = require('../models/Geography');

// @desc    Get all districts
// @route   GET /api/geography/districts
// @access  Public
router.get('/districts', async (req, res) => {
  try {
    const districts = await District.find().sort({ name: 1 });
    res.json({ success: true, districts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get constituencies by district
// @route   GET /api/geography/constituencies/:districtId
// @access  Public
router.get('/constituencies/:districtId', async (req, res) => {
  try {
    const constituencies = await Constituency.find({ districtId: req.params.districtId }).sort({ name: 1 });
    res.json({ success: true, constituencies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get panchayats by district
// @route   GET /api/geography/panchayats/:districtId
// @access  Public
router.get('/panchayats/:districtId', async (req, res) => {
  try {
    const panchayats = await Panchayat.find({ districtId: req.params.districtId }).sort({ name: 1 });
    res.json({ success: true, panchayats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get wards by panchayat
// @route   GET /api/geography/wards/:panchayatId
// @access  Public
router.get('/wards/:panchayatId', async (req, res) => {
  try {
    const wards = await Ward.find({ panchayatId: req.params.panchayatId }).sort({ name: 1 });
    res.json({ success: true, wards });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
