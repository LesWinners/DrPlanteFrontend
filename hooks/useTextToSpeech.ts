import { useState, useEffect, useCallback, useRef } from 'react';

export const useTextToSpeech = (textToRead: string) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const loadAndSelectVoice = () => {
      const voices = speechSynthesis.getVoices();
      if (voices.length === 0) {
        return; // Attendre que les voix soient chargées
      }
      
      const africanFrenchLocales = [
        'fr-ML', // Mali
        'fr-SN', // Senegal
        'fr-CI', // Côte d'Ivoire
        'fr-CM', // Cameroon
        'fr-BF', // Burkina Faso
        'fr-NE', // Niger
        'fr-TG', // Togo
        'fr-BJ', // Benin
      ];

      // 1. Priorité aux voix avec un locale "fr-PaysAfricain"
      let foundVoice = voices.find(voice => africanFrenchLocales.includes(voice.lang));

      // 2. Sinon, chercher une voix française dont le nom contient "Afrique"
      if (!foundVoice) {
        foundVoice = voices.find(voice => 
          voice.lang.startsWith('fr-') && 
          /afri(que|can)/i.test(voice.name)
        );
      }
      
      // 3. Sinon, prendre n'importe quelle voix française
      if (!foundVoice) {
        foundVoice = voices.find(voice => voice.lang.startsWith('fr-'));
      }
      
      // 4. En dernier recours, prendre la première voix disponible
      setSelectedVoice(foundVoice || voices[0] || null);
    };

    // Charger les voix immédiatement et s'abonner aux changements
    loadAndSelectVoice();
    speechSynthesis.onvoiceschanged = loadAndSelectVoice;

    return () => {
      // Nettoyage de l'abonnement
      speechSynthesis.onvoiceschanged = null;
    };
  }, []);


  useEffect(() => {
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = selectedVoice?.lang || 'fr-FR';
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (e) => {
        console.error('SpeechSynthesisUtterance.onerror', e)
        setIsSpeaking(false)
    };
    utteranceRef.current = utterance;

    return () => {
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
      }
    };
  }, [textToRead, selectedVoice]);

  const speak = useCallback(() => {
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel(); // Arrêter la lecture en cours avant d'en commencer une nouvelle
    }
    if (utteranceRef.current) {
        speechSynthesis.speak(utteranceRef.current);
    }
  }, []);

  const stop = useCallback(() => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return { isSpeaking, speak, stop };
};