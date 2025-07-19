import React, { useState } from "react";

const TTSTest = () => {
  const [error, setError] = useState('');
  const speak = () => {
    setError('');
    if (!('speechSynthesis' in window)) {
      setError("La synthèse vocale n'est pas supportée sur ce navigateur.");
      return;
    }
    try {
      window.speechSynthesis.speak(new window.SpeechSynthesisUtterance('Ceci est un test de synthèse vocale.'));
    } catch (e) {
      setError('Erreur lors de la synthèse vocale.');
    }
  };
  return (
    <div className="mb-2 p-2 bg-blue-50 rounded">
      <button onClick={speak} className="px-3 py-1 bg-brand-green text-white rounded">Test voix</button>
      {error && <span className="ml-2 text-red-600">{error}</span>}
    </div>
  );
};

export default TTSTest; 