import React, { useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { User, Lock, X, Check, Loader2, AlertCircle, Heart, Activity, Stethoscope, Shield, Dog, Briefcase, Camera, Image as ImageIcon, Cat, Languages } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useScrollLock } from '../hooks/useScrollLock';
import { useTheme } from '../context/ThemeContext';

const DEFAULT_AVATARS = [
    { id: 'user', icon: User, color: 'bg-blue-500' },
    { id: 'heart', icon: Heart, color: 'bg-red-500' },
    { id: 'activity', icon: Activity, color: 'bg-green-500' },
    { id: 'steth', icon: Stethoscope, color: 'bg-purple-500' },
    { id: 'shield', icon: Shield, color: 'bg-indigo-500' },
    { id: 'dog', icon: Dog, color: 'bg-yellow-500' },
    { id: 'case', icon: Briefcase, color: 'bg-slate-700' },
    { id: 'cat', icon: Cat, color: 'bg-rose-400' },
];

export const ProfileModal = ({ onClose }) => {
    const { user, token, login } = useAuth();
    const { language, setLanguage, t } = useLanguage();
    const { isEgo } = useTheme();
    useScrollLock();
    const fileInputRef = useRef(null);
    const [name, setName] = useState(user?.name || "");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [avatar, setAvatar] = useState(user?.avatar || "user");
    const [gender, setGender] = useState(user?.gender || "other");
    const [speechEngine, setSpeechEngine] = useState(localStorage.getItem('speechEngine') || 'vosk');
    const [speechModel, setSpeechModel] = useState(localStorage.getItem('speechModel') || 'vosk-model-small-es-0.42');
    const [playSound, setPlaySound] = useState(() => localStorage.getItem('playSound') !== 'false');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [showPasswordFields, setShowPasswordFields] = useState(false);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            setError(t('profile.error_image_size'));
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setAvatar(reader.result); // Base64 string
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        if (showPasswordFields && password && password !== confirmPassword) {
            setError(t('profile.error_passwords_mismatch'));
            return;
        }

        setLoading(true);
        try {
            const body = { full_name: name, profile_image: avatar, gender: gender };
            if (showPasswordFields && password) body.password = password;

            const resp = await fetch('/api/v1/auth/me', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            const data = await resp.json();
            if (resp.ok) {
                localStorage.setItem('speechEngine', speechEngine);
                localStorage.setItem('speechModel', speechModel);
                localStorage.setItem('playSound', playSound.toString());
                login(data.access_token);
                setSuccess(true);
                setTimeout(() => onClose(), 1500);
            } else {
                setError(data.detail || t('profile.error_update'));
            }
        } catch (err) {
            console.error('Profile save error:', err);
            setError(t('verify.connection_error'));
        } finally {
            setLoading(false);
        }
    };

    const avatarGrid = React.useMemo(() => (
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-4 sm:gap-3">
            {DEFAULT_AVATARS.map((item) => {
                const Icon = item.icon;
                const isSelected = avatar === item.id;
                return (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => setAvatar(item.id)}
                        className={`aspect-square rounded-2xl flex items-center justify-center transition-all duration-300 transform ${item.color} ${isSelected 
                            ? 'scale-110 ring-4 ring-offset-4 ring-[#9CCBA8] dark:ring-offset-slate-900 shadow-xl z-10' 
                            : 'opacity-60 grayscale-[0.3] hover:opacity-100 hover:scale-105 hover:grayscale-0'}`}
                        title={item.id === 'user' ? 'Médico General' : item.id === 'cat' ? 'Clínica Felina' : 'Médico Especialista'}
                    >
                        <Icon size={isSelected ? 24 : 18} className="text-white transition-all" />
                    </button>
                );
            })}
        </div>
    ), [avatar]);

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6" style={{ backdropFilter: isEgo ? 'blur(4px)' : 'none' }}>
            {/* Simple solid dark background */}
            <div className="absolute inset-0 bg-zinc-950/80" onClick={onClose} />
            
            <div className={`relative w-full max-w-md overflow-hidden transition-all duration-300 animate-in fade-in duration-150 overflow-y-auto max-h-[92vh] sm:max-h-[90vh] ${isEgo ? 'bg-white dark:bg-[#111] rounded-none shadow-2xl' : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl'}`}>
                
                <div className="p-6 sm:p-8 pb-4">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white uppercase tracking-tight">{t('profile.title')}</h3>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Avatar Picker */}
                        <div className="space-y-3">
                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 ml-1 block mb-1">{t('profile.avatar_label')}</label>
                            
                            <div className="flex flex-col items-center gap-4 mb-4">
                                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                    <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-[#9CCBA8]/30 flex items-center justify-center overflow-hidden transition-all group-hover:border-[#9CCBA8]">
                                        {avatar && avatar.startsWith('data:') ? (
                                            <img src={avatar} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            (() => {
                                                const currentAvatar = DEFAULT_AVATARS.find(a => a.id === avatar);
                                                const Icon = currentAvatar?.icon || User;
                                                return (
                                                    <div className={`w-full h-full flex items-center justify-center text-white ${currentAvatar?.color || 'bg-[#9CCBA8]'}`}>
                                                        <Icon size={32} />
                                                    </div>
                                                );
                                            })()
                                        )}
                                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                            <Camera size={20} />
                                        </div>
                                    </div>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        className="hidden" 
                                        accept="image/*" 
                                        onChange={handleFileChange} 
                                    />
                                </div>
                            </div>

                            {avatarGrid}
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 ml-1 block mb-1">{t('profile.specialties')}</label>
                            <div className="flex gap-2">
                                {[
                                    { id: 'male', label: t('profile.specialties_dr'), full: 'Hombre' },
                                    { id: 'female', label: t('profile.specialties_dra'), full: 'Mujer' },
                                    { id: 'other', label: t('profile.specialties_other'), full: 'Otro' }
                                ].map((opt) => (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => setGender(opt.id)}
                                        className={`flex-1 py-2.5 text-xs font-bold transition-all duration-100 border ${gender === opt.id 
                                            ? 'bg-[#9CCBA8] border-[#9CCBA8] text-white shadow-md' 
                                            : 'bg-slate-100 dark:bg-zinc-950/50 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-zinc-900'} ${isEgo ? 'rounded-none' : 'rounded-xl'}`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 ml-1 block mb-1">{t('profile.name_label')}</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                    type="text" 
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className={`w-full pl-9 pr-4 py-2.5 outline-none transition-all text-sm dark:text-white ${isEgo ? 'bg-transparent border-0 border-b border-slate-200 dark:border-zinc-800 rounded-none focus:border-[#9CCBA8]' : 'bg-slate-100 dark:bg-zinc-950/50 border border-slate-200 dark:border-zinc-800 rounded-xl focus:border-[#9CCBA8]'}`}
                                    placeholder={t('profile.name_placeholder')}
                                />
                            </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/50">
                            <p className="text-xs font-bold uppercase tracking-widest text-[#9CCBA8] mb-4 leading-none">{t('profile.language')}</p>
                            
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setLanguage('es')}
                                    className={`flex-1 py-2.5 text-xs font-bold transition-all border flex items-center justify-center gap-2 ${language === 'es' ? 'bg-[#9CCBA8] border-[#9CCBA8] text-white shadow-lg' : 'bg-slate-100 dark:bg-zinc-950/50 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-zinc-900'} ${isEgo ? 'rounded-none' : 'rounded-xl'}`}
                                >
                                    <span>🇪🇸</span> {t('profile.lang_es')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setLanguage('en')}
                                    className={`flex-1 py-2.5 text-xs font-bold transition-all border flex items-center justify-center gap-2 ${language === 'en' ? 'bg-[#9CCBA8] border-[#9CCBA8] text-white shadow-lg' : 'bg-slate-100 dark:bg-zinc-950/50 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-zinc-900'} ${isEgo ? 'rounded-none' : 'rounded-xl'}`}
                                >
                                    <span>🇺🇸</span> {t('profile.lang_en')}
                                </button>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/50">
                            <p className="text-xs font-bold uppercase tracking-widest text-[#9CCBA8] mb-3 leading-none">{t('profile.voice_engine')}</p>
                            
                            <div className="space-y-3 mb-4 mt-3">
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSpeechEngine('vosk');
                                            setSpeechModel('vosk-model-small-es-0.42');
                                        }}
                                        className={`flex-1 py-2.5 text-xs font-bold transition-all border ${speechEngine === 'vosk' 
                                            ? 'bg-[#9CCBA8] border-[#9CCBA8] text-white shadow-lg' 
                                            : 'bg-slate-100 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-zinc-700 hover:border-slate-300' } ${isEgo ? 'rounded-none' : 'rounded-xl'}`}
                                    >
                                        Vosk
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSpeechEngine('whisper');
                                            setSpeechModel('base');
                                        }}
                                        className={`flex-1 py-2.5 text-xs font-bold transition-all border ${speechEngine === 'whisper' 
                                            ? 'bg-[#9CCBA8] border-[#9CCBA8] text-white shadow-lg' 
                                            : 'bg-slate-100 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-zinc-700 hover:border-slate-300'} ${isEgo ? 'rounded-none' : 'rounded-xl'}`}
                                    >
                                        Whisper
                                    </button>
                                </div>
                                {speechEngine === 'vosk' && (
                                    <select
                                        value={speechModel}
                                        onChange={(e) => setSpeechModel(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-100 dark:bg-zinc-950/50 border border-slate-200 dark:border-zinc-800 focus:border-[#9CCBA8] rounded-xl outline-none text-xs dark:text-white"
                                    >
                                        <option value="vosk-model-small-es-0.42">{t('profile.vosk_desc')}</option>
                                        <option value="vosk-model-es-0.42">{t('profile.vosk_full')}</option>
                                    </select>
                                )}
                                {speechEngine === 'whisper' && (
                                    <select
                                        value={speechModel}
                                        onChange={(e) => setSpeechModel(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-950/50 border border-transparent focus:border-[#9CCBA8] rounded-xl outline-none text-xs dark:text-white"
                                    >
                                        <option value="base">{t('profile.whisper_base')}</option>
                                        <option value="tiny">{t('profile.whisper_tiny')}</option>
                                        <option value="small">{t('profile.whisper_small')}</option>
                                        <option value="medium">{t('profile.whisper_medium')}</option>
                                        <option value="large">{t('profile.whisper_large')}</option>
                                    </select>
                                )}
                            </div>
                        </div>

                        {!user?.is_google && (
                            <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/50">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-xs font-bold uppercase tracking-widest text-[#9CCBA8] leading-none">{t('profile.security')}</p>
                                    <button 
                                        type="button"
                                        onClick={() => setShowPasswordFields(!showPasswordFields)}
                                        className="text-[10px] font-bold text-slate-400 hover:text-[#9CCBA8] transition-colors uppercase tracking-tight"
                                    >
                                        {showPasswordFields ? t('common.cancel') : t('auth.password')}?
                                    </button>
                                </div>
                                
                                {showPasswordFields && (
                                    <div className="space-y-3 animate-in slide-in-from-top-1 duration-200">
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input 
                                                type="password" 
                                                value={password}
                                                autoComplete="new-password"
                                                onChange={(e) => setPassword(e.target.value)}
                                                className={`w-full pl-9 pr-4 py-2.5 outline-none text-xs dark:text-white transition-all ${isEgo ? 'bg-transparent border-0 border-b border-slate-200 dark:border-zinc-800 rounded-none focus:border-[#9CCBA8]' : 'bg-slate-100 dark:bg-zinc-950/50 border border-slate-200 rounded-xl focus:border-[#9CCBA8] dark:border-zinc-800'}`}
                                                placeholder={t('profile.new_password')}
                                            />
                                        </div>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input 
                                                type="password" 
                                                value={confirmPassword}
                                                autoComplete="new-password"
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className={`w-full pl-9 pr-4 py-2.5 outline-none text-xs dark:text-white transition-all ${isEgo ? 'bg-transparent border-0 border-b border-slate-200 dark:border-zinc-800 rounded-none focus:border-[#9CCBA8]' : 'bg-slate-100 dark:bg-zinc-950/50 border border-slate-200 rounded-xl focus:border-[#9CCBA8] dark:border-zinc-800'}`}
                                                placeholder={t('profile.confirm_password')}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/50">
                            <p className="text-xs font-bold uppercase tracking-widest text-[#9CCBA8] mb-4 leading-none">{t('profile.interface_sound')}</p>
                            
                            <label className="flex items-center justify-between cursor-pointer group">
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-[#9CCBA8] transition-colors">{t('profile.sound_action')}</span>
                                <div className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out ${playSound ? 'bg-[#9CCBA8]' : 'bg-slate-200 dark:bg-zinc-800'}`}>
                                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${playSound ? 'translate-x-6' : 'translate-x-1'}`} />
                                    <input type="checkbox" className="sr-only" checked={playSound} onChange={(e) => setPlaySound(e.target.checked)} />
                                </div>
                            </label>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-500/10 text-red-500 text-[10px] rounded-lg">
                                {error}
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={loading || success}
                            className={`w-full py-3.5 font-bold transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 ${success ? 'bg-green-500 text-white' : isEgo ? 'bg-black dark:bg-white text-white dark:text-black rounded-none uppercase tracking-widest text-[10px]' : 'bg-[#9CCBA8] hover:bg-[#8DB998] text-white rounded-xl shadow-lg'}`}
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : success ? <Check className="w-4 h-4" /> : t('profile.save')}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};
