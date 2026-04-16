import React, { useState, useEffect } from 'react';
import { Sun, Moon, Languages } from 'lucide-react';

export const SuiEgoHome = ({ onLogin, onRegister, isDark, onToggleTheme, language = 'es', onToggleLanguage }) => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 640);
        handleResize(); // set initial
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // UI Colors based on theme
    const theme = {
        bgMain: isDark ? '#0B0B0B' : '#FFFFFF',
        bgSurface: isDark ? '#141414' : '#F7F7F7',
        textMain: isDark ? '#E1E1E1' : '#111111',
        textSec: isDark ? '#888888' : '#666666',
        textTert: isDark ? '#555555' : '#999999',
        borderSubtle: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)',
        borderEmphasis: isDark ? 'rgba(255,255,255,0.13)' : 'rgba(0,0,0,0.14)'
    };

    const badges = {
        active: {
            bg: isDark ? 'rgba(39,174,96,0.12)' : '#EBF9F2',
            border: '#27AE60',
            text: '#1A7A42'
        },
        upcoming: {
            bg: isDark ? 'rgba(204,204,204,0.12)' : '#F3F3F3',
            border: '#CCCCCC',
            text: '#777777'
        }
    };

    const i18n = {
        es: {
            login: "Iniciar sesión",
            register: "Registrarse",
            heroSub: "v1.1.0 — Sistema activo",
            heroTitle: <>SuiEgo: Inteligencia con Alma.<br />Tecnología para la Vida.</>,
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
                    desc: "Rama veterinaria. Un guiño al origen de SuiEgo: los gatos Sui y Ego.",
                    badge: "Próximamente"
                }
            ],
            originSub: "ORIGEN",
            originTitle: "El nombre tiene historia.",
            originP1: "SuiEgo nace de dos gatos: Sui y Ego. Sui representa la fluidez, la intuición y la escucha — el motor de voz que transforma palabras en datos. Ego representa la estructura, la identidad clínica y la precisión — la base que valida y organiza el conocimiento médico.",
            originP2: "Juntos, forman un sistema con carácter: diseñado para escuchar, entender y crecer junto a los profesionales de la salud.",
            rights: "© 2026 SuiEgo · Todos los derechos reservados",
            madeBy: "Hecho por"
        },
        en: {
            login: "Log in",
            register: "Register",
            heroSub: "v1.0.0 — Active system",
            heroTitle: <>SuiEgo: Intelligence with Soul.<br />Technology for Life.</>,
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
                    desc: "Veterinary branch. A nod to SuiEgo's origins: the cats Sui and Ego.",
                    badge: "Upcoming"
                }
            ],
            originSub: "ORIGIN",
            originTitle: "The name has a history.",
            originP1: "SuiEgo is born from two cats: Sui and Ego. Sui represents fluidity, intuition, and listening — the voice engine transforming words into data. Ego represents structure, clinical identity, and precision — the foundation that validates medical knowledge.",
            originP2: "Together, they form a system with character: designed to listen, understand, and grow alongside health professionals.",
            rights: "© 2026 SuiEgo · All rights reserved",
            madeBy: "Made by"
        }
    };

    const t = i18n[language] || i18n.es;

    return (
        <div style={{ backgroundColor: theme.bgMain, color: theme.textMain, minHeight: '100vh', transition: 'background-color 150ms linear, color 150ms linear', fontFamily: '"DM Sans", sans-serif' }}>
            {/* Ambient Backgrounds */}
            <div style={{ position: 'fixed', top: '-20%', left: '-10%', width: '60%', height: '60%', backgroundColor: isDark ? 'rgba(37, 99, 235, 0.1)' : 'rgba(37, 99, 235, 0.18)', filter: 'blur(100px)', borderRadius: '50%', pointerEvents: 'none', zIndex: 0, transition: 'background-color 150ms linear' }} />
            <div style={{ position: 'fixed', bottom: '-20%', right: '-10%', width: '60%', height: '60%', backgroundColor: isDark ? 'rgba(147, 51, 234, 0.08)' : 'rgba(147, 51, 234, 0.15)', filter: 'blur(100px)', borderRadius: '50%', pointerEvents: 'none', zIndex: 0, transition: 'background-color 150ms linear' }} />

            {/* Header */}
            <header style={{ position: 'sticky', top: 0, backgroundColor: isDark ? 'rgba(20,20,20,0.85)' : 'rgba(247,247,247,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: `1px solid ${theme.borderSubtle}`, height: '76px', zIndex: 50, transition: 'background-color 150ms linear' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto', padding: isMobile ? '0 16px' : '0 24px', height: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: isMobile ? '6px' : '10px', minWidth: 0 }}>
                        <img src="/logo.png" alt="SuiEgo Logo" style={{ height: isMobile ? '38px' : '58px', width: 'auto', objectFit: 'contain', filter: isDark ? 'invert(1) opacity(0.9)' : 'opacity(0.9)', transition: 'filter 150ms linear' }} />
                        <span style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 900, background: 'linear-gradient(to right, #2563eb, #9333ea)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em', flexShrink: 0, lineHeight: 1, paddingTop: '2px' }}>SuiEgo</span>
                        {!isMobile && <span style={{ fontSize: '13px', fontFamily: '"JetBrains Mono", monospace', color: theme.textSec, whiteSpace: 'nowrap', lineHeight: 1, paddingTop: '2px', marginLeft: '8px' }}></span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '16px', flexShrink: 0 }}>
                        <button onClick={onToggleLanguage} style={{ background: 'transparent', border: 'none', color: theme.textSec, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: 0, fontSize: isMobile ? '10px' : '12px', fontWeight: 600, textTransform: 'uppercase' }} title="Change Language">
                            <Languages size={isMobile ? 12 : 15} />
                            {!isMobile && language}
                        </button>
                        <button onClick={onLogin} style={{ background: 'transparent', border: `1px solid ${theme.textSec}`, color: theme.textSec, padding: isMobile ? '3px 8px' : '4px 12px', borderRadius: '4px', fontSize: isMobile ? '10px' : '12px', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'opacity 150ms linear' }} onMouseOver={e => e.currentTarget.style.opacity = 0.75} onMouseOut={e => e.currentTarget.style.opacity = 1}>
                            {isMobile ? (language === 'es' ? 'Login' : 'Login') : t.login}
                        </button>
                        <button onClick={onRegister} style={{ background: '#2563eb', color: '#ffffff', border: 'none', padding: isMobile ? '4px 10px' : '5px 14px', borderRadius: '6px', fontSize: isMobile ? '10px' : '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 150ms linear', boxShadow: '0 4px 5px 0 rgba(37,99,235,0.39)' }} onMouseOver={e => { e.currentTarget.style.opacity = 0.9; e.currentTarget.style.transform = 'translateY(-1px)'; }} onMouseOut={e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.transform = 'translateY(0)'; }}>
                            {t.register}
                        </button>
                        <button onClick={onToggleTheme} style={{ background: 'transparent', border: 'none', color: theme.textSec, cursor: 'pointer', display: 'flex', padding: 0 }} title="Cambiar Tema">
                            {isDark ? <Sun size={isMobile ? 16 : 20} /> : <Moon size={isMobile ? 16 : 20} />}
                        </button>
                    </div>
                </div>
            </header>

            <main style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 10 }}>

                {/* Hero Section */}
                <section style={{ paddingTop: '96px', paddingBottom: '80px', borderBottom: `1px solid ${theme.borderSubtle}` }}>
                    <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '11px', color: theme.textTert, marginBottom: '24px' }}>
                        {t.heroSub}
                    </div>
                    <h1 style={{ fontSize: isMobile ? '26px' : '36px', fontWeight: 600, lineHeight: 1.2, margin: 0 }}>
                        {t.heroTitle}
                    </h1>
                    <p style={{ fontSize: '16px', color: theme.textSec, lineHeight: 1.6, marginTop: '16px', maxWidth: '580px' }}>
                        {t.heroDesc}
                    </p>
                </section>

                {/* Timeline */}
                <section style={{ paddingTop: '80px', paddingBottom: '80px', borderBottom: `1px solid ${theme.borderSubtle}` }}>
                    <h2 style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '11px', color: theme.textTert, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '48px', margin: 0 }}>
                        {t.timelineTitle}
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '64px', position: 'relative' }}>
                        {/* Timeline Entries */}
                        {t.projects.map((item, idx, arr) => {
                            const badgeStyle = item.isActive ? badges.active : badges.upcoming;
                            return (
                                <div key={idx} style={{ position: 'relative', paddingLeft: '24px' }}>
                                    {/* Line */}
                                    {idx !== arr.length - 1 && (
                                        <div style={{ position: 'absolute', left: 0, top: '16px', height: 'calc(100% + 56px)', width: '1px', backgroundColor: theme.borderSubtle }} />
                                    )}
                                    {/* Dot */}
                                    <div style={{ position: 'absolute', left: '-2.5px', top: '8px', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: item.isActive ? '#27AE60' : theme.textTert, transition: 'background-color 150ms linear' }}
                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? '#E1E1E1' : '#111111'}
                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = item.isActive ? '#27AE60' : theme.textTert}
                                    />

                                    <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '11px', color: theme.textTert }}>
                                        {item.meta}
                                    </div>
                                    <h3 style={{ fontSize: '17px', fontWeight: 600, margin: '4px 0 0 0' }}>{item.title}</h3>
                                    <p style={{ fontSize: '14px', color: theme.textSec, lineHeight: 1.6, marginTop: '8px', marginBottom: 0 }}>
                                        {item.desc}
                                    </p>
                                    <div style={{ marginTop: '12px' }}>
                                        <span style={{ backgroundColor: badgeStyle.bg, border: `1px solid ${badgeStyle.border}`, color: badgeStyle.text, fontSize: '11px', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                                            {item.badge}
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </section>

                {/* Nuestra Historia */}
                <section style={{ paddingTop: '80px', paddingBottom: '80px', borderBottom: `1px solid ${theme.borderSubtle}` }}>
                    <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '11px', color: theme.textTert, textTransform: 'uppercase', marginBottom: '16px' }}>{t.originSub}</div>
                    <h2 style={{ fontSize: '22px', fontWeight: 600, margin: '0 0 16px 0' }}>{t.originTitle}</h2>
                    <div style={{ fontSize: '15px', color: theme.textSec, lineHeight: 1.75, maxWidth: '600px' }}>
                        <p style={{ margin: '0 0 16px 0' }}>{t.originP1}</p>
                        <p style={{ margin: 0 }}>{t.originP2}</p>
                    </div>
                </section>

                {/* Footer */}
                <footer style={{ padding: '40px 0', display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', gap: isMobile ? '16px' : '0', alignItems: 'center' }}>
                    <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '11px', color: theme.textTert, textAlign: 'center' }}>
                        <div>{t.rights}</div>
                        <div style={{ marginTop: '8px', fontSize: '10px' }}>
                            {t.madeBy} <span style={{ color: theme.textSec }}>Felipe Santillan</span> ·
                            <a href="https://fausto.app/" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', marginLeft: '4px' }}>Fausto</a>
                        </div>
                    </div>
                    {!isMobile && (
                        <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '11px', color: theme.textTert }}> v1.0.0</div>
                    )}
                </footer>

            </main>
        </div>
    );
};
