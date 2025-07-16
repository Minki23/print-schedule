'use client';

import Navigation from "@/components/Navigation";
import Notification from "@/components/Notification";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { ReactSVG } from "react-svg";
import '@/styles/loading.css';

interface Filament {
    _id: string;
    color: string;
    brand: string;
    material: string;
    diameter: number;
    weight: number;
}

export default function FilamentsPage(){
    const { data: session } = useSession();
    const [filaments, setFilaments] = useState<Filament[]>([])
    const [filteredFilaments, setFilteredFilaments] = useState<Filament[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
    const [showMenu, setShowMenu] = useState(false)
    const [loading, setLoading] = useState(false);
    const [editingFilament, setEditingFilament] = useState<Filament | null>(null);
    
    const [color, setColor] = useState('');
    const [brand, setBrand] = useState('');
    const [material, setMaterial] = useState('');
    const [diameter, setDiameter] = useState('');
    const [weight, setWeight] = useState('');

    useEffect(()=>{
        fetchFilaments();
    }, [])

    useEffect(() => {
        if (!searchTerm) {
            setFilteredFilaments(filaments);
        } else {
            const filtered = filaments.filter(filament =>
                filament.color.toLowerCase().includes(searchTerm.toLowerCase()) ||
                filament.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                filament.material.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredFilaments(filtered);
        }
    }, [filaments, searchTerm])

    const showNotification = (message: string, type: 'success' | 'error') => {
        setNotificationType(type);
        if (type === 'success') {
            setSuccess(message);
            setError('');
        } else {
            setError(message);
            setSuccess('');
        }
    };

    const clearNotifications = () => {
        setError('');
        setSuccess('');
    };

    const fetchFilaments = async () => {
        try{
            setLoading(true);
            const res = await fetch('/api/filaments');
            const data = await res.json();
            setFilaments(data.filaments || []);
        }
        catch (err: any) {
            showNotification(err.message || 'Wystąpił błąd podczas pobierania filamentów.', 'error');
        }
        finally {
            setLoading(false);
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearNotifications();

        if (!color || !brand || !material || !diameter || !weight) {
            showNotification('Wszystkie pola są wymagane', 'error');
            return;
        }

        try {
            const method = editingFilament ? 'PATCH' : 'POST';
            const body = editingFilament 
                ? { id: editingFilament._id, color, brand, material, diameter: parseFloat(diameter), weight: parseFloat(weight) }
                : { color, brand, material, diameter: parseFloat(diameter), weight: parseFloat(weight) };

            const res = await fetch('/api/filaments', {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                showNotification(editingFilament ? 'Filament został pomyślnie zaktualizowany!' : 'Filament został pomyślnie dodany!', 'success');
                resetForm();
                fetchFilaments();
            } else {
                const data = await res.json();
                showNotification(data.error || 'Nie udało się zapisać filamentu', 'error');
            }
        } catch (err: any) {
            showNotification(err.message || 'Wystąpił błąd podczas zapisywania filamentu.', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Czy na pewno chcesz usunąć ten filament?')) return;

        try {
            const res = await fetch('/api/filaments', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id }),
            });

            if (res.ok) {
                showNotification('Filament został pomyślnie usunięty!', 'success');
                fetchFilaments();
            } else {
                const data = await res.json();
                showNotification(data.error || 'Nie udało się usunąć filamentu', 'error');
            }
        } catch (err: any) {
            showNotification(err.message || 'Wystąpił błąd podczas usuwania filamentu.', 'error');
        }
    };

    const handleEdit = (filament: Filament) => {
        setEditingFilament(filament);
        setColor(filament.color);
        setBrand(filament.brand);
        setMaterial(filament.material);
        setDiameter(filament.diameter.toString());
        setWeight(filament.weight.toString());
        setShowMenu(true);
    };

    const resetForm = () => {
        setColor('');
        setBrand('');
        setMaterial('');
        setDiameter('');
        setWeight('');
        setEditingFilament(null);
        setShowMenu(false);
    };

    if (!session) {
        return null;
    }

  if (loading) {
    return (
      <div className="loading">
        <ReactSVG src="/logo.svg" className='loading-logo'/>
        <div className="loading-spinner"></div>
      </div>
    );
  }

    return (
        <div className="schedule-background">
            <Navigation/>
            <div className="schedule-content container">
                <div className="page-header">
                    <h1 className="page-title">Filamenty</h1>
                    {session.user.rank === "admin" && (
                        <button 
                            onClick={() => setShowMenu(!showMenu)} 
                            className="btn btn-primary"
                        >
                            {showMenu ? 'Anuluj' : 'Dodaj Filament'}
                        </button>
                    )}
                </div>

                <div className="search-container">
                    <input
                        type="text"
                        className="search-bar"
                        placeholder="Szukaj filamentów (kolor, producent, materiał)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {(error || success) && (
                    <Notification
                        message={error || success}
                        type={notificationType}
                        onClose={clearNotifications}
                    />
                )}

                {showMenu && (
                    <div className="add-menu">
                        <div className="add-menu-content">
                            <h2 className="form-title">
                                {editingFilament ? 'Edytuj Filament' : 'Dodaj Nowy Filament'}
                            </h2>
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label className="form-label">Kolor</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={color}
                                        onChange={(e) => setColor(e.target.value)}
                                        placeholder="np. Czerwony, Niebieski, Czarny"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Producent</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={brand}
                                        onChange={(e) => setBrand(e.target.value)}
                                        placeholder="np. Prusament, eSUN, SUNLU"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Materiał</label>
                                    <select
                                        className="form-select"
                                        value={material}
                                        onChange={(e) => setMaterial(e.target.value)}
                                    >
                                        <option value="">Wybierz materiał</option>
                                        <option value="PLA">PLA</option>
                                        <option value="ABS">ABS</option>
                                        <option value="PETG">PETG</option>
                                        <option value="TPU">TPU</option>
                                        <option value="ASA">ASA</option>
                                        <option value="PC">PC (Poliwęglan)</option>
                                        <option value="Nylon">Nylon</option>
                                        <option value="Wood">Wypełnienie Drewnem</option>
                                        <option value="Metal">Wypełnienie Metalem</option>
                                        <option value="Other">Inne</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Średnica (mm)</label>
                                    <select
                                        className="form-select"
                                        value={diameter}
                                        onChange={(e) => setDiameter(e.target.value)}
                                    >
                                        <option value="">Wybierz średnicę</option>
                                        <option value="1.75">1.75mm</option>
                                        <option value="3.0">3.0mm</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Waga (g)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={weight}
                                        onChange={(e) => setWeight(e.target.value)}
                                        placeholder="Waga w gramach"
                                        min="0"
                                        step="0.1"
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button type="submit" className="btn btn-primary">
                                        {editingFilament ? 'Zaktualizuj Filament' : 'Dodaj Filament'}
                                    </button>
                                    {editingFilament && (
                                        <button 
                                            type="button" 
                                            onClick={resetForm}
                                            className="btn btn-secondary"
                                        >
                                            Anuluj Edycję
                                        </button>
                                    )}
                                    <button 
                                        type="button" 
                                        onClick={() => setShowMenu(false)}
                                        className="btn btn-secondary"
                                    >
                                        Zamknij
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <div className="sections-container" style={{ gridTemplateColumns: '1fr' }}>
                    <div className="section">
                        <h2 className="section-title">
                            Dostępne Filamenty ({filteredFilaments.length}
                            {searchTerm && ` z ${filaments.length}`})
                        </h2>
                        <div className="section-content">
                            {filteredFilaments.length === 0 ? (
                                <p className="section-empty">
                                    {searchTerm ? 'Nie znaleziono filamentów pasujących do wyszukiwania.' : 'Brak dostępnych filamentów.'}
                                </p>
                            ) : (
                                <div className="grid grid-cols-1" style={{ gap: '1rem' }}>
                                    {filteredFilaments.map((filament) => (
                                        <div key={filament._id} className="card">
                                            <div className="card-header">
                                                <h3 className="card-title">
                                                    {filament.brand} - {filament.color} {filament.material}
                                                </h3>
                                                {session.user.rank === "admin" && (
                                                    <div className="card-menu">
                                                        <button 
                                                            className="btn btn-primary btn-sm"
                                                            onClick={() => handleEdit(filament)}
                                                            title="Edytuj"
                                                        >
                                                            Edytuj
                                                        </button>
                                                        <button 
                                                            className="btn btn-danger btn-sm"
                                                            onClick={() => handleDelete(filament._id)}
                                                            style={{ marginLeft: '0.5rem' }}
                                                            title="Usuń"
                                                        >
                                                            Usuń
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="filament-details">
                                                <div className="filament-info">
                                                    <div className="info-item">
                                                        <span className="info-label">Producent:</span>
                                                        <span className="info-value">{filament.brand}</span>
                                                    </div>
                                                    <div className="info-item">
                                                        <span className="info-label">Materiał:</span>
                                                        <span className="info-value">{filament.material}</span>
                                                    </div>
                                                    <div className="info-item">
                                                        <span className="info-label">Średnica:</span>
                                                        <span className="info-value">{filament.diameter}mm</span>
                                                    </div>
                                                    <div className="info-item">
                                                        <span className="info-label">Waga:</span>
                                                        <span className="info-value">{filament.weight}g</span>
                                                    </div>
                                                </div>
                                                <div className="status-badge" 
                                                     style={{ 
                                                         backgroundColor: filament.weight > 100 ? 'var(--success)' : 'var(--warning)',
                                                         color: 'white'
                                                     }}>
                                                    {filament.weight > 100 ? 'Dostępny' : 'Niski Stan'}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}