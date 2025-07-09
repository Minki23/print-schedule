'use client';

import { useState } from 'react';

interface FilamentUsageModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (filamentUsage: number) => void;
    title: string;
    message: string;
    estimatedUsage?: number;
}

export default function FilamentUsageModal({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    estimatedUsage 
}: FilamentUsageModalProps) {
    const [filamentUsage, setFilamentUsage] = useState(estimatedUsage?.toString() || '');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        const usage = parseFloat(filamentUsage);
        if (isNaN(usage) || usage < 0) {
            setError('Wprowadź poprawną ilość zużytego filamentu');
            return;
        }
        
        onConfirm(usage);
        setFilamentUsage('');
    };

    const handleClose = () => {
        setFilamentUsage('');
        setError('');
        onClose();
    };

    return (
        <div className="add-menu">
            <div className="add-menu-content" style={{ maxWidth: '400px' }}>
                <h2 className="form-title">{title}</h2>
                <p className="card-text" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                    {message}
                </p>
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">
                            Ilość zużytego filamentu (g)
                        </label>
                        <input
                            type="number"
                            className="form-input"
                            value={filamentUsage}
                            onChange={(e) => setFilamentUsage(e.target.value)}
                            placeholder="np. 15.5"
                            min="0"
                            step="0.1"
                            required
                        />
                    </div>
                    
                    {error && (
                        <div className="form-error" style={{ marginBottom: '1rem' }}>
                            {error}
                        </div>
                    )}
                    
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button 
                            type="button" 
                            onClick={handleClose}
                            className="btn btn-secondary"
                        >
                            Anuluj
                        </button>
                        <button type="submit" className="btn btn-primary">
                            Potwierdź
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
