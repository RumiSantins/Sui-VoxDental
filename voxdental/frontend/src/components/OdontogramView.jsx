import React, { useState, useEffect } from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';
import { useSpeech } from '../hooks/useSpeech';

// Helper for center type
const isIncisal = (num) => (num >= 11 && num <= 13) || (num >= 21 && num <= 23) || (num >= 31 && num <= 33) || (num >= 41 && num <= 43);

const Tooth = ({ number, surfaceConditions = {}, isMissing }) => {

    // Color mapping based on specific condition per surface
    const getColor = (surf) => {
        if (isMissing) return 'bg-gray-300 opacity-50';

        const condition = surfaceConditions[surf];

        if (condition === 'caries') return 'bg-red-500';
        if (condition === 'resina') return 'bg-blue-500';
        if (condition === 'amalgama') return 'bg-gray-800';
        if (condition === 'corona') return 'bg-yellow-400 border-yellow-600'; // Example
        if (condition === 'endodoncia') return 'bg-purple-500';

        return 'bg-white hover:bg-blue-50';
    };

    return (
        <div className="flex flex-col items-center m-1">
            <span className="text-xs text-gray-500 font-mono mb-1">{number}</span>
            <div className={`relative w-12 h-12 border border-gray-300 bg-white ${isMissing ? 'opacity-40' : ''}`}>
                {isMissing && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-800 font-bold text-2xl">X</div>
                )}

                {!isMissing && (
                    <>
                        {/* Vestibular (Top) */}
                        <div className={`absolute top-0 left-0 w-full h-3 border-b border-gray-200 ${getColor('vestibular')}`}></div>

                        {/* Palatina/Lingual (Bottom) */}
                        <div className={`absolute bottom-0 left-0 w-full h-3 border-t border-gray-200 ${getColor(number >= 20 && number < 30 || number < 20 ? 'palatina' : 'lingual')}`}></div>

                        {/* Mesial/Distal (Verticals) */}
                        <div className={`absolute top-3 left-0 w-3 h-6 border-r border-gray-200 ${getColor('distal')}`}></div>
                        <div className={`absolute top-3 right-0 w-3 h-6 border-l border-gray-200 ${getColor('mesial')}`}></div>

                        {/* Occlusal/Incisal (Center) */}
                        {/* Logic to determine center name for state lookup */}
                        <div className={`absolute top-3 left-3 w-6 h-6 ${getColor(isIncisal(number) ? 'incisal' : 'oclusal')}`}></div>
                    </>
                )}
            </div>
        </div>
    );
};



