/* Página de presentación de EgoS.
   Usa CSS custom properties vía ThemeContext para adaptarse a los 4 temas del sistema de diseño.
   Incluye los toggles de Diseño (Ego/Sui) y Modo (Oscuro/Claro) en el header. */
import React, { useState, useEffect } from 'react';
import { Sun, Moon, Languages, Menu, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { DesignToggle } from './DesignToggle';
import { SymbiosisLogo } from './SymbiosisLogo';
import { useScrollLock } from '../hooks/useScrollLock';

export const EgoSHome = ({ onLogin, onRegister, language = 'es', onToggleLanguage }) => {
    const { isDark, toggleMode, isEgo } = useTheme();
    const [isMobile, setIsMobile] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrollY, setScrollY] = useState(0);
    const [maxScroll, setMaxScroll] = useState(0);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [comment, setComment] = useState('');
    const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
    const [agreedToMarketing, setAgreedToMarketing] = useState(false);
    const [feedbackStatus, setFeedbackStatus] = useState('idle'); // idle, sending, success, error

    // Bloqueo de scroll cuando el menú móvil está abierto
    useScrollLock(isMenuOpen);

    const handleSendComment = async () => {
        if (!comment.trim() || !name.trim() || !email.trim() || !agreedToPrivacy || !agreedToMarketing || feedbackStatus === 'sending') return;
        
        setFeedbackStatus('sending');
        try {
            const response = await fetch('/api/v1/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, comment })
            });
            
            if (response.ok) {
                setFeedbackStatus('success');
                setName('');
                setEmail('');
                setComment('');
                setAgreedToPrivacy(false);
                setAgreedToMarketing(false);
            } else {
                setFeedbackStatus('error');
            }
        } catch (err) {
            setFeedbackStatus('error');
        } finally {
            setTimeout(() => setFeedbackStatus('idle'), 3000);
        }
    };

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

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
            contactSub: "CONÉCTATE",
            contactTitle: "¿Tienes alguna sugerencia?",
            contactDesc: "Nos encantaría escuchar tus comentarios o responder a cualquier duda sobre el sistema.",
            contactLabelName: "Nombre",
            contactPlaceholderName: "Tu nombre",
            contactLabelEmail: "Email",
            contactPlaceholderEmail: "tu@email.com",
            contactLabelMessage: "Mensaje",
            contactPlaceholder: "Escribe tu comentario aquí...",
            contactPrivacy: "Acepto el tratamiento de mis datos personales.",
            contactMarketing: "Acepto recibir comunicaciones informativas.",
            contactBtn: "Enviar Mensaje",
            contactSending: "Enviando...",
            contactSuccess: "¡Mensaje Enviado!",
            contactError: "Error al enviar",
            contactMail: "O escríbenos directamente a",
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
            contactSub: "CONNECT",
            contactTitle: "Any suggestions?",
            contactDesc: "We'd love to hear your feedback or answer any questions you have about the system.",
            contactLabelName: "Name",
            contactPlaceholderName: "Your name",
            contactLabelEmail: "Email",
            contactPlaceholderEmail: "you@email.com",
            contactLabelMessage: "Message",
            contactPlaceholder: "Write your comment here...",
            contactPrivacy: "I agree to the processing of my personal data.",
            contactMarketing: "I agree to receive informative communications.",
            contactBtn: "Send Message",
            contactSending: "Sending...",
            contactSuccess: "Message Sent!",
            contactError: "Failed to send",
            contactMail: "Or write to us directly at",
            rights: "© 2026 EgoS · All rights reserved",
            madeBy: "Made by"
        }
    };

    const t = i18n[language] || i18n.es;

    const blobBaseOpacity = isEgo 
        ? (isDark ? 0.18 : 0.45) 
        : (isDark ? 0.08 : 0.35);
    
    const scrollFadeTop = Math.max(0, 1 - scrollY / 600);
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
            {/* Ambient Blobs */}
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
                height: '76px', zIndex: 100,
                transition: 'background-color 200ms linear',
            }}>
                <div style={{
                    maxWidth: '800px', margin: '0 auto',
                    padding: isMobile ? '0 16px' : '0 24px',
                    height: '100%', display: 'flex', 
                    flexDirection: 'row',
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                }}>
                    {/* Brand */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '10px' }}>
                        <SymbiosisLogo size={isMobile ? 38 : 48} animating={true} />
                        <span style={{
                            fontSize: isMobile ? '18px' : '18px', fontWeight: 900,
                            background: 'linear-gradient(to right, #9CCBA8, #E8D1B6)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            letterSpacing: '-0.02em', lineHeight: 1.1, paddingTop: '2px'
                        }}>EgoS</span>
                    </div>

                    {/* Controls & Auth */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px' }}>
                        {!isMobile && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderRight: '1px solid var(--border-subtle)', marginRight: '12px', paddingRight: '12px' }}>
                                <DesignToggle />
                                <button onClick={toggleMode} style={{ background: 'transparent', border: 'none', color: 'var(--text-sec)', cursor: 'pointer', display: 'flex', padding: '6px' }}>
                                    {isDark ? <Sun size={20} /> : <Moon size={20} />}
                                </button>
                                <button onClick={onToggleLanguage} style={{ background: 'transparent', border: 'none', color: 'var(--text-sec)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
                                    <Languages size={15} />
                                    {language}
                                </button>
                            </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '2px' : '8px' }}>
                            <button
                                className="login-btn-editorial"
                                onClick={onLogin}
                                style={{
                                    background: 'transparent', border: 'none', color: 'var(--text-sec)',
                                    padding: isMobile ? '4px 6px' : '8px 16px', fontSize: isMobile ? '9.5px' : '13px', fontWeight: 800,
                                    cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em'
                                }}
                            >
                                {t.login}
                            </button>
                            <button
                                onClick={onRegister}
                                style={{
                                    background: 'var(--accent)', color: 'white', border: 'none',
                                    borderRadius: isEgo ? '0px' : '8px', padding: isMobile ? '4px 8px' : '8px 20px',
                                    fontSize: isMobile ? '9.5px' : '13px', fontWeight: 800,
                                    cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em',
                                    boxShadow: '0 4px 12px rgba(156,203,168,0.2)'
                                }}
                            >
                                {t.register}
                            </button>
                        </div>

                        {isMobile && (
                            <button 
                                onClick={toggleMenu}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', marginLeft: '4px', display: 'flex', padding: '8px' }}
                            >
                                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        )}
                    </div>
                </div>

                {isMobile && isMenuOpen && (
                    <div style={{
                        position: 'absolute', top: '76px', left: 0, right: 0,
                        backgroundColor: 'var(--bg-header)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
                        borderBottom: '1px solid var(--border-subtle)',
                        padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '20px',
                        animation: 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                        zIndex: 90
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-sec)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Sistema de Diseño</span>
                            <DesignToggle />
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-sec)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Apariencia</span>
                            <button onClick={() => { toggleMode(); setIsMenuOpen(false); }} style={{ background: 'var(--bg-main)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', borderRadius: isEgo ? '0px' : '12px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {isDark ? <Sun size={18} /> : <Moon size={18} />}
                                <span style={{ fontSize: '12px', fontWeight: 600 }}>{isDark ? 'Modo Claro' : 'Modo Oscuro'}</span>
                            </button>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-sec)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Idioma</span>
                            <button onClick={() => { onToggleLanguage(); setIsMenuOpen(false); }} style={{ background: 'var(--bg-main)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', borderRadius: isEgo ? '0px' : '12px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Languages size={18} />
                                <span style={{ fontSize: '12px', fontWeight: 600 }}>{language === 'es' ? 'Español' : 'English'}</span>
                            </button>
                        </div>
                    </div>
                )}
            </header>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}} />

            <main style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 10 }}>
                {/* ... resto del contenido se mantiene igual ... */}

                {/* Hero Section */}
                <section style={{
                    paddingTop: isEgo ? '80px' : '60px',
                    paddingBottom: isEgo ? '80px' : '60px',
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

                {/* Origin Section */}
                <section style={{
                    paddingTop: isEgo ? '40px' : '60px',
                    paddingBottom: isEgo ? '40px' : '60px',
                    borderBottom: isEgo ? '1px solid var(--border-subtle)' : 'none',
                    backgroundColor: isEgo ? 'transparent' : 'var(--bg-surface)',
                    borderRadius: isEgo ? '0' : 'var(--radius-lg)',
                    paddingLeft: isEgo ? '0' : '40px',
                    paddingRight: isEgo ? '0' : '40px',
                    boxShadow: isEgo ? 'none' : 'var(--card-shadow)',
                    border: isEgo ? 'none' : '1px solid var(--card-border)',
                    transition: 'all 400ms cubic-bezier(0.16, 1, 0.3, 1)',
                    borderTop: isEgo ? '1px solid var(--border-subtle)' : 'none'
                }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-tert)', textTransform: 'uppercase', marginBottom: '16px', fontWeight: 800 }}>{t.originSub}</div>
                    <h2 style={{ fontSize: isEgo ? '32px' : '24px', fontWeight: 800, margin: '0 0 24px 0', color: 'var(--text-main)', fontFamily: 'var(--font-body)', letterSpacing: '-0.03em' }}>{t.originTitle}</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px' }}>
                        <p style={{ fontSize: '15px', color: 'var(--text-sec)', lineHeight: 1.75, margin: 0 }}>{t.originP1}</p>
                        <p style={{ fontSize: '15px', color: 'var(--text-sec)', lineHeight: 1.75, margin: 0 }}>{t.originP2}</p>
                    </div>
                </section>

                <div style={{ height: 'var(--section-gap)', transition: 'height 400ms' }} />

                {/* Contact Section */}
                <section style={{
                    paddingTop: isEgo ? '40px' : '60px',
                    paddingBottom: isEgo ? '40px' : '60px',
                    backgroundColor: isEgo ? 'transparent' : 'var(--bg-surface)',
                    borderRadius: isEgo ? '0' : 'var(--radius-lg)',
                    paddingLeft: isEgo ? '0' : '40px',
                    paddingRight: isEgo ? '0' : '40px',
                    boxShadow: isEgo ? 'none' : 'var(--card-shadow)',
                    border: isEgo ? 'none' : '1px solid var(--card-border)',
                    transition: 'all 400ms cubic-bezier(0.16, 1, 0.3, 1)',
                    marginBottom: '40px',
                    borderTop: isEgo ? '1px solid var(--border-subtle)' : 'none'
                }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-tert)', textTransform: 'uppercase', marginBottom: '16px', fontWeight: 800 }}>{t.contactSub}</div>
                    <h2 style={{ fontSize: isEgo ? '32px' : '24px', fontWeight: 800, margin: '0 0 16px 0', color: 'var(--text-main)', fontFamily: 'var(--font-body)', letterSpacing: '-0.03em' }}>{t.contactTitle}</h2>
                    <p style={{ fontSize: '15px', color: 'var(--text-sec)', lineHeight: 1.6, marginBottom: '32px', maxWidth: '540px' }}>{t.contactDesc}</p>
                    
                    <div style={{ position: 'relative', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '11px', color: 'var(--text-tert)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', fontWeight: 800 }}>{t.contactLabelName}</label>
                                <input 
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder={t.contactPlaceholderName}
                                    style={{
                                        width: '100%',
                                        backgroundColor: isEgo ? 'transparent' : 'rgba(255,255,255,0.03)',
                                        border: '1px solid var(--border-emphasis)',
                                        borderRadius: isEgo ? '0px' : '8px',
                                        padding: '12px 16px',
                                        color: 'var(--text-main)',
                                        fontFamily: 'var(--font-body)',
                                        fontSize: '14px',
                                        outline: 'none',
                                        transition: 'all 0.2s'
                                    }}
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '11px', color: 'var(--text-tert)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', fontWeight: 800 }}>{t.contactLabelEmail}</label>
                                <input 
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={t.contactPlaceholderEmail}
                                    style={{
                                        width: '100%',
                                        backgroundColor: isEgo ? 'transparent' : 'rgba(255,255,255,0.03)',
                                        border: '1px solid var(--border-emphasis)',
                                        borderRadius: isEgo ? '0px' : '8px',
                                        padding: '12px 16px',
                                        color: 'var(--text-main)',
                                        fontFamily: 'var(--font-body)',
                                        fontSize: '14px',
                                        outline: 'none',
                                        transition: 'all 0.2s'
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '11px', color: 'var(--text-tert)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', fontWeight: 800 }}>{t.contactLabelMessage}</label>
                            <textarea 
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder={t.contactPlaceholder}
                                style={{
                                    width: '100%',
                                    minHeight: '120px',
                                    backgroundColor: isEgo ? 'transparent' : 'rgba(255,255,255,0.03)',
                                    border: '1px solid var(--border-emphasis)',
                                    borderRadius: isEgo ? '0px' : '12px',
                                    padding: '16px',
                                    color: 'var(--text-main)',
                                    fontFamily: isEgo ? 'var(--font-mono)' : 'var(--font-body)',
                                    fontSize: '14px',
                                    resize: 'vertical',
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '12px', color: 'var(--text-sec)', fontFamily: 'var(--font-body)' }}>
                                <input 
                                    type="checkbox"
                                    checked={agreedToPrivacy}
                                    onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                                    style={{
                                        appearance: 'none',
                                        width: '18px',
                                        height: '18px',
                                        border: '1px solid var(--border-emphasis)',
                                        borderRadius: isEgo ? '0px' : '4px',
                                        backgroundColor: agreedToPrivacy ? 'var(--accent)' : 'transparent',
                                        cursor: 'pointer',
                                        position: 'relative',
                                        transition: 'all 0.2s'
                                    }}
                                />
                                {t.contactPrivacy}
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '12px', color: 'var(--text-sec)', fontFamily: 'var(--font-body)' }}>
                                <input 
                                    type="checkbox"
                                    checked={agreedToMarketing}
                                    onChange={(e) => setAgreedToMarketing(e.target.checked)}
                                    style={{
                                        appearance: 'none',
                                        width: '18px',
                                        height: '18px',
                                        border: '1px solid var(--border-emphasis)',
                                        borderRadius: isEgo ? '0px' : '4px',
                                        backgroundColor: agreedToMarketing ? 'var(--accent)' : 'transparent',
                                        cursor: 'pointer',
                                        position: 'relative',
                                        transition: 'all 0.2s'
                                    }}
                                />
                                {t.contactMarketing}
                            </label>
                        </div>

                        <button 
                            onClick={handleSendComment}
                            disabled={feedbackStatus !== 'idle' || !agreedToPrivacy || !agreedToMarketing || !name.trim() || !email.trim() || !comment.trim()}
                            style={{
                                marginTop: '8px',
                                backgroundColor: feedbackStatus === 'success' ? '#9CCBA8' : feedbackStatus === 'error' ? '#ef4444' : 'var(--accent)',
                                color: 'white',
                                border: 'none',
                                borderRadius: isEgo ? '0px' : '8px',
                                padding: '12px 32px',
                                fontSize: '13px',
                                fontWeight: 800,
                                cursor: (feedbackStatus === 'idle' && agreedToPrivacy && agreedToMarketing && name.trim() && email.trim() && comment.trim()) ? 'pointer' : 'default',
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                boxShadow: '0 4px 12px rgba(156,203,168,0.2)',
                                opacity: (feedbackStatus === 'idle' && agreedToPrivacy && agreedToMarketing && name.trim() && email.trim() && comment.trim()) ? 1 : 0.5
                            }}
                            onMouseOver={(e) => { if(feedbackStatus === 'idle' && agreedToPrivacy && agreedToMarketing) e.target.style.transform = 'translateY(-2px)'; }}
                            onMouseOut={(e) => { e.target.style.transform = 'translateY(0)'; }}
                        >
                            {feedbackStatus === 'sending' ? t.contactSending : 
                             feedbackStatus === 'success' ? t.contactSuccess :
                             feedbackStatus === 'error' ? t.contactError : t.contactBtn}
                        </button>
                    </div>

                    <div style={{ marginTop: '32px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-tert)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.contactMail}</span>
                        <a href="mailto:rumi.04.se@gmail.com" style={{ 
                            fontSize: '11px', 
                            color: 'var(--accent)', 
                            fontWeight: 800, 
                            textDecoration: 'none',
                            fontFamily: 'var(--font-mono)'
                        }}>
                            rumi.04.se@gmail.com
                        </a>
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
                        <span>v1.1.0</span>
                    </div>
                </footer>

            </main>
        </div>
    );
};
