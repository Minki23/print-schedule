'use client';

import { useEffect, useState } from 'react';

interface NotificationProps {
    message: string;
    type: 'success' | 'error';
    onClose: () => void;
    duration?: number;
}

export default function Notification({ message, type, onClose, duration = 5000 }: NotificationProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);

    useEffect(() => {
        const showTimer = setTimeout(() => setIsVisible(true), 100);
        
        const hideTimer = setTimeout(() => {
            handleClose();
        }, duration);

        return () => {
            clearTimeout(showTimer);
            clearTimeout(hideTimer);
        };
    }, [duration]);

    const handleClose = () => {
        setIsLeaving(true);
        setTimeout(() => {
            setIsVisible(false);
            onClose();
        }, 300);
    };

    if (!message) return null;

    return (
        <div 
            className={`notification ${type} ${isVisible ? 'show' : ''} ${isLeaving ? 'hide' : ''}`}
            onClick={handleClose}
        >
            <div className="notification-content">
                <span className="notification-icon">
                    {type === 'success' ? '✓' : '⚠'}
                </span>
                <span className="notification-message">{message}</span>
                <button className="notification-close" onClick={handleClose}>
                    ×
                </button>
            </div>
        </div>
    );
}
