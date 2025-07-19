import React, { useState, useRef, useCallback, useEffect } from 'react';
import { analyzePlantImage } from '../services/geminiService';
import Spinner from './Spinner';
import { CameraIcon, CheckCircleIcon, AlertTriangleIcon, SpeakerOnIcon, SpeakerOffIcon } from '../constants';
import { PlantScanResult } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useTextToSpeech } from '../hooks/useTextToSpeech';


const ProgressCircle = ({ progress }: { progress: number }) => {
  const radius = 50;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative">
      <svg
        height={radius * 2}
        width={radius * 2}
        className="transform -rotate-90"
      >
        <circle
          stroke="#e6e6e6"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          className="text-brand-green"
          stroke="currentColor"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-brand-green-dark">
        {`${progress}%`}
      </span>
    </div>
  );
};


const PlantScanner: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<PlantScanResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const textToSpeak = result ? `Analyse terminée. Plante détectée: ${result.plantName}. Diagnostic: ${result.disease}. Le traitement recommandé est le suivant: ${result.treatment.join('. ')}` : '';
  const { isSpeaking, speak, stop } = useTextToSpeech(textToSpeak);

  useEffect(() => {
    // Automatically speak when new results come in
    if (result && !isLoading) {
      speak();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, isLoading]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Image = reader.result as string;
        setImage(base64Image);
        setResult(null);
        setError(null);
        handleAnalyze(base64Image);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const triggerFileInput = () => {
    if (isSpeaking) stop();
    fileInputRef.current?.click();
  };
  
  const handleAnalyze = useCallback(async (base64Image: string) => {
    if (!base64Image) return;

    setIsLoading(true);
    setError(null);
    setResult(null);
    if(isSpeaking) stop();

    try {
      const base64Data = base64Image.split(',')[1];
      const analysisResult = await analyzePlantImage(base64Data);

      if (analysisResult) {
          const isCritical = analysisResult.disease.toLowerCase() !== 'saine' && analysisResult.disease.toLowerCase() !== 'aucune détectée';
          setResult({ ...analysisResult, imageUrl: base64Image, isCritical });
      } else {
          setError("L'analyse n'a retourné aucun résultat. Veuillez réessayer.");
      }
    } catch (err) {
      setError("Une erreur est survenue lors de l'analyse. Vérifiez votre connexion et réessayez.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [isSpeaking, stop]);

  const renderResult = () => {
    if (!result) return null;

    return (
      <motion.div 
        className="mt-6 w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className={`p-4 flex items-center justify-between ${result.isCritical ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
              <div className="flex items-center">
                  {result.isCritical ? <AlertTriangleIcon className="w-8 h-8 mr-3" /> : <CheckCircleIcon className="w-8 h-8 mr-3" />}
                  <h3 className="text-xl font-bold">{result.disease}</h3>
              </div>
              <button onClick={isSpeaking ? stop : speak} className="p-2 rounded-full hover:bg-black/10 transition-colors">
                {isSpeaking ? <SpeakerOffIcon className="w-6 h-6" /> : <SpeakerOnIcon className="w-6 h-6" />}
              </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex items-center space-x-6">
              <div className="flex-shrink-0">
                <ProgressCircle progress={result.confidence} />
                <p className="text-center text-sm mt-1 text-gray-500">Confiance</p>
              </div>
              <div className="flex-grow">
                <p className="text-sm text-gray-500">Plante identifiée</p>
                <p className="text-2xl font-bold text-brand-green-dark">{result.plantName}</p>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-lg text-brand-brown mb-2">Traitement Recommandé:</h4>
              <ul className="space-y-2 text-gray-700 list-disc list-inside">
                {result.treatment.map((step, index) => (
                    <li key={index}>{step}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="p-4 flex flex-col items-center">
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        onChange={handleImageChange}
        className="hidden"
      />
      
      <div className="relative w-full h-64 bg-gray-200 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-400 mb-6">
        {image ? (
          <img src={image} alt="Aperçu de la plante" className="object-cover h-full w-full" />
        ) : (
          <div className="text-center text-gray-500">
            <CameraIcon className="w-16 h-16 mx-auto" />
            <p className="mt-2 font-semibold">Prendre ou importer une photo</p>
          </div>
        )}
      </div>

      <motion.button
        onClick={triggerFileInput}
        disabled={isLoading}
        className="w-full bg-brand-green hover:bg-brand-green-dark text-white font-bold py-4 px-4 rounded-xl shadow-lg flex items-center justify-center text-lg transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
      >
        {isLoading ? <Spinner /> : 'Lancer une nouvelle analyse'}
      </motion.button>

      <AnimatePresence>
        {isLoading && (
          <motion.div 
            className="mt-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
              <p className="text-gray-600 animate-pulse text-lg">Analyse en cours, veuillez patienter...</p>
              <div className="mt-4 bg-gray-200 h-2 rounded-full w-full overflow-hidden">
                  <motion.div 
                    className="bg-brand-green h-full"
                    initial={{ x: "-100%" }}
                    animate={{ x: "0%" }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  />
              </div>
          </motion.div>
        )}
      </AnimatePresence>
      

      {error && <p className="mt-4 text-red-600 bg-red-100 p-3 rounded-lg w-full text-center">{error}</p>}
      
      <AnimatePresence>
        {renderResult()}
      </AnimatePresence>
    </div>
  );
};

export default PlantScanner;