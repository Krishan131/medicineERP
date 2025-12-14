const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

// Storage for multiple clients: Map<userId, Client>
const clients = new Map();
// Storage for QRs: Map<userId, string>
const qrCodes = new Map();
// Storage for Connection Status: Map<userId, string> ('INITIALIZING', 'QR_READY', 'AUTHENTICATED', 'READY', 'DISCONNECTED')
const connectionStatus = new Map();

const initializeWhatsApp = (userId) => {
    if (clients.has(userId)) {
        const existingClient = clients.get(userId);
        // If client exists and is ready/initializing, don't restart unless specifically needed
        // console.log(`WhatsApp client for user ${userId} already exists.`);
        // If already exists, we don't return early if it's disconnected, but here we assume it persists
        return;
    }

    console.log(`Initializing WhatsApp Client for User: ${userId}...`);
    connectionStatus.set(userId, 'INITIALIZING');

    // Unique session per user
    const client = new Client({
        authStrategy: new LocalAuth({
            clientId: userId,
            dataPath: './.wwebjs_auth_store' // New clean storage for multi-tenant
        }),
        puppeteer: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        }
    });

    client.on('qr', (qr) => {
        console.log(`QR RECEIVED for ${userId}`);
        qrCodes.set(userId, qr);
        connectionStatus.set(userId, 'QR_READY');
        qrcode.generate(qr, { small: true }); // Generate QR in console for debugging
    });

    client.on('authenticated', () => {
        console.log(`AUTHENTICATED for ${userId}`);
        connectionStatus.set(userId, 'AUTHENTICATED');
        qrCodes.delete(userId); // Clear QR explicitly on auth (scan success)
    });

    client.on('ready', () => {
        console.log(`WhatsApp Client for ${userId} is ready!`);
        connectionStatus.set(userId, 'READY');
        qrCodes.delete(userId); // Clear QR
    });

    client.on('auth_failure', (msg) => {
        console.error(`AUTH FAILURE for ${userId}`, msg);
        connectionStatus.set(userId, 'DISCONNECTED');
        clients.delete(userId); // Remove client on auth failure
        qrCodes.delete(userId);
    });

    client.on('disconnected', (reason) => {
        console.log(`Client ${userId} was disconnected`, reason);
        connectionStatus.set(userId, 'DISCONNECTED');
        clients.delete(userId);
        qrCodes.delete(userId);
    });

    client.initialize();
    clients.set(userId, client);
};

const getQrCode = (userId) => qrCodes.get(userId);
const getClientStatus = (userId) => connectionStatus.get(userId) || 'DISCONNECTED';
const isClientReady = (userId) => connectionStatus.get(userId) === 'READY';

const sendInvoicePDF = async (userId, phoneNumber, pdfPath, invoiceNumber) => {
    const client = clients.get(userId);

    if (!client || !isClientReady(userId)) {
        console.warn(`WhatsApp client for user ${userId} not ready. Cannot send invoice.`);
        return false;
    }

    try {
        // WhatsApp expects numbers in international format (e.g. 919876543210@c.us)
        // Removing spaces, dashes, +
        const sanitizedNumber = phoneNumber.replace(/\D/g, '');
        const finalNumber = sanitizedNumber.length === 10 ? `91${sanitizedNumber}` : sanitizedNumber; // Assuming India, fallback to adding 91 if 10 digits
        const chatId = `${finalNumber}@c.us`;

        const media = MessageMedia.fromFilePath(pdfPath);

        await client.sendMessage(chatId, media, {
            caption: `Thank you for your purchase! Here is your invoice #${invoiceNumber}.`
        });

        console.log(`Invoice sent to ${finalNumber} from user ${userId}`);
        return true;
    } catch (error) {
        console.error('Failed to send WhatsApp message:', error);
        return false;
    }
};

module.exports = { initializeWhatsApp, sendInvoicePDF, getQrCode, isClientReady, getClientStatus };
