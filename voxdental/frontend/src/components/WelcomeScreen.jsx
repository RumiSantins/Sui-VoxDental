import React, { useEffect, useState } from 'react';
import { User, Heart, Activity, Stethoscope, Shield, Award, Briefcase, Cat } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useScrollLock } from '../hooks/useScrollLock';

const AVATAR_MAP = {
    'user': User,
    'heart': Heart,
    'activity': Activity,
    'steth': Stethoscope,
    'shield': Shield,
    'award': Award,
    'case': Briefcase,
    'cat': Cat
}

const COLORS = {
    'user': 'from-blue-600 to-blue-400',
    'heart': 'from-red-600 to-red-400',
    'activity': 'from-green-600 to-green-400',
    'steth': 'from-purple-600 to-purple-400',
    'shield': 'from-indigo-600 to-indigo-400',
    'award': 'from-yellow-600 to-yellow-400',
    'case': 'from-slate-700 to-slate-500',
    'cat': 'from-rose-400 to-rose-300',
}

export const WelcomeScreen = ({ user, darkMode, onFinished }) => {
    const userName = user?.name;
    const userAvatar = user?.avatar;
    const userGender = user?.gender;
    const [isVisible, setIsVisible] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const { t } = useLanguage();
    useScrollLock();

    useEffect(() => {
        const entryTimer = setTimeout(() => setIsVisible(true), 100);
        const exitTimer = setTimeout(() => setIsLeaving(true), 2400);
        const finishedTimer = setTimeout(() => onFinished(), 3200);
        return () => { clearTimeout(entryTimer); clearTimeout(exitTimer); clearTimeout(finishedTimer); };
    }, [onFinished]);

    const renderAvatarIcon = () => {
        if (userAvatar?.startsWith('http') || userAvatar?.startsWith('data:')) {
            return <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
        }
        const Icon = AVATAR_MAP[userAvatar] || User;
        return <Icon className="w-16 h-16 text-white relative z-10" />
    }

    const gradientClass = (userAvatar?.startsWith('http') || userAvatar?.startsWith('data:')) ? 'from-[#9CCBA8] to-[#6BA07D]' : (COLORS[userAvatar] || 'from-[#9CCBA8] to-[#6BA07D]');

    return (
        <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-all duration-1000 ease-in-out overflow-hidden ${darkMode ? 'bg-[#0a0a0b]' : 'bg-[#FAFAF8]'} ${isLeaving ? 'opacity-0 scale-105 blur-2xl' : 'opacity-100'}`}>
            
            {/* Ambient background glows - Clean & Subtle */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {darkMode ? (
                    <>
                        <div className="absolute top-[-15%] right-[-10%] w-[70%] h-[70%] rounded-full bg-[#9CCBA8]/10 blur-[140px] animate-blob" />
                        <div className="absolute bottom-[-15%] left-[-10%] w-[70%] h-[70%] rounded-full bg-[#E8D1B6]/10 blur-[140px] animate-blob animation-delay-2000" />
                    </>
                ) : (
                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] blur-[120px] rounded-full animate-pulse opacity-40 bg-[#9CCBA8]/10`} />
                )}
                
                {/* Center Pulse Glow */}
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] blur-[160px] rounded-full transition-all duration-1000 ${isVisible ? 'opacity-40' : 'opacity-0'} ${darkMode ? 'bg-[#9CCBA8]/10' : 'bg-[#9CCBA8]/15'}`} />
            </div>

            <div className={`relative z-10 flex flex-col items-center transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                
                <div className="relative mb-10">
                    <div className={`w-32 h-32 bg-gradient-to-br ${gradientClass} rounded-full sm:rounded-3xl flex items-center justify-center shadow-2xl border-2 border-white/20 dark:border-zinc-800/80 relative overflow-hidden group/avatar`}>
                        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/avatar:translate-y-0 transition-transform duration-500" />
                        <div className="w-full h-full flex items-center justify-center scale-110">
                            {renderAvatarIcon()}
                        </div>
                    </div>
                </div>

                <div className="text-center max-w-2xl px-6">
                    <div className="overflow-hidden mb-6">
                        <h2 className="text-[#9CCBA8]/80 font-bold tracking-[0.4em] uppercase text-[10px] sm:text-xs animate-in slide-in-from-bottom duration-700">
                            {t('welcome.access_granted')}
                        </h2>
                    </div>

                    <h1 className={`text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter mb-4 leading-[0.95] ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        <span className="block opacity-70 mb-2">{userGender === 'male' ? t('welcome.welcome_male') : userGender === 'female' ? t('welcome.welcome_female') : t('welcome.welcome_generic')}</span>
                        <span className={`block bg-gradient-to-r bg-clip-text text-transparent ${darkMode ? 'from-white via-white to-[#9CCBA8]' : 'from-[#9CCBA8] via-[#8DB998] to-slate-900'}`}>
                            {userGender === 'male' ? t('welcome.dr_male') : userGender === 'female' ? t('welcome.dr_female') : t('welcome.dr_generic')}{userName || 'Usuario'}
                        </span>
                    </h1>

                    <div className="flex items-center justify-center gap-2.5 mt-10">
                        <div className="w-2 h-2 rounded-full bg-[#9CCBA8] shadow-[0_0_8px_rgba(156,203,168,0.4)] animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-2 h-2 rounded-full bg-[#9CCBA8]/50 animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-2 h-2 rounded-full bg-[#9CCBA8]/30 animate-bounce" />
                    </div>
                </div>
            </div>

            {/* Footer Tagline */}
            <div className={`absolute bottom-12 font-bold tracking-[0.4em] text-[10px] uppercase transition-all duration-1000 ${isVisible ? 'opacity-20' : 'opacity-0'} ${darkMode ? 'text-zinc-500' : 'text-slate-500'}`}>
                {t('welcome.footer')}
            </div>
        </div>
    );
};
