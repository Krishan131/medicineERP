import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import api from '../api/api';

const WhatsAppConnect = () => {
    const [status, setStatus] = useState({ isReady: false, qrCode: null, status: 'DISCONNECTED' });
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false); // Controls the popup

    const fetchStatus = async () => {
        try {
            const res = await api.get('/sales/whatsapp/status');
            setStatus(res.data);
            setLoading(false);

            // Auto close modal if ready
            if (res.data.isReady) {
                setShowModal(false);
            }
        } catch (err) {
            console.error('Failed to fetch WhatsApp status', err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 5000); // Poll slower (5s) to save bandwidth
        return () => clearInterval(interval);
    }, []);

    // 1. If Connected, Hide Completely (as requested)
    if (status.isReady) return null;

    // 2. Dashboard Widget (Visible when NOT connected)
    if (!showModal) {
        return (
            <div className="card" style={{
                marginBottom: '2rem',
                background: 'linear-gradient(135deg, #dcf8c6 0%, #ffffff 100%)', // WhatsApp-ish tint
                border: '1px solid #25D366',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    <h3 style={{ color: '#075e54', marginBottom: '0.5rem' }}>WhatsApp Invoice Bot 🤖</h3>
                    <p style={{ color: '#128c7e', marginBottom: 0 }}>
                        {status.status === 'INITIALIZING'
                            ? 'Client is waking up... Please wait.'
                            : 'Connect to send automated invoices to customers.'}
                    </p>
                </div>
                <button
                    className="btn"
                    onClick={() => setShowModal(true)}
                    style={{
                        background: '#25D366',
                        color: 'white',
                        boxShadow: '0 4px 12px rgba(37, 211, 102, 0.4)'
                    }}
                >
                    {status.status === 'INITIALIZING' ? 'View Status' : 'Connect Now'}
                </button>
            </div>
        );
    }

    // 3. The Modal (Only visible when requested)
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.85)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        }}>
            <div className="card" style={{
                textAlign: 'center',
                maxWidth: '400px',
                width: '90%',
                padding: '2rem',
                position: 'relative',
                animation: 'fadeIn 0.3s ease'
            }}>
                {/* Close Button */}
                <button
                    onClick={() => setShowModal(false)}
                    style={{
                        position: 'absolute',
                        top: '15px',
                        right: '15px',
                        background: 'none',
                        border: 'none',
                        fontSize: '1.5rem',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)'
                    }}
                >
                    &times;
                </button>

                <h3 style={{ color: 'var(--primary-color)', marginBottom: '1rem' }}>Connect WhatsApp</h3>

                {status.status === 'INITIALIZING' && (
                    <div style={{ padding: '2rem 0' }}>
                        <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
                        <p>Starting WhatsApp Client on Server...</p>
                        <small className="text-muted">This takes about 60 seconds on cloud servers.</small>
                    </div>
                )}

                {(status.status === 'QR_READY' || status.qrCode) && (
                    <>
                        <p style={{ marginBottom: '1.5rem', color: 'var(--text-color)' }}>
                            Scan this QR code with your phone.
                        </p>
                        <div style={{ background: 'white', padding: '15px', display: 'inline-block', borderRadius: '10px', marginBottom: '1.5rem' }}>
                            <QRCode value={status.qrCode} size={220} />
                        </div>
                    </>
                )}

                {status.status === 'AUTHENTICATED' && (
                    <div style={{ padding: '2rem 0' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                        <h3>Linked Successfully!</h3>
                        <p>Waiting for server to confirm...</p>
                    </div>
                )}

                <div style={{ marginTop: '1rem', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button
                        onClick={fetchStatus}
                        className="btn btn-success"
                        style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                    >
                        Check Status
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WhatsAppConnect;
