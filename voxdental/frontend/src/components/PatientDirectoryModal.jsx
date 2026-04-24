import React, { useState, useEffect } from 'react';
import { X, Search, User, Edit2, Trash2, Check, Clock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const PatientDirectoryModal = ({ patients, onClose, onSelect, onUpdate, onDelete }) => {
    const { t } = useLanguage();
    const { token } = useAuth();
    const { isEgo } = useTheme();
    const [searchTerm, setSearchTerm] = useState('');
    
    // Edit/Delete state for directory
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState("");
    const [deletingId, setDeletingId] = useState(null);

    // Bloquear scroll del fondo
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
            document.documentElement.style.overflow = 'unset';
        };
    }, []);

    const filteredPatients = patients.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = async (p) => {
        onSelect(p);
        onClose();
        
        // Touch the patient so it bubbles up to top recent
        try {
            await fetch(`/api/v1/patients/${p.id}/touch`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (error) {
            console.error("Error touching patient:", error);
        }
    };

    const submitUpdate = async (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        if (!editName.trim()) return;
        
        await onUpdate(id, editName);
        setEditingId(null);
    };

    const confirmDelete = async (e, id) => {
        e.stopPropagation();
        await onDelete(id);
        setDeletingId(null);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`bg-white dark:bg-zinc-900 w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-zinc-800 ${isEgo ? 'rounded-none' : 'rounded-2xl'}`}>
                
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 bg-[#9CCBA8]/20 text-[#9CCBA8] ${isEgo ? 'rounded-none' : 'rounded-xl'}`}>
                            <User size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                                {t('patient.directory_title')}
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                {t('patient.total_count').replace('{count}', patients.length)}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className={`p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors ${isEgo ? 'rounded-none' : 'rounded-xl'}`}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Search */}
                <div className="p-6 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text"
                            placeholder={t('patient.search_placeholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-10 pr-4 py-3 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-[#9CCBA8] transition-all text-slate-700 dark:text-zinc-200 ${isEgo ? 'rounded-none' : 'rounded-xl'}`}
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-2">
                        {filteredPatients.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                                {t('patient.no_patients')}
                            </div>
                        ) : (
                            filteredPatients.map((p) => (
                                <div key={p.id} className="relative group">
                                    {deletingId === p.id ? (
                                        <div className={`flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 ${isEgo ? 'rounded-none' : 'rounded-xl'}`}>
                                            <span className="text-sm font-bold text-red-700 dark:text-red-400">{t('common.delete_confirm_short')}</span>
                                            <div className="flex gap-2">
                                                <button onClick={(e) => confirmDelete(e, p.id)} className={`px-3 py-1.5 bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-bold shadow-sm ${isEgo ? 'rounded-none' : 'rounded-lg'}`}>{t('common.yes')}</button>
                                                <button onClick={(e) => { e.stopPropagation(); setDeletingId(null); }} className={`px-3 py-1.5 bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-300 dark:hover:bg-zinc-700 transition-colors text-sm font-bold ${isEgo ? 'rounded-none' : 'rounded-lg'}`}>{t('common.no')}</button>
                                            </div>
                                        </div>
                                    ) : editingId === p.id ? (
                                        <form onSubmit={(e) => submitUpdate(e, p.id)} className={`flex items-center p-3 bg-[#9CCBA8]/10 border border-[#9CCBA8]/30 gap-3 ${isEgo ? 'rounded-none' : 'rounded-xl'}`}>
                                            <input
                                                type="text"
                                                autoFocus
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className={`flex-1 px-3 py-2 bg-white dark:bg-zinc-800 border border-[#9CCBA8]/50 outline-none focus:ring-2 focus:ring-[#9CCBA8] text-sm text-slate-800 dark:text-zinc-200 ${isEgo ? 'rounded-none' : 'rounded-lg'}`}
                                            />
                                            <div className="flex gap-1">
                                                <button type="submit" className={`p-2 bg-[#9CCBA8] text-white hover:bg-[#8DB998] transition-colors shadow-sm ${isEgo ? 'rounded-none' : 'rounded-lg'}`}><Check size={16} /></button>
                                                <button type="button" onClick={() => setEditingId(null)} className={`p-2 bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-zinc-700 transition-colors ${isEgo ? 'rounded-none' : 'rounded-lg'}`}><X size={16} /></button>
                                            </div>
                                        </form>
                                    ) : (
                                        <div 
                                            onClick={() => handleSelect(p)}
                                            className={`flex items-center justify-between p-4 bg-white dark:bg-zinc-800/50 hover:bg-slate-50 dark:hover:bg-zinc-800 border border-slate-100 dark:border-zinc-800/50 cursor-pointer transition-all ${isEgo ? 'rounded-none' : 'rounded-xl'}`}
                                        >
                                            <div className="flex flex-col gap-1">
                                                <span className="font-bold text-slate-700 dark:text-zinc-200">{p.name}</span>
                                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono flex items-center gap-1 uppercase tracking-wider">
                                                    <Clock size={10} /> ID: {p.id}
                                                </span>
                                            </div>
                                            
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingId(p.id);
                                                        setEditName(p.name);
                                                    }}
                                                    className={`p-2 text-[#9CCBA8] hover:bg-[#9CCBA8]/10 transition-colors ${isEgo ? 'rounded-none' : 'rounded-lg'}`}
                                                    title="Editar"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDeletingId(p.id);
                                                    }}
                                                    className={`p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ${isEgo ? 'rounded-none' : 'rounded-lg'}`}
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
