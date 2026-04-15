export const isSurfaceValid = (toothNumber, surface) => {
    if (!surface || surface === "general" || surface === "") return true;
    const anterior = (toothNumber % 10) <= 3;
    
    // Permitir ambas palatina/lingual para flexibilidad en dictado.
    const common = ['vestibular', 'mesial', 'distal', 'palatina', 'lingual', 'general'];
    
    if (anterior) {
        return common.includes(surface) || surface === 'incisal';
    } else {
        return common.includes(surface) || surface === 'oclusal';
    }
};
