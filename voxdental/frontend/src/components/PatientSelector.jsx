import React, { useState, useEffect } from 'react';
import { UserPlus, Users, Check, ChevronDown, Edit2, Trash2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export const PatientSelector = ({ onSelect, selectedPatient }) => {
    const [patients, setPatients] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newPatientName, setNewPatientName] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const { t } = useLanguage();
    const { isEgo } = useTheme();

    // Edit/Delete state
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState("");
    const [deletingId, setDeletingId] = useState(null);

    const { token } = useAuth();

    const fetchPatients = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/v1/patients', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setPatients(data);
                if (data.length === 1 && !selectedPatient) {
                    onSelect(data[0]);
                }
            }
        } catch (error) {
            console.error("Error fetching patients:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchPatients();
    }, [token]);

    const handleCreatePatient = async (e) => {
        e.preventDefault();
        if (!newPatientName.trim()) return;

        try {
            const response = await fetch('/api/v1/patients', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: newPatientName })
            });

            if (response.ok) {
                const newPatient = await response.json();
                setPatients([...patients, newPatient]);
                onSelect(newPatient);
                setIsCreating(false);
                setNewPatientName("");
                setShowDropdown(false);
            }
        } catch (error) {
            console.error("Error creating patient:", error);
        }
    };

    const handleUpdatePatient = async (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        if (!editName.trim()) return;

        try {
            const response = await fetch(`/api/v1/patients/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: editName })
            });

            if (response.ok) {
                const updated = await response.json();
                setPatients(patients.map(p => p.id === id ? updated : p));
                if (selectedPatient?.id === id) {
                    onSelect(updated);
                }
                setEditingId(null);
            }
        } catch (error) {
            console.error("Error updating patient:", error);
        }
    };

    const handleDeletePatient = async (e, id) => {
        e.stopPropagation();
        try {
            const response = await fetch(`/api/v1/patients/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                setPatients(patients.filter(p => p.id !== id));
                if (selectedPatient?.id === id) {
                    onSelect(null);
                }
                setDeletingId(null);
            }
        } catch (error) {
            console.error("Error deleting patient:", error);
        }
    };

    return (
        <div className="relative">
            <div className={`flex items-center gap-2 w-full sm:w-auto ${isEgo ? 'border-b border-slate-200 dark:border-zinc-800 pb-0' : ''}`}>
                <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className={`flex items-center gap-2 px-4 py-2 hover:border-[#9CCBA8] transition-all min-w-0 flex-1 sm:min-w-[200px] justify-between ${isEgo ? 'bg-transparent border-none shadow-none rounded-none' : 'bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 rounded-xl shadow-sm'}`}
                >
                    <div className="flex items-center gap-2 overflow-hidden">
                        <Users size={18} className="text-slate-500 dark:text-slate-400 flex-shrink-0" />
                        <span className="truncate font-bold text-slate-700 dark:text-zinc-200 text-sm">
                            {selectedPatient ? selectedPatient.name : t('patient.select_placeholder')}
                        </span>
                    </div>
                    <ChevronDown size={14} className={`text-slate-400 flex-shrink-0 transition-transform ${showDropdown ? 'rotate-180 text-[#9CCBA8]' : ''}`} />
                </button>

                <button
                    onClick={() => { setIsCreating(true); setShowDropdown(true); }}
                    className={`p-2.5 transition-all flex-shrink-0 ${isEgo ? 'bg-transparent border-none text-slate-400' : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-slate-300 rounded-xl border border-slate-300 dark:border-zinc-700 shadow-sm hover:bg-slate-50 dark:hover:bg-zinc-700'}`}
                    title={t('patient.new_patient')}
                >
                    <UserPlus size={18} />
                </button>
            </div>

            {showDropdown && (
                <div className={`absolute top-full left-0 mt-2 w-full sm:min-w-[280px] z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 ${isEgo ? 'bg-white dark:bg-zinc-900 border-x border-b border-slate-200 dark:border-zinc-800 rounded-b-lg p-0 shadow-lg' : 'bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 rounded-xl shadow-xl'}`}>
                    {isCreating ? (
                        <form onSubmit={handleCreatePatient} className="p-4 bg-slate-50/50 dark:bg-zinc-800/20">
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-2">{t('patient.new_patient')}</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    autoFocus
                                    placeholder={t('patient.full_name')}
                                    value={newPatientName}
                                    onChange={(e) => setNewPatientName(e.target.value)}
                                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-[#9CCBA8]/30 dark:border-[#9CCBA8]/20 rounded-lg outline-none focus:ring-2 focus:ring-[#9CCBA8] text-sm"
                                />
                                <button type="submit" className="p-2 bg-[#9CCBA8] text-white rounded-lg hover:bg-[#8DB998] transition-colors shadow-sm">
                                    <Check size={18} />
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="mt-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                            >
                                {t('common.cancel')}
                            </button>
                        </form>
                    ) : (
                        <div className="max-h-[300px] overflow-y-auto p-2">
                            {isLoading ? (
                                <div className="p-4 text-center text-sm text-gray-400">{t('common.loading')}</div>
                            ) : patients.length === 0 ? (
                                <div className="p-4 text-center">
                                    <p className="text-sm text-gray-500 mb-2">{t('patient.no_patients')}</p>
                                    <button
                                        onClick={() => setIsCreating(true)}
                                        className="text-xs font-bold text-[#9CCBA8] hover:underline"
                                    >
                                        {t('patient.register_first')}
                                    </button>
                                </div>
                            ) : (
                                patients.map(p => (
                                    <div key={p.id} className="group relative">
                                        {deletingId === p.id ? (
                                            <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-900/30 animate-in fade-in zoom-in duration-200">
                                                <span className="text-xs font-bold text-red-700 dark:text-red-400">{t('common.delete_confirm_short')}</span>
                                                <div className="flex gap-1">
                                                    <button onClick={(e) => handleDeletePatient(e, p.id)} className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm text-xs font-bold px-2">{t('common.yes')}</button>
                                                    <button onClick={(e) => { e.stopPropagation(); setDeletingId(null); }} className="p-1.5 bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 rounded-lg hover:bg-slate-300 dark:hover:bg-zinc-700 transition-colors text-xs font-bold px-2">{t('common.no')}</button>
                                                </div>
                                            </div>
                                        ) : editingId === p.id ? (
                                            <form onSubmit={(e) => handleUpdatePatient(e, p.id)} className="p-2 bg-[#9CCBA8]/5 dark:bg-[#9CCBA8]/10 rounded-xl border border-[#9CCBA8]/20 dark:border-[#9CCBA8]/30">
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        autoFocus
                                                        value={editName}
                                                        onClick={(e) => e.stopPropagation()}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        className="flex-1 px-2 py-1 bg-white dark:bg-slate-900 border border-[#9CCBA8]/30 dark:border-[#9CCBA8]/20 rounded-md outline-none focus:ring-2 focus:ring-[#9CCBA8] text-sm"
                                                    />
                                                    <button type="submit" className="p-1.5 bg-[#9CCBA8] text-white rounded-md hover:bg-[#8DB998] transition-colors shadow-sm">
                                                        <Check size={14} />
                                                    </button>
                                                    <button type="button" onClick={(e) => { e.stopPropagation(); setEditingId(null); }} className="p-1.5 bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 rounded-md hover:bg-slate-300 dark:hover:bg-zinc-700">
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            </form>
                                        ) : (
                                            <div
                                                onClick={() => {
                                                    onSelect(p);
                                                    setShowDropdown(false);
                                                }}
                                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-sm cursor-pointer group ${selectedPatient?.id === p.id
                                                    ? 'bg-[#9CCBA8] text-white shadow-md'
                                                    : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800'}`}
                                            >
                                                <span className="font-semibold truncate mr-2">{p.name}</span>
                                                <div className="flex items-center gap-1">
                                                    <div className={`flex items-center gap-1 transition-opacity ${selectedPatient?.id === p.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditingId(p.id);
                                                                setEditName(p.name);
                                                            }}
                                                            className={`p-1 rounded-md transition-colors ${selectedPatient?.id === p.id ? 'hover:bg-[#8DB998] text-[#EBF9F2] hover:text-white' : 'hover:bg-[#9CCBA8]/10 dark:hover:bg-[#9CCBA8]/20 text-[#9CCBA8]'}`}
                                                            title="Editar"
                                                        >
                                                            <Edit2 size={12} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setDeletingId(p.id);
                                                            }}
                                                            className={`p-1 rounded-md transition-colors ${selectedPatient?.id === p.id ? 'hover:bg-red-700/50 text-red-100 hover:text-white' : 'hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500'}`}
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                    {selectedPatient?.id === p.id && (
                                                        <Check size={14} className="flex-shrink-0 ml-1" />
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Click outside to close */}
            {showDropdown && (
                <div
                    className="fixed inset-0 z-[90]"
                    onClick={() => {
                        setShowDropdown(false);
                        setIsCreating(false);
                        setEditingId(null);
                        setDeletingId(null);
                    }}
                />
            )}
        </div>
    );
};
