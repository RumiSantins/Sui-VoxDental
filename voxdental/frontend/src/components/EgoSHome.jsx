/* Página de presentación de EgoS.
   Usa CSS custom properties vía ThemeContext para adaptarse a los 4 temas del sistema de diseño.
   Incluye los toggles de Diseño (Ego/Sui) y Modo (Oscuro/Claro) en el header. */
import React, { useState, useEffect } from 'react';
import { Sun, Moon, Languages } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { DesignToggle } from './DesignToggle';

export const EgoSHome = ({ onLogin, onRegister, language = 'es', onToggleLanguage }) => {
    const { isDark, toggleMode, isEgo } = useTheme();
    const [isMobile, setIsMobile] = useState(false);
    const [scrollY, setScrollY] = useState(0);
    const [maxScroll, setMaxScroll] = useState(0);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 640);
            setMaxScroll(document.documentElement.scrollHeight - window.innerHeight);
        };
        const handleScroll = () => setScrollY(window.scrollY);
        
        handleResize();
        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleScroll, { passive: true });
        
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    // Recalculate maxScroll when content height might change (e.g. after design toggle)
    useEffect(() => {
        const timer = setTimeout(() => {
            setMaxScroll(document.documentElement.scrollHeight - window.innerHeight);
        }, 500);
        return () => clearTimeout(timer);
    }, [isEgo]);

    const badges = {
        active: {
            bg: 'rgba(156, 203, 168, 0.12)',
            border: '#9CCBA8',
            text: isDark ? '#9CCBA8' : '#1A7A42'
        },
        upcoming: {
            bg: isDark ? 'rgba(204,204,204,0.10)' : '#F3F3F3',
            border: '#CCCCCC',
            text: '#777777'
        }
    };

    const i18n = {
        es: {
            login: "Iniciar sesión",
            register: "Registrarse",
            heroSub: "v1.1.0 — Sistema activo",
            heroTitle: <>EgoS: Inteligencia con Alma.<br />Tecnología para la Vida.</>,
            heroDesc: "Donde la precisión de Ego se encuentra con la fluidez de Sui para transformar la consulta dental.",
            timelineTitle: "EXTENSIONES DEL ECOSISTEMA",
            projects: [
                {
                    meta: "módulo/dental · odontología clínica",
                    title: "SuiVoxDental",
                    desc: "Captura de odontograma y registros clínicos mediante entrada por voz. Integración directa con flujo de consulta dental.",
                    badge: "Activo",
                    isActive: true
                },
                {
                    meta: "módulo/therapy · próximamente",
                    title: "SuiTherapy",
                    desc: "Registro de sesiones terapéuticas y notas de evolución clínica optimizadas.",
                    badge: "Próximamente"
                },
                {
                    meta: "módulo/derma · próximamente",
                    title: "SuiDerma",
                    desc: "Registro y seguimiento dermatológico con soporte de descripción por voz.",
                    badge: "Próximamente"
                },
                {
                    meta: "módulo/vet · próximamente",
                    title: "SuiVet",
                    desc: "Rama veterinaria. Un guiño al origen de EgoS: los gatos Sui y Ego.",
                    badge: "Próximamente"
                }
            ],
            originSub: "ORIGEN",
            originTitle: "El nombre tiene historia.",
            originP1: "EgoS nace de dos gatos: Sui y Ego. Sui representa la fluidez, la intuición y la escucha — el motor de voz que transforma palabras en datos. Ego representa la estructura, la identidad clínica y la precisión — la base que valida y organiza el conocimiento médico.",
            originP2: "Juntos, forman un sistema con carácter: diseñado para escuchar, entender y crecer junto a los profesionales de la salud.",
            rights: "© 2026 EgoS · Todos los derechos reservados",
            madeBy: "Hecho por"
        },
        en: {
            login: "Log in",
            register: "Register",
            heroSub: "v1.1.0 — Active system",
            heroTitle: <>EgoS: Intelligence with Soul.<br />Technology for Life.</>,
            heroDesc: "Where Ego's precision meets Sui's fluidity to transform medical consultations.",
            timelineTitle: "ECOSYSTEM EXTENSIONS",
            projects: [
                {
                    meta: "module/dental · clinical dentistry",
                    title: "SuiVoxDental",
                    desc: "Odontogram capture and clinical records via voice input. Direct integration with dental consultation workflow.",
                    badge: "Active",
                    isActive: true
                },
                {
                    meta: "module/therapy · upcoming",
                    title: "SuiTherapy",
                    desc: "Therapy sessions recording and AI-optimized clinical evolution notes.",
                    badge: "Upcoming"
                },
                {
                    meta: "module/derma · upcoming",
                    title: "SuiDerma",
                    desc: "Dermatological tracking and recording with voice description support.",
                    badge: "Upcoming"
                },
                {
                    meta: "module/vet · upcoming",
                    title: "SuiVet",
                    desc: "Veterinary branch. A nod to EgoS's origins: the cats Sui and Ego.",
                    badge: "Upcoming"
                }
            ],
            originSub: "ORIGIN",
            originTitle: "The name has a history.",
            originP1: "EgoS is born from two cats: Sui and Ego. Sui represents fluidity, intuition, and listening — the voice engine transforming words into data. Ego represents structure, clinical identity, and precision — the foundation that validates medical knowledge.",
            originP2: "Together, they form a system with character: designed to listen, understand, and grow alongside health professionals.",
            rights: "© 2026 EgoS · All rights reserved",
            madeBy: "Made by"
        }
    };

    const t = i18n[language] || i18n.es;

    const blobBaseOpacity = isEgo 
        ? (isDark ? 0.18 : 0.45) 
        : (isDark ? 0.08 : 0.35);
    
    const scrollFadeTop = Math.max(0, 1 - scrollY / 600);
    // Appear when 600px from bottom, reach full opacity at bottom
    const scrollFadeBottom = maxScroll > 0 
        ? Math.min(1, Math.max(0, (scrollY - (maxScroll - 600)) / 400)) 
        : 0;
    const dynamicBlur = 100 + (scrollY * 0.05);

    return (
        <div style={{
            backgroundColor: 'var(--bg-main)',
            color: 'var(--text-main)',
            minHeight: '100vh',
            fontFamily: 'var(--font-body)',
            transition: 'background-color 200ms linear, color 200ms linear',
        }}>
            {/* Ambient Blobs — react to scroll fade */}
            <div style={{
                position: 'fixed', top: '-10%', left: '-5%', width: '60%', height: '60%',
                backgroundColor: `rgba(156, 203, 168, ${blobBaseOpacity * scrollFadeTop})`,
                filter: `blur(${dynamicBlur}px)`, borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
                transition: 'transform 1s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.8s ease-out',
                transform: `translate(${scrollY * 0.05}px, ${scrollY * 0.12}px)`
            }} />
            <div style={{
                position: 'fixed', bottom: '-15%', right: '-10%', width: '60%', height: '60%',
                backgroundColor: `rgba(232, 209, 182, ${blobBaseOpacity * 0.9 * scrollFadeBottom})`,
                filter: `blur(${dynamicBlur}px)`, borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
                transition: 'transform 1s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.8s ease-out',
                transform: `translate(${(maxScroll - scrollY) * 0.05}px, ${(maxScroll - scrollY) * 0.05}px)`
            }} />

            {/* Header */}
            <header style={{
                position: 'sticky', top: 0,
                backgroundColor: 'var(--bg-header)',
                backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                borderBottom: '1px solid var(--border-subtle)',
                height: '76px', zIndex: 50,
                transition: 'background-color 200ms linear',
            }}>
                <div style={{
                    maxWidth: '800px', margin: '0 auto',
                    padding: isMobile ? '0 16px' : '0 24px',
                    height: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    {/* Logo + Brand */}
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: isMobile ? '6px' : '10px', minWidth: 0 }}>
                        <img src="/logo.png" alt="EgoS Logo" style={{ height: isMobile ? '38px' : '48px', width: 'auto', objectFit: 'contain' }} />
                        <span style={{
                            fontSize: isMobile ? '16px' : '18px', fontWeight: 900,
                            background: 'linear-gradient(to right, #9CCBA8, #E8D1B6)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            letterSpacing: '-0.02em', flexShrink: 0, lineHeight: 1.1, paddingTop: '2px'
                        }}>EgoS</span>
                    </div>

                    {/* Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '12px', flexShrink: 0 }}>
                        {/* Design toggle — hidden on very small mobile */}
                        {!isMobile && <DesignToggle />}

                        {/* Mode toggle */}
                        <button
                            onClick={toggleMode}
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-sec)', cursor: 'pointer', display: 'flex', padding: 0 }}
                            title="Cambiar Modo"
                        >
                            {isDark ? <Sun size={isMobile ? 16 : 20} /> : <Moon size={isMobile ? 16 : 20} />}
                        </button>

                        {/* Language */}
                        <button
                            onClick={onToggleLanguage}
                            style={{
                                background: 'transparent', border: 'none', color: 'var(--text-sec)',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                                padding: 0, fontSize: isMobile ? '10px' : '12px', fontWeight: 600,
                                textTransform: 'uppercase', fontFamily: 'var(--font-mono)'
                            }}
                            title="Change Language"
                        >
                            <Languages size={isMobile ? 12 : 15} />
                            {!isMobile && language}
                        </button>

                        {/* Login */}
                        <button
                            id="login-btn-ego"
                            className="login-btn-editorial"
                            onClick={onLogin}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                outline: 'none',
                                color: 'var(--text-sec)',
                                padding: isMobile ? '4px 8px' : '6px 16px',
                                fontSize: isMobile ? '11px' : '13px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                transition: 'all 200ms ease',
                                fontFamily: 'var(--font-body)',
                                textTransform: isEgo ? 'uppercase' : 'none',
                                letterSpacing: '0.1em',
                                transform: 'none'
                            }}
                            onMouseOver={e => e.currentTarget.style.opacity = '0.6'}
                            onMouseOut={e => e.currentTarget.style.opacity = '1'}
                        >
                            <span>{t.login}</span>
                        </button>

                        {/* Register */}
                        <button
                            onClick={onRegister}
                            style={{
                                background: 'var(--accent)', color: '#ffffff', border: 'none',
                                padding: isMobile ? '4px 10px' : '6px 20px',
                                borderRadius: isEgo ? '0px' : 'var(--radius-lg)', fontSize: isMobile ? '10px' : '12px',
                                fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                                transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
                                boxShadow: isEgo ? 'none' : '0 8px 16px -4px rgba(156,203,168,0.4)',
                                fontFamily: 'var(--font-body)',
                                textTransform: isEgo ? 'uppercase' : 'none',
                                letterSpacing: isEgo ? '0.1em' : 'normal'
                            }}
                            onMouseOver={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                            onMouseOut={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                            {t.register}
                        </button>
                    </div>
                </div>
            </header>

            <main style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 10 }}>

                {/* Hero Section */}
                <section style={{
                    paddingTop: isEgo ? '120px' : '60px',
                    paddingBottom: isEgo ? '120px' : '60px',
                    marginTop: isEgo ? '0' : '40px',
                    borderBottom: isEgo ? '1px solid var(--border-subtle)' : 'none',
                    backgroundColor: isEgo ? 'transparent' : 'var(--bg-surface)',
                    borderRadius: isEgo ? '0' : 'var(--radius-lg)',
                    paddingLeft: isEgo ? '0' : '40px',
                    paddingRight: isEgo ? '0' : '40px',
                    boxShadow: isEgo ? 'none' : 'var(--card-shadow)',
                    border: isEgo ? 'none' : '1px solid var(--card-border)',
                    transition: 'all 400ms cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-tert)', marginBottom: '24px', letterSpacing: '0.1em' }}>
                        {t.heroSub}
                    </div>
                    <h1 style={{ fontSize: isMobile ? '32px' : isEgo ? '48px' : '36px', fontWeight: isEgo ? 800 : 600, lineHeight: 1.1, margin: 0, color: 'var(--text-main)', fontFamily: 'var(--font-body)', letterSpacing: isEgo ? '-0.04em' : '-0.02em' }}>
                        {t.heroTitle}
                    </h1>
                    <p style={{ fontSize: '18px', color: 'var(--text-sec)', lineHeight: 1.6, marginTop: '24px', maxWidth: '580px', fontWeight: isEgo ? 500 : 400 }}>
                        {t.heroDesc}
                    </p>
                </section>

                <div style={{ height: 'var(--section-gap)', transition: 'height 400ms' }} />

                {/* Timeline */}
                <section style={{
                    paddingTop: isEgo ? '0' : '60px',
                    paddingBottom: isEgo ? '0' : '60px',
                    borderBottom: isEgo ? '1px solid var(--border-subtle)' : 'none',
                    backgroundColor: isEgo ? 'transparent' : 'var(--bg-surface)',
                    borderRadius: isEgo ? '0' : 'var(--radius-lg)',
                    paddingLeft: isEgo ? '0' : '40px',
                    paddingRight: isEgo ? '0' : '40px',
                    boxShadow: isEgo ? 'none' : 'var(--card-shadow)',
                    border: isEgo ? 'none' : '1px solid var(--card-border)',
                    transition: 'all 400ms cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                    <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: isEgo ? 'var(--text-tert)' : 'var(--accent)', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0, marginBottom: '48px', fontWeight: 800 }}>
                        {t.timelineTitle}
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: isEgo ? '80px' : '32px', position: 'relative' }}>
                        {t.projects.map((item, idx, arr) => {
                            const badgeStyle = item.isActive ? badges.active : badges.upcoming;
                            return (
                                <div key={idx} style={{
                                    position: 'relative',
                                    paddingLeft: isEgo ? '32px' : '48px',
                                    paddingBottom: isEgo ? '0' : '32px',
                                    backgroundColor: isEgo ? 'transparent' : 'rgba(0,0,0,0.02)',
                                    borderRadius: isEgo ? '0' : '8px',
                                }}>
                                    {/* Connecting line (Always visible) */}
                                    {idx !== arr.length - 1 && (
                                        <div style={{
                                            position: 'absolute',
                                            left: isEgo ? '0px' : '15px',
                                            top: '24px',
                                            height: isEgo ? 'calc(100% + 64px)' : 'calc(100% + 15px)',
                                            width: isEgo ? '2px' : '1.5px',
                                            backgroundColor: isEgo ? 'var(--border-emphasis)' : 'var(--border-subtle)',
                                            transition: 'all 400ms'
                                        }} />
                                    )}
                                    {/* Dot (Always visible) */}
                                    <div
                                        style={{
                                            position: 'absolute',
                                            left: isEgo ? '-3px' : '12px',
                                            top: '12px',
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            backgroundColor: item.isActive ? 'var(--accent)' : 'var(--text-tert)',
                                            transition: 'all 150ms',
                                            zIndex: 5,
                                            boxShadow: item.isActive ? '0 0 10px var(--accent)' : 'none'
                                        }}
                                    />
                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-tert)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>{item.meta}</div>
                                    <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '4px 0 0 0', color: 'var(--text-main)', fontFamily: 'var(--font-body)', letterSpacing: '-0.02em' }}>{item.title}</h3>
                                    <p style={{ fontSize: '15px', color: 'var(--text-sec)', lineHeight: 1.6, marginTop: '12px', marginBottom: 0 }}>{item.desc}</p>
                                    <div style={{ marginTop: '16px' }}>
                                        <span style={{
                                            backgroundColor: badgeStyle.bg, border: `1px solid ${badgeStyle.border}`,
                                            color: badgeStyle.text, fontSize: '10px', padding: '3px 8px',
                                            borderRadius: isEgo ? '0px' : '4px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em'
                                        }}>
                                            {item.badge}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <div style={{ height: 'var(--section-gap)', transition: 'height 400ms' }} />

                {/* Origin Story */}
                <section style={{
                    paddingTop: isEgo ? '0' : '60px',
                    paddingBottom: isEgo ? '0' : '60px',
                    backgroundColor: isEgo ? 'transparent' : 'var(--bg-surface)',
                    borderRadius: isEgo ? '0' : 'var(--radius-lg)',
                    paddingLeft: isEgo ? '0' : '40px',
                    paddingRight: isEgo ? '0' : '40px',
                    boxShadow: isEgo ? 'none' : 'var(--card-shadow)',
                    border: isEgo ? 'none' : '1px solid var(--card-border)',
                    transition: 'all 400ms cubic-bezier(0.16, 1, 0.3, 1)',
                    marginBottom: '80px'
                }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-tert)', textTransform: 'uppercase', marginBottom: '16px', fontWeight: 800 }}>{t.originSub}</div>
                    <h2 style={{ fontSize: isEgo ? '32px' : '24px', fontWeight: 800, margin: '0 0 24px 0', color: 'var(--text-main)', fontFamily: 'var(--font-body)', letterSpacing: '-0.03em' }}>{t.originTitle}</h2>
                    <div style={{ fontSize: '16px', color: 'var(--text-sec)', lineHeight: 1.8, maxWidth: '640px', fontWeight: isEgo ? 400 : 500 }}>
                        <p style={{ margin: '0 0 20px 0' }}>{t.originP1}</p>
                        <p style={{ margin: 0 }}>{t.originP2}</p>
                    </div>
                </section>

                {/* Footer */}
                <footer style={{
                    padding: '40px 0',
                    display: 'flex', flexDirection: isMobile ? 'column' : 'row',
                    justifyContent: 'space-between', gap: isMobile ? '16px' : '0', alignItems: 'center'
                }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-tert)', textAlign: 'center' }}>
                        <div>{t.rights}</div>
                        <div style={{ marginTop: '8px', fontSize: '10px' }}>
                            {t.madeBy} <span style={{ color: 'var(--text-sec)' }}>Felipe Santillan</span> ·
                            <a href="https://fausto.app/" target="_blank" rel="noopener noreferrer" style={{ color: '#9CCBA8', textDecoration: 'none', marginLeft: '4px' }}>Fausto</a>
                        </div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-tert)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isMobile && <DesignToggle />}
                        <span>v1.1.0</span>
                    </div>
                </footer>

            </main>
        </div>
    );
};
