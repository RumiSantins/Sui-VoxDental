import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export const useSpeech = () => {
    const { token } = useAuth();
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isContinuous, setIsContinuous] = useState(false);
    const [volume, setVolume] = useState(0); // 0-100

    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceRef = useRef(null);
    const silenceTimerRef = useRef(null);
    const rafRef = useRef(null);
    const hasSpokenRef = useRef(false);
    const speechStartTimeRef = useRef(null);
    const isActiveRef = useRef(false);
    const streamRef = useRef(null);
    const externalContextRef = useRef({});

    // Config
    const SILENCE_THRESHOLD = 0.006; // Lowered from 0.01 for more sensitivity
    const SILENCE_DURATION = 700; // Much snappier response (from 1200ms)
    const MIN_SPEECH_DURATION = 100; // Reduced from 200ms to catch faster speech

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopMicrophoneLogic();
        };
    }, []);

    const stopMicrophoneLogic = () => {
        isActiveRef.current = false;
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        setVolume(0);
    };

    const startRecording = async (patientId, continuous = false, onResultCallback_ = null) => {
        try {
            // If already recording, don't start again
            if (isRecording) return;
            if (!patientId) {
                console.error("No patient ID provided for recording");
                return;
            }

            const stream = streamRef.current || await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            isActiveRef.current = true;

            // 1. Setup MediaRecorder
            mediaRecorderRef.current = new MediaRecorder(stream);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            // 2. Setup VAD (Voice Activity Detection) if continuous
            if (continuous) {
                setupVAD(stream, onResultCallback_);
            }

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setIsContinuous(continuous);

            // Save callback for auto-stop
            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' });

                // If we have content, process it
                if (chunksRef.current.length > 0 && hasSpokenRef.current) {
                    await processAudio(audioBlob, patientId, onResultCallback_);
                }

                // If continuous and still active, restart the recorder (keep stream alive)
                if (continuous && isActiveRef.current) {
                    setTimeout(() => {
                        if (isActiveRef.current) {
                            startRecording(patientId, true, onResultCallback_);
                        }
                    }, 50);
                }
            };

        } catch (err) {
            console.error("Error accessing microphone:", err);
            setIsRecording(false);
        }
    };

    const setupVAD = (stream, onResultCallback) => {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
        sourceRef.current.connect(analyserRef.current);

        analyserRef.current.fftSize = 256;
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        hasSpokenRef.current = false; // Reset speech flag

        const checkVolume = () => {
            if (!audioContextRef.current) return;

            analyserRef.current.getByteTimeDomainData(dataArray);

            // Calculate RMS (Root Mean Square) volume
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                const x = (dataArray[i] - 128) / 128.0;
                sum += x * x;
            }
            const rms = Math.sqrt(sum / bufferLength);
            
            // Update volume state for UI
            const normalizedVol = Math.min(100, Math.round(rms * 500));
            setVolume(normalizedVol);

            if (rms > SILENCE_THRESHOLD) {
                // Potential speech detected
                if (!speechStartTimeRef.current) {
                    speechStartTimeRef.current = Date.now();
                }

                if (Date.now() - speechStartTimeRef.current > MIN_SPEECH_DURATION) {
                    hasSpokenRef.current = true;
                    if (silenceTimerRef.current) {
                        clearTimeout(silenceTimerRef.current);
                        silenceTimerRef.current = null;
                    }
                }
            } else {
                // Below threshold
                speechStartTimeRef.current = null;

                if (hasSpokenRef.current) {
                    // User was speaking but stopped, start silence timer
                    if (!silenceTimerRef.current) {
                        silenceTimerRef.current = setTimeout(() => {
                            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                                console.log("Silence detected & processed");
                                stopRecordingLogic(false);
                            }
                        }, SILENCE_DURATION);
                    }
                }
            }

            rafRef.current = requestAnimationFrame(checkVolume);
        };

        checkVolume();
    };

    const stopRecordingLogic = (fullStop = true) => {
        if (!mediaRecorderRef.current) return;

        if (fullStop) {
            stopMicrophoneLogic();
            setIsContinuous(false);
            setIsRecording(false);
        } else {
            // Internal stop (VAD trigger), just trigger recorder stop
            if (mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
        }
    };

    const processAudio = async (audioBlob, patientId, onResult) => {
        setIsProcessing(true);
        const formData = new FormData();
        formData.append('file', audioBlob, 'recording.wav');
        formData.append('patient_id', patientId); 
        const engine = localStorage.getItem('speechEngine') || 'vosk';
        const modelName = localStorage.getItem('speechModel') || 'vosk-model-small-es-0.42';
        formData.append('engine', engine);
        formData.append('model_name', modelName);

        const ctx = externalContextRef.current;
        if (ctx && ctx.toothNumber) {
            formData.append('context_tooth', ctx.toothNumber);
        }

        try {
            const response = await fetch('/api/v1/clinical/voice-entry', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });

            if (!response.ok) throw new Error('API Error');

            const data = await response.json();
            
            // Client-side filter for common Whisper hallucinations on noise
            const text = (data.transcription || "").toLowerCase().trim();
            const hallucinations = ["gracias por ver", "subtítulos", "watching"]; // Simplified
            
            console.log("Voice Capture:", text);

            if (hallucinations.some(h => text.includes(h)) && text.length < 50) {
                console.log("Filtered likely hallucination:", text);
                return;
            }

            if (onResult) onResult(data);
        } catch (error) {
            console.error("Processing error:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    // Public API
    const stopRecording = (onResult) => {
        // Manual stop button logic
        // If we are in continuous mode and user presses stop, we want to fully stop.
        // We probably won't have the audio ready in the same way if manually stopped mid-sentence without VAD trigger, 
        // but let's assume standard behavior.
        // For the manual button, we bind a one-time handler or just rely on the existing setup.

        // Simpler: Just kill it.
        stopRecordingLogic(true);
    };

    return {
        isRecording,
        isProcessing,
        isContinuous,
        volume,
        startRecording: (patientId, continuous, cb) => startRecording(patientId, continuous, cb),
        stopRecording,
        setExternalContext: (ctx) => { externalContextRef.current = ctx; }
    };
};
