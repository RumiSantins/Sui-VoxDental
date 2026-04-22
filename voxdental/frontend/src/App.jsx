import { useState, useEffect, useCallback, lazy, Suspense, useRef } from 'react'
import { useAuth } from './context/AuthContext'
import { useLanguage } from './context/LanguageContext'
import { useTheme } from './context/ThemeContext'
import { Login } from './components/Login'
import { PatientSelector } from './components/PatientSelector'
import { 
  Settings, Loader2, LogOut, User as UserIcon, Heart, Activity, 
  Stethoscope, Shield, Dog, Briefcase, Cat 
} from 'lucide-react'
import { DesignToggle } from './components/DesignToggle'
import { SymbiosisLogo } from './components/SymbiosisLogo'

const AVATAR_ICONS = {
  heart: Heart,
  activity: Activity,
  steth: Stethoscope,
  shield: Shield,
  dog: Dog,
  case: Briefcase,
  cat: Cat,
  user: UserIcon
};

const AVATAR_COLORS = {
  heart: '#ef4444',    // bg-red-500
  activity: '#22c55e', // bg-green-500
  steth: '#a855f7',    // bg-purple-500
  shield: '#6366f1',   // bg-indigo-500
  dog: '#eab308',      // bg-yellow-500
  case: '#334155',     // bg-slate-700
  cat: '#fb7185',      // bg-rose-400
  user: '#3b82f6'      // bg-blue-500
};

// Lazy loaded components
const OdontogramView = lazy(() => import('./components/OdontogramView').then(m => ({ default: m.OdontogramView })));
const EgoSHome = lazy(() => import('./components/EgoSHome').then(m => ({ default: m.EgoSHome })));
const Register = lazy(() => import('./components/Register').then(m => ({ default: m.Register })));
const VerifyEmail = lazy(() => import('./components/VerifyEmail').then(m => ({ default: m.VerifyEmail })));
const WelcomeScreen = lazy(() => import('./components/WelcomeScreen').then(m => ({ default: m.WelcomeScreen })));
const ProfileModal = lazy(() => import('./components/ProfileModal').then(m => ({ default: m.ProfileModal })));
const AdminPanel = lazy(() => import('./components/AdminPanel').then(m => ({ default: m.AdminPanel })));

/**
 * Pantalla de carga PREMIUM con el logo SIMBIOSIS.
 */
