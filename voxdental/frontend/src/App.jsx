import { useState, useEffect, useCallback, memo, lazy, Suspense } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { useLanguage } from './context/LanguageContext'
import { Login } from './components/Login'
import { PatientSelector } from './components/PatientSelector'
import { Settings, Heart, Activity, Stethoscope, Shield, Dog, Briefcase, User as UserIcon, Cat, Loader2, LogOut } from 'lucide-react'

// Lazy loaded components for better performance
const OdontogramView = lazy(() => import('./components/OdontogramView').then(m => ({ default: m.OdontogramView })));
const Register = lazy(() => import('./components/Register').then(m => ({ default: m.Register })));
const VerifyEmail = lazy(() => import('./components/VerifyEmail').then(m => ({ default: m.VerifyEmail })));
const WelcomeScreen = lazy(() => import('./components/WelcomeScreen').then(m => ({ default: m.WelcomeScreen })));
const ProfileModal = lazy(() => import('./components/ProfileModal').then(m => ({ default: m.ProfileModal })));
const AdminPanel = lazy(() => import('./components/AdminPanel').then(m => ({ default: m.AdminPanel })));

const LoadingFallback = () => {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-sm font-black uppercase tracking-widest text-blue-600/60 animate-pulse">{t('app.loading')}</p>
      </div>
    </div>
  );
};

const AVATAR_MAP = {
  'user': UserIcon,
  'heart': Heart,
  'activity': Activity,
  'steth': Stethoscope,
  'shield': Shield,
  'dog': Dog,
  'case': Briefcase,
  'cat': Cat
}

function AppContent() {
  const { user, token, logout } = useAuth()
  const { t } = useLanguage()
  const [showWelcome, setShowWelcome] = useState(false)
  const [hasShownWelcome, setHasShownWelcome] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [currentView, setCurrentView] = useState('main') // 'main' or 'admin'

  const renderAvatar = (user, size = 32) => {
    if (!user?.avatar) return <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white"><UserIcon size={size * 0.6} /></div>

    if (user.avatar.startsWith('http') || user.avatar.startsWith('data:')) {
      return (
        <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-200 dark:border-blue-900/30 shadow-md">
          <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
        </div>
      )
    }

    const Icon = AVATAR_MAP[user.avatar] || UserIcon
    const colors = {
      'user': 'bg-blue-500',
      'heart': 'bg-red-500',
      'activity': 'bg-green-500',
      'steth': 'bg-purple-500',
      'shield': 'bg-indigo-500',
      'dog': 'bg-yellow-500',
      'case': 'bg-slate-700',
      'cat': 'bg-rose-400',
    }

    return (
      <div className={`w-10 h-10 ${colors[user.avatar] || 'bg-blue-500'} rounded-xl flex items-center justify-center text-white shadow-lg`}>
        <Icon size={size * 0.6} />
      </div>
    )
  }

  const [authView, setAuthView] = useState(() => {
    // Check if we are in verification flow
    if (window.location.search.includes('token=') && window.location.pathname.includes('/verify')) {
      return 'verify'
    }
    return 'login'
  })
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark'
  })
  const [selectedPatient, setSelectedPatient] = useState(null)

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
      document.body.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      document.body.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [darkMode])

  useEffect(() => {
    // Reset selected patient when user changes (login/logout/different profile)
    setSelectedPatient(null)

    // Manage welcome screen
    if (user && !hasShownWelcome) {
      setShowWelcome(true)
      setHasShownWelcome(true)
    } else if (!user) {
      setHasShownWelcome(false)
    }
  }, [user, hasShownWelcome])

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => !prev)
  }, [])

  if (currentView === 'admin') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <AdminPanel token={token} onBack={() => setCurrentView('main')} />
      </Suspense>
    );
  }

  if (!user) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        {authView === 'verify' ? (
          <VerifyEmail onBackToLogin={() => setAuthView('login')} />
        ) : authView === 'login' ? (
          <Login onSwitch={() => setAuthView('register')} onAdminAccess={() => setCurrentView('admin')} />
        ) : (
          <Register onSwitch={() => setAuthView('login')} />
        )}
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 relative overflow-x-hidden">
      <Suspense fallback={<LoadingFallback />}>
        {showWelcome && (
          <WelcomeScreen
            user={user}
            darkMode={darkMode}
            onFinished={() => setShowWelcome(false)}
          />
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 relative z-30 print:hidden">
          <div className="flex items-center justify-between gap-3 sm:gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-3 sm:gap-4">
              {renderAvatar(user)}
              <div className="flex flex-col">
                <div className="flex items-center gap-2 sm:gap-3">
                  <h1 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tighter">{t('app.title')}</h1>
                  <button
                    onClick={() => setShowProfile(true)}
                    className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all shrink-0"
                    title={t('app.profile_settings')}
                  >
                    <Settings size={14} />
                  </button>
                  <span className="inline-flex px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[8px] sm:text-[9px] font-black uppercase tracking-tighter rounded-md border border-amber-200 dark:border-amber-800/50 animate-pulse shadow-sm whitespace-nowrap">
                    Whisper Base recomendado
                  </span>

                </div>
                <p className="text-[10px] sm:text-xs text-slate-500 font-semibold tracking-tight truncate max-w-[150px] sm:max-w-none mt-0.5">
                  {user.gender === 'male' ? t('app.dr_male') : user.gender === 'female' ? t('app.dr_female') : ''}{user.name || user.email}
                </p>
              </div>
            </div>

            <button
              onClick={logout}
              className="sm:hidden flex items-center justify-center p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all border border-slate-200 dark:border-zinc-800 hover:border-red-200 dark:hover:border-red-500/30"
              title={t('app.logout')}
            >
              <LogOut size={16} />
            </button>
          </div>

          <div className="flex w-full sm:w-auto gap-3 items-center justify-center sm:justify-end border-t sm:border-none border-gray-100 dark:border-slate-800/50 pt-3 sm:pt-0">
            <div className="w-full sm:w-auto">
              <PatientSelector
                selectedPatient={selectedPatient}
                onSelect={setSelectedPatient}
              />
            </div>
            <button
              onClick={logout}
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-zinc-900 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all shadow-sm border border-slate-200 dark:border-zinc-800 hover:border-red-200 dark:hover:border-red-500/30 text-xs font-bold uppercase tracking-wider"
            >
              <LogOut size={14} className="stroke-[2.5]" />
              {t('app.logout')}
            </button>
          </div>
        </div>

        {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}

        <div className="relative z-10">
          <OdontogramView
            darkMode={darkMode}
            onToggleTheme={toggleDarkMode}
            patient={selectedPatient}
          />
        </div>

        <footer className="mt-8 pb-12 text-center border-t border-gray-100 dark:border-zinc-800/50">
          <p className="mt-8 text-[11px] font-bold tracking-[0.2em] uppercase text-slate-400 dark:text-zinc-600">
            {t('app.title')} {t('app.system_info')}
          </p>
          <p className="mt-2 text-[10px] font-medium text-slate-400 dark:text-zinc-600">
            {t('app.made_by')} <span className="text-slate-500 dark:text-zinc-400">Felipe Santillan</span> •
            <a href="https://fausto.app/" target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">Fausto</a>
          </p>
        </footer>
      </Suspense>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
