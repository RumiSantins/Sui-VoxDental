import React, { useState, useRef } from 'react';
import { User, Lock, X, Check, Loader2, AlertCircle, Heart, Activity, Stethoscope, Shield, Award, Briefcase, Camera, Image as ImageIcon, Cat } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DEFAULT_AVATARS = [
    { id: 'user', icon: User, color: 'bg-blue-500' },
    { id: 'heart', icon: Heart, color: 'bg-red-500' },
    { id: 'activity', icon: Activity, color: 'bg-green-500' },
    { id: 'steth', icon: Stethoscope, color: 'bg-purple-500' },
    { id: 'shield', icon: Shield, color: 'bg-indigo-500' },
    { id: 'award', icon: Award, color: 'bg-yellow-500' },
    { id: 'case', icon: Briefcase, color: 'bg-slate-700' },
    { id: 'cat', icon: Cat, color: 'bg-rose-400' },
];

export const ProfileModal = ({ onClose }) => {
    const { user, token, login } = useAuth();
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

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            setError("La imagen es demasiado grande (máx 2MB)");
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

        if (password && password !== confirmPassword) {
            setError("Las contraseñas no coinciden");
            return;
        }

        setLoading(true);
        try {
            const body = { full_name: name, profile_image: avatar, gender: gender };
            if (password) body.password = password;

            const resp = await fetch('http://localhost:8000/api/v1/auth/me', {
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
                setError(data.detail || "Error al actualizar perfil");
            }
        } catch (err) {
            setError("Error de conexión con el servidor");
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
                            ? 'scale-110 ring-4 ring-offset-4 ring-blue-500 dark:ring-offset-slate-900 shadow-xl z-10' 
                            : 'opacity-60 grayscale-[0.3] hover:opacity-100 hover:scale-105 hover:grayscale-0'}`}
                        title={item.id === 'user' ? 'Médico General' : item.id === 'cat' ? 'Clínica Felina' : 'Médico Especialista'}
                    >
                        <Icon size={isSelected ? 24 : 18} className="text-white transition-all" />
                    </button>
                );
            })}
        </div>
    ), [avatar]);

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6">
            {/* Simple solid dark background */}
            <div className="absolute inset-0 bg-slate-950/80" onClick={onClose} />
            
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] border border-gray-200 dark:border-blue-900/30 overflow-hidden animate-in fade-in duration-150 overflow-y-auto max-h-[92vh] sm:max-h-[90vh]">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-600" />
                
                <div className="p-6 sm:p-8 pb-4">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white uppercase tracking-tight">Mi Perfil</h3>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-gray-400 transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Avatar Picker */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Avatar de Perfil</label>
                            
                            <div className="flex flex-col items-center gap-4 mb-4">
                                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                    <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-blue-500/30 flex items-center justify-center overflow-hidden transition-all group-hover:border-blue-500">
                                        {avatar && avatar.startsWith('data:') ? (
                                            <img src={avatar} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            (() => {
                                                const currentAvatar = DEFAULT_AVATARS.find(a => a.id === avatar);
                                                const Icon = currentAvatar?.icon || User;
                                                return (
                                                    <div className={`w-full h-full flex items-center justify-center text-white ${currentAvatar?.color || 'bg-blue-500'}`}>
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
                            <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Especialidad</label>
                            <div className="flex gap-2">
                                {[
                                    { id: 'male', label: 'Dr.', full: 'Hombre' },
                                    { id: 'female', label: 'Dra.', full: 'Mujer' },
                                    { id: 'other', label: '---', full: 'Otro' }
                                ].map((opt) => (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => setGender(opt.id)}
                                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-colors duration-100 border ${gender === opt.id 
                                            ? 'bg-blue-600 border-blue-600 text-white' 
                                            : 'bg-gray-50 dark:bg-slate-950 border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-900'}`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Nombre</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input 
                                    type="text" 
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-transparent focus:border-blue-500 rounded-xl outline-none text-sm dark:text-white"
                                    placeholder="Tu nombre"
                                />
                            </div>
                        </div>

                        <div className="pt-2 border-t border-gray-100 dark:border-slate-800/50">
                            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-4">Motor de Voz</p>
                            
                            <div className="space-y-3 mb-4">
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSpeechEngine('vosk');
                                            setSpeechModel('vosk-model-small-es-0.42');
                                        }}
                                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-colors border ${speechEngine === 'vosk' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-gray-50 dark:bg-slate-950 border-transparent text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-900'}`}
                                    >
                                        Vosk
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSpeechEngine('whisper');
                                            setSpeechModel('base');
                                        }}
                                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-colors border ${speechEngine === 'whisper' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-gray-50 dark:bg-slate-950 border-transparent text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-900'}`}
                                    >
                                        Whisper
                                    </button>
                                </div>
                                {speechEngine === 'vosk' && (
                                    <select
                                        value={speechModel}
                                        onChange={(e) => setSpeechModel(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-950 border border-transparent focus:border-blue-500 rounded-xl outline-none text-xs dark:text-white"
                                    >
                                        <option value="vosk-model-small-es-0.42">Vosk Small (Recomendado - Súper Rápido, 40MB)</option>
                                        <option value="vosk-model-es-0.42">Vosk Full ES (Lento pero Preciso, 1.4GB)</option>
                                    </select>
                                )}
                                {speechEngine === 'whisper' && (
                                    <select
                                        value={speechModel}
                                        onChange={(e) => setSpeechModel(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-950 border border-transparent focus:border-blue-500 rounded-xl outline-none text-xs dark:text-white"
                                    >
                                        <option value="base">Whisper Base (Recomendado - Rápido, muy equilibrado)</option>
                                        <option value="tiny">Whisper Tiny (Instántaneo, menos preciso pero ligero)</option>
                                        <option value="small">Whisper Small (Preciso, velocidad moderada)</option>
                                        <option value="medium">Whisper Medium (Súper Preciso, mayor carga de memoria)</option>
                                        <option value="large">Whisper Large (Claridad Total, pero muy lento)</option>
                                    </select>
                                )}
                            </div>
                        </div>

                        {!user?.is_google && (
                            <div className="pt-2 border-t border-gray-100 dark:border-slate-800/50">
                                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-4">Seguridad</p>
                                
                                <div className="space-y-2">
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input 
                                            type="password" 
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-transparent focus:border-blue-500 rounded-xl outline-none text-xs dark:text-white"
                                            placeholder="Nueva clave"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="pt-2 border-t border-gray-100 dark:border-slate-800/50">
                            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-4">Interfaz y Sonido</p>
                            
                            <label className="flex items-center justify-between cursor-pointer group">
                                <span className="text-xs font-bold text-gray-600 dark:text-slate-400 group-hover:text-blue-500 transition-colors">Sonido de Acción (Aciertos/Errores)</span>
                                <div className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out ${playSound ? 'bg-blue-600' : 'bg-gray-200 dark:bg-slate-700'}`}>
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
                            className={`w-full py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${success ? 'bg-green-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95 disabled:opacity-50'}`}
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : success ? <Check className="w-4 h-4" /> : "GUARDAR"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