const PremiumLoading = () => {
  const { t } = useLanguage();
  const [consolidated, setConsolidated] = useState(false);

  useEffect(() => {
    // Iniciar la metamorfosis de consolidación después de 1 segundo de serpenteo
    const timer = setTimeout(() => setConsolidated(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[500] overflow-hidden" style={{ backgroundColor: 'var(--bg-main)' }}>
      {/* Haz de escaneo horizontal (Sutil) */}
      <div className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#9CCBA8]/30 to-transparent animate-scan z-10" />

      {/* Fondos ambientales sutiles */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-30">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#9CCBA8]/10 blur-[120px] rounded-full animate-blob" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#E8D1B6]/10 blur-[120px] rounded-full animate-blob animation-delay-2000" />
      </div>

        <div className="relative flex flex-col items-center gap-12 z-20">
          <div className="relative flex items-center justify-center" style={{ width: '900px', height: '900px' }}>
            {/* Resplandor externo ampliado */}
            <div className={`absolute inset-[-200px] bg-[#9CCBA8]/10 blur-[180px] rounded-full transition-opacity duration-[2000ms] ${consolidated ? 'opacity-40' : 'opacity-100'}`} />
            <SymbiosisLogo size={900} className="premium-logo-force" animating={true} consolidated={consolidated} />
          </div>

        <div className={`space-y-4 text-center transition-all duration-[1500ms] ${consolidated ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <h3 className="text-[12px] font-black uppercase tracking-[0.6em] text-[#9CCBA8] drop-shadow-sm">
            VoxDental Intelligence
          </h3>
          <p className="text-[10px] font-bold text-[var(--text-tert)] uppercase tracking-[0.3em] opacity-40">Sistema Consolidado</p>
        </div>
      </div>
    </div>
  );
};

/**
 * Carga Discreta (Totalmente silenciosa).
 */
const DiscretLoading = () => (
  <div className="fixed inset-0 flex items-center justify-center z-[500]" style={{ backgroundColor: 'var(--bg-main)' }}>
    <div className="flex flex-col items-center gap-3 opacity-100">
      <Loader2 className="w-8 h-8 text-[#9CCBA8] animate-spin" />
      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#9CCBA8]/60">Sincronizando</span>
    </div>
  </div>
);

export default function App() {
  const { user, token, logout } = useAuth()
  const { t, language, toggleLanguage } = useLanguage()
  const { isDark, toggleMode, design, toggleDesign } = useTheme()

  // Flag para detectar si el usuario ha pulsado el botón de login recientemente
  const [isManualLogin, setIsManualLogin] = useState(false);

  const [showWelcome, setShowWelcome] = useState(false)

  // Usamos sessionStorage para que la bienvenida solo aparezca UNA VEZ por sesión de pestaña
  const [hasShownWelcome, setHasShownWelcome] = useState(() => {
    return sessionStorage.getItem('welcome_shown') === 'true';
  })

  const [showProfile, setShowProfile] = useState(false)
  const [currentView, setCurrentView] = useState('main')
  const [selectedPatient, setSelectedPatient] = useState(null)

  const [authView, setAuthView] = useState(() => {
    const path = window.location.pathname;
    if (path.includes('/verify')) return 'verify';
    if (path.includes('/login')) return 'login';
    if (path.includes('/register')) return 'register';
    return 'home';
  })

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.includes('/verify')) setAuthView('verify');
      else if (path.includes('/login')) setAuthView('login');
      else if (path.includes('/register')) setAuthView('register');
      else setAuthView('home');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = useCallback((view) => {
    setAuthView(view);
    const path = view === 'home' ? '/' : `/${view}`;
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
  }, []);

  useEffect(() => {
    // CAMBIO CRÍTICO: Solo mostrar bienvenida si NO se ha mostrado en esta sesión Y venimos de un login manual
    // Si refrescamos la página, hasShownWelcome será true (desde sessionStorage) y se saltará esto.
    if (user && !hasShownWelcome && isManualLogin) {
      setShowWelcome(true)
      setHasShownWelcome(true)
      sessionStorage.setItem('welcome_shown', 'true');
      // Aseguramos apagar el modo manual una vez consumido
      setTimeout(() => setIsManualLogin(false), 4000);
    } else if (user && !hasShownWelcome) {
      setHasShownWelcome(true);
      sessionStorage.setItem('welcome_shown', 'true');
    } else if (!user && hasShownWelcome) {
      // Si no hay user, resetear el flag para el siguiente login
      setHasShownWelcome(false);
    }
  }, [user, hasShownWelcome, isManualLogin])

  const handleManualLoginStart = () => {
    setIsManualLogin(true);
  };

  const handleManualLogout = () => {
    sessionStorage.removeItem('welcome_shown');
    setHasShownWelcome(false);
    setIsManualLogin(false);
    logout();
  };

  if (currentView === 'admin') {
    return (
      <Suspense fallback={<DiscretLoading />}>
        <AdminPanel token={token} onBack={() => setCurrentView('main')} />
      </Suspense>
    );
  }

  // SI NO HAY USUARIO
  if (!user) {
    return (
      <Suspense fallback={isManualLogin ? <PremiumLoading /> : <DiscretLoading />}>
        {authView === 'home' ? <EgoSHome onLogin={() => navigateTo('login')} onRegister={() => navigateTo('register')} language={language} onToggleLanguage={toggleLanguage} /> :
          authView === 'verify' ? <VerifyEmail onBackToLogin={() => navigateTo('login')} /> :
            authView === 'login' ? <Login onLoginStart={handleManualLoginStart} onSwitch={() => navigateTo('register')} onAdminAccess={() => setCurrentView('admin')} /> :
              <Register onSwitch={() => navigateTo('login')} />}
      </Suspense>
    );
  }

  // SI HAY USUARIO
  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}>
      {showWelcome && (
        <Suspense fallback={null}>
          <WelcomeScreen user={user} darkMode={isDark} onFinished={() => setShowWelcome(false)} />
        </Suspense>
      )}

      <header className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-30 print:hidden">
        <div className="flex items-center justify-between gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowProfile(true)}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm border border-white/10 overflow-hidden group hover:scale-105 active:scale-95 transition-all"
              style={{ backgroundColor: AVATAR_COLORS[user?.avatar] || '#9CCBA8' }}
            >
              {user?.avatar ? (
                user.avatar.startsWith('data:') ? (
                  <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  (() => {
                    const Icon = AVATAR_ICONS[user.avatar] || Settings;
                    return <Icon size={20} />;
                  })()
                )
              ) : (
                <Settings size={20} className="group-hover:rotate-45 transition-transform" />
              )}
            </button>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-[#9CCBA8] to-[#E8D1B6] bg-clip-text text-transparent tracking-tighter">SuiVoxDental</h1>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowProfile(true)} className="p-1.5 text-gray-400 hover:text-[#9CCBA8] hover:bg-[#9CCBA8]/10 rounded-lg transition-all"><Settings size={14} /></button>
                  {(() => {
                    const model = localStorage.getItem('speechModel') || 'vosk-model-small-es-0.42';
                    if (model !== 'base') {
                      return (
                        <span className="text-[8px] sm:text-[10px] font-black text-amber-500 animate-pulse uppercase tracking-widest whitespace-nowrap bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                          {t('profile.whisper_recommend_hint_short')}
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 font-semibold tracking-tight mt-0.5">{user?.name || user?.email}</p>
            </div>
          </div>
        </div>

        <div className="flex w-full sm:w-auto gap-3 items-center justify-center sm:justify-end border-t sm:border-none border-gray-100 dark:border-slate-800/50 pt-3 sm:pt-0">
          <div className="pr-3 border-r border-gray-100 dark:border-slate-800/50 hidden sm:block">
            <DesignToggle />
          </div>
          {/* En móvil, lo mostramos aparte para que tenga su propio espacio */}
          <div className="sm:hidden">
            <DesignToggle />
          </div>
          <PatientSelector selectedPatient={selectedPatient} onSelect={setSelectedPatient} />
          <button 
            onClick={handleManualLogout} 
            className="absolute top-4 right-4 sm:relative sm:top-auto sm:right-auto p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all flex items-center gap-2 font-black uppercase text-[10px] tracking-widest leading-none ring-1 ring-red-500/10 sm:ring-0"
          >
            <LogOut size={16} /> {t('app.logout')}
          </button>
        </div>
      </header>

      <Suspense fallback={<DiscretLoading />}>
        {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
        <div className="relative z-10 px-0 sm:px-6">
          <OdontogramView patient={selectedPatient} darkMode={isDark} onToggleTheme={toggleMode} design={design} onToggleDesign={toggleDesign} />
        </div>
      </Suspense>

      <footer className="mt-8 pb-12 text-center border-t border-gray-100 dark:border-zinc-800/50 opacity-40">
        <p className="mt-8 text-[11px] font-bold tracking-[0.2em] uppercase text-slate-400 dark:text-zinc-600">
          {t('app.title')} {t('app.system_info')}
        </p>
      </footer>
    </div>
  )
}
