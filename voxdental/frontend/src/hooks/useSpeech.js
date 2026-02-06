import { useState, useRef, useEffect } from 'react';

export const useSpeech = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isContinuous, setIsContinuous] = useState(false); // New state for mode

    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceRef = useRef(null);
    const silenceTimerRef = useRef(null);
    const hasSpokenRef = useRef(false);

    // Config
    const SILENCE_THRESHOLD = 0.02; // Volume threshold
    const SILENCE_DURATION = 1500; // ms to wait before sending

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopMicrophoneLogic();
        };
    }, []);

    const stopMicrophoneLogic = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };

    const startRecording = async (continuous = false, onResultCallback_ = null) => {
        try {
            // If already recording, don't start again
            if (isRecording) return;

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

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
                    await processAudio(audioBlob, onResultCallback_);
                }

                // If continuous, restart immediately
                if (continuous && audioContextRef.current) {
                    // Wait a bit to avoid feedback loop or quick restart issues
                    setTimeout(() => {
                        if (audioContextRef.current) { // Check if still active
                            startRecording(true, onResultCallback_);
                        }
                    }, 100);
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

            if (rms > SILENCE_THRESHOLD) {
                // User is speaking
                hasSpokenRef.current = true;
                if (silenceTimerRef.current) {
                    clearTimeout(silenceTimerRef.current);
                    silenceTimerRef.current = null;
                }
            } else if (hasSpokenRef.current) {
                // User stopped speaking, start timer
                if (!silenceTimerRef.current) {
                    silenceTimerRef.current = setTimeout(() => {
                        // Silence detected! Stop recording to trigger processing
                        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                            console.log("Silence detected & processed");
                            stopRecordingLogic(false); // Stop but keep continuous flag true logic handled in onstop
                        }
                    }, SILENCE_DURATION);
                }
            }

            requestAnimationFrame(checkVolume);
        };

        checkVolume();
    };

    const stopRecordingLogic = (fullStop = true) => {
        if (!mediaRecorderRef.current) return;

        if (fullStop) {
            // Complete shutdown
            if (audioContextRef.current) {
                audioContextRef.current.close().then(() => {
                    audioContextRef.current = null;
                });
            }
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            setIsContinuous(false);
            setIsRecording(false); // Update UI roughly immediately
        }

        mediaRecorderRef.current.stop(); // This triggers onstop
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    };

    const processAudio = async (audioBlob, onResult) => {
        setIsProcessing(true);
        const formData = new FormData();
        formData.append('file', audioBlob, 'recording.wav');
        formData.append('patient_id', '123'); // Hardcoded

        try {
            const response = await fetch('http://localhost:8000/api/v1/clinical/voice-entry', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('API Error');

            const data = await response.json();
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
        startRecording: (continuous, cb) => startRecording(continuous, cb),
        stopRecording
    };
};
