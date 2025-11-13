const express = require('express');
const { exportAsDocument, exportAsPDF } = require('../controllers/exportController');
const router = express.Router();

const {protect} = require("../middlewares/authMiddleware");

router.get('/:id/doc', protect, exportAsDocument);
router.get('/:id/pdf', protect, exportAsPDF);

module.exports = router; 