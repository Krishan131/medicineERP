const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { createInvoice, getInvoices, getInvoiceById, getWhatsAppStatus } = require('../controllers/salesController');

router.post('/', auth, createInvoice);
router.get('/', auth, getInvoices);
router.get('/whatsapp/status', auth, getWhatsAppStatus); // New Route
router.get('/:id', auth, getInvoiceById);

module.exports = router;