export const OdontogramView = () => {
    const { isRecording, isProcessing, isContinuous, startRecording, stopRecording } = useSpeech();
    const [findings, setFindings] = useState([]);
    const [lastTranscript, setLastTranscript] = useState("");
    const [warnings, setWarnings] = useState([]);

    // Audio Feedback Helper
    const playFeedbackSound = (type) => {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;

            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            if (type === 'success') {
                // High pitch pleasant "ding"
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);

                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

                osc.start();
                osc.stop(ctx.currentTime + 0.3);
            } else if (type === 'error') {
                // Low pitch "thud" or "boop" for miss
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(300, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.15);

                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.15);

                osc.start();
                osc.stop(ctx.currentTime + 0.15);
            } else if (type === 'recording_start') {
                // Double beep up
                osc.frequency.setValueAtTime(440, ctx.currentTime);
                gain.gain.setValueAtTime(0.05, ctx.currentTime);
                osc.start();
                osc.stop(ctx.currentTime + 0.1);
            }
        } catch (e) {
            console.error("Audio feedback error:", e);
        }
    };

    const handleSpeechResult = (data) => {
        console.log("Result:", data);
        if (data.transcription) setLastTranscript(data.transcription);
        if (data.warnings) setWarnings(data.warnings);

        // Append new findings, handling "borrar" logic
        if (data.findings && data.findings.length > 0) {
            setFindings(prev => {
                let nextFindings = [...prev];

                data.findings.forEach(newFinding => {
                    if (newFinding.condition === 'borrar') {
                        // Remove ALL findings for this tooth
                        nextFindings = nextFindings.filter(f => f.tooth_number !== newFinding.tooth_number);
                    } else {
                        // Add normal finding
                        nextFindings.push(newFinding);
                    }
                });

                return nextFindings;
            });
            playFeedbackSound('success');
        } else {
            // If we got a result but no findings, play error/miss sound
            // Only if text was actually transcribed (avoid noise on empty silence processing)
            if (data.transcription && data.transcription.trim().length > 0) {
                playFeedbackSound('error');
            }
        }
    };

    const toggleRecording = () => {
        if (isRecording) {
            stopRecording(handleSpeechResult);
        } else {
            // Default to CONTINUOUS mode for this "Real Time" request
            startRecording(true, handleSpeechResult);
        }
    };

    const getToothState = (num) => {
        const toothFindings = findings.filter(f => f.tooth_number === num);

        // Priority 1: Missing
        if (toothFindings.some(f => f.condition === 'ausente')) {
            return { isMissing: true, surfaceConditions: {} };
        }

        // Priority 2: Build surface map chronologically
        const surfaceConditions = {};

        toothFindings.forEach(f => {
            if (f.surface) {
                // If explicit surface, assign
                surfaceConditions[f.surface] = f.condition;
            } else {
                // If Generic (no surface), assign to Center (Occlusal/Incisal)
                const centerName = isIncisal(num) ? 'incisal' : 'oclusal';
                surfaceConditions[centerName] = f.condition;
            }
        });

        return { isMissing: false, surfaceConditions };
    };

    const renderQuadrant = (range) => {
        return (
            <div className="flex gap-1 bg-white p-2 rounded-lg shadow-sm">
                {range.map(num => (
                    <Tooth key={num} number={num} {...getToothState(num)} />
                ))}
            </div>
        );
    };

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Sui <span className="text-blue-600">VoxDental</span></h1>
                    <p className="text-gray-500">Registro Clínico Manos Libres</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-500 mr-2 border-r pr-4">
                        {isContinuous ? (
                            <span className="flex items-center gap-1 text-green-600 font-bold">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </span>
                                Modo Continuo Activo
                            </span>
                        ) : (
                            <span className="text-gray-400">Modo Manual</span>
                        )}
                    </div>

                    <button
                        onClick={toggleRecording}
                        className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all shadow-lg ${isRecording
                            ? 'bg-red-500 text-white animate-pulse ring-4 ring-red-200'
                            : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105'
                            }`}
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Procesando...</span>
                            </>
                        ) : isRecording ? (
                            <>
                                <MicOff size={20} />
                                <span>{isContinuous ? "Escuchando... (En silencio)" : "Detener"}</span>
                            </>
                        ) : (
                            <>
                                <Mic size={20} />
                                <span>Iniciar "Manos Libres" (Continuo)</span>
                            </>
                        )}
                    </button>
                </div>
            </header>

            {isProcessing && (
                <div className="mb-4 p-4 bg-blue-50 text-blue-700 rounded-lg animate-pulse">
                    Procesando audio...
                </div>
            )}

            {lastTranscript && (
                <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Transcripción</span>
                    <p className="text-lg text-gray-800 mt-1">"{lastTranscript}"</p>
                </div>
            )}

            {warnings.length > 0 && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-800 font-semibold mb-2">
                        <AlertCircle size={18} /> Validaciones
                    </div>
                    <ul className="list-disc list-inside text-sm text-yellow-700">
                        {warnings.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Upper Arch */}
                <div className="space-y-4">
                    <h3 className="text-center font-semibold text-gray-400">Superior Derecho (C1)</h3>
                    <div className="flex justify-center">{renderQuadrant([18, 17, 16, 15, 14, 13, 12, 11])}</div>
                </div>
                <div className="space-y-4">
                    <h3 className="text-center font-semibold text-gray-400">Superior Izquierdo (C2)</h3>
                    <div className="flex justify-center">{renderQuadrant([21, 22, 23, 24, 25, 26, 27, 28])}</div>
                </div>

                {/* Lower Arch */}
                <div className="space-y-4">
                    <h3 className="text-center font-semibold text-gray-400">Inferior Derecho (C4)</h3>
                    <div className="flex justify-center">{renderQuadrant([48, 47, 46, 45, 44, 43, 42, 41])}</div>
                </div>
                <div className="space-y-4">
                    <h3 className="text-center font-semibold text-gray-400">Inferior Izquierdo (C3)</h3>
                    <div className="flex justify-center">{renderQuadrant([31, 32, 33, 34, 35, 36, 37, 38])}</div>
                </div>
            </div>
        </div>
    );
};
