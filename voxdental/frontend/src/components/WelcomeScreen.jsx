import React, { useEffect, useState } from 'react';
import { User, Heart, Activity, Stethoscope, Shield, Award, Briefcase, Cat } from 'lucide-react';

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

export const WelcomeScreen = ({ user, onFinished }) => {
    const userName = user?.name;
    const userAvatar = user?.avatar;
    const userGender = user?.gender;
    const [isVisible, setIsVisible] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);

    useEffect(() => {
        const entryTimer = setTimeout(() => setIsVisible(true), 100);
        const exitTimer = setTimeout(() => setIsLeaving(true), 2200);
        const finishedTimer = setTimeout(() => onFinished(), 3000);
        return () => { clearTimeout(entryTimer); clearTimeout(exitTimer); clearTimeout(finishedTimer); };
    }, [onFinished]);

    const renderAvatarIcon = () => {
        if (userAvatar?.startsWith('http') || userAvatar?.startsWith('data:')) {
            return <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover rounded-3xl" />
        }
        const Icon = AVATAR_MAP[userAvatar] || User;
        return <Icon className="w-12 h-12 text-white relative z-10" />
    }

    const gradientClass = (userAvatar?.startsWith('http') || userAvatar?.startsWith('data:')) ? 'from-blue-600 to-purple-600' : (COLORS[userAvatar] || 'from-blue-600 to-purple-600');

    return (
        <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 transition-all duration-1000 ease-in-out ${isLeaving ? 'opacity-0 scale-110' : 'opacity-100'}`}>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full animate-pulse pointer-events-none" />
            
            <div className={`flex flex-col items-center transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                <div className={`w-24 h-24 bg-gradient-to-br ${gradientClass} rounded-3xl flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(37,99,235,0.4)] border border-white/10 relative overflow-hidden group`}>
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                    {renderAvatarIcon()}
                </div>

                <div className="text-center">
                    <h2 className="text-blue-400 font-bold tracking-[0.2em] uppercase text-sm mb-4 animate-pulse">Acceso Concedido</h2>
                    <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-2 px-4">
                        {userGender === 'male' ? 'Bienvenido, ' : userGender === 'female' ? 'Bienvenida, ' : 'Bienvenido/a, '}
                        <span className="block sm:inline bg-gradient-to-r from-white via-blue-100 to-blue-300 bg-clip-text text-transparent">
                            {userGender === 'male' ? 'Dr. ' : userGender === 'female' ? 'Dra. ' : ''}{userName || 'Usuario'}
                        </span>
                    </h1>
                    <div className="flex items-center justify-center gap-2 mt-6">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-2 h-2 rounded-full bg-blue-300 animate-bounce" />
                    </div>
                </div>
            </div>

            <div className="absolute bottom-12 text-slate-500 font-medium tracking-widest text-xs uppercase opacity-50">
                VoxDental • Sistema Odontológico Inteligente
            </div>
        </div>
    );
};
