import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import api from '../api/api';

const WhatsAppConnect = () => {
    const [status, setStatus] = useState({ isReady: false, qrCode: null });
    const [loading, setLoading] = useState(true);

    const fetchStatus = async () => {
        try {
            const res = await api.get('/sales/whatsapp/status');
            setStatus(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch WhatsApp status', err);
            setLoading(false);
        }
    };

    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 3000); // Poll every 3 seconds
        return () => clearInterval(interval);
    }, []);

    // If connected or dismissed by user, don't show anything
    if (status.isReady || !isVisible) return null;

    // Loading state (Initializing)
    if (status.status === 'INITIALIZING' && !status.qrCode) {
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
                alignItems: 'center',
                color: 'white',
                flexDirection: 'column'
            }}>
                <div className="spinner" style={{ marginBottom: '20px' }}></div>
                <h3>Starting WhatsApp Client...</h3>
                <p>This may take up to 60 seconds.</p>
            </div>
        );
    }

    // Scanned but not ready yet (Authenticated)
    if (status.status === 'AUTHENTICATED') {
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
                alignItems: 'center',
                color: 'white',
                flexDirection: 'column'
            }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                <h3>Scanned Successfully!</h3>
                <p>Connecting to WhatsApp servers... Please wait.</p>
            </div>
        );
    }

    // If no QR yet (and not initializing/auth), show nothing
    if (!status.qrCode) return null;

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
                position: 'relative'
            }}>
                <h3 style={{ color: 'var(--primary-color)', marginBottom: '1rem' }}>Connect WhatsApp</h3>
                <p style={{ marginBottom: '1.5rem', color: 'var(--text-color)' }}>
                    Scan this QR code to enable automated invoice sending.
                </p>

                <div style={{ background: 'white', padding: '15px', display: 'inline-block', borderRadius: '10px', marginBottom: '1.5rem' }}>
                    <QRCode value={status.qrCode} size={220} />
                </div>

                <div>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <button
                            onClick={fetchStatus}
                            className="btn btn-success"
                            style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                        >
                            I've Scanned It
                        </button>
                        <button
                            onClick={() => setIsVisible(false)}
                            className="btn"
                            style={{
                                background: 'transparent',
                                border: '1px solid var(--border-color)',
                                color: 'var(--text-color)'
                            }}
                        >
                            Skip
                        </button>
                    </div>
                    <div style={{ marginTop: '10px', fontSize: '0.8rem', opacity: 0.7 }}>
                        You can reload the page to try again.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WhatsAppConnect;
