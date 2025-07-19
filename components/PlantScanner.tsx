import React, { useState, useRef, useCallback, useEffect } from 'react';
import { BACKEND_URL } from "../constants";
import { analyzePlantImage, getChatResponseStream } from '../services/geminiService';
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

const saveAnalysis = async (analysisData: any) => {
  await fetch(`${BACKEND_URL}/analyses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(analysisData),
  });
};

// Quand tu as les résultats du scan :
const handleScanResult = (result: any) => {
  // result = { image, plantName, isPlant, diseaseName, confidence, recommendedTreatments }
  saveAnalysis({
    ...result,
    timestamp: new Date(),
  });
  // ... le reste du code
};

const PlantScanner: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<PlantScanResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputCameraRef = useRef<HTMLInputElement>(null);
  const fileInputGalleryRef = useRef<HTMLInputElement>(null);
  const [localPartners, setLocalPartners] = useState<string | null>(null);
  const [loadingPartners, setLoadingPartners] = useState(false);
  
  const textToSpeak = result ? `Analyse terminée. Plante détectée: ${result.plantName}. Diagnostic: ${result.disease}. Le traitement recommandé est le suivant : ${result.treatment.join('. ')}` : '';
  const { isSpeaking, speak, stop } = useTextToSpeech(textToSpeak);

  useEffect(() => {
    // Automatically speak when new results come in
    if (result && !isLoading) {
      speak();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, isLoading]);

  // Enregistrement automatique du résultat du scan en base de données
  useEffect(() => {
    if (result) {
      saveAnalysis({
        image: result.imageUrl, // ou result.image selon ta structure
        plantName: result.plantName,
        isPlant: true, // adapte si tu as une vraie valeur
        timestamp: new Date(),
        diseaseName: result.disease,
        confidence: result.confidence,
        recommendedTreatments: Array.isArray(result.treatment) ? result.treatment.join('\n') : result.treatment
      });
    }
  }, [result]);
  
  // Générer la recommandation partenaires après analyse
  useEffect(() => {
    if (result) {
      setLoadingPartners(true);
      // Récupérer la localisation utilisateur
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            fetchLocalPartners(result, `${latitude},${longitude}`);
          },
          () => {
            fetchLocalPartners(result, 'Abidjan');
          }
        );
      } else {
        fetchLocalPartners(result, 'Abidjan');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  const fetchLocalPartners = async (result: PlantScanResult, location: string) => {
    const prompt = `Tu es un assistant spécialisé dans la recherche de fournisseurs agricoles en Afrique. 
    
    L'utilisateur a diagnostiqué la maladie suivante : "${result.disease}" sur la plante "${result.plantName}". 
    Il est localisé à "${location}" et cherche des fournisseurs fiables pour acheter le traitement approprié.
    
    Donne-moi une liste de 3-4 fournisseurs ou points de vente fiables dans cette région. 
    
    Pour chaque fournisseur, fournis EXACTEMENT cette structure :
    
    Nom du fournisseur: [nom]
    Produit ou traitement à acheter: [produit spécifique]
    Adresse ou lieu précis: [adresse complète]
    Numéro de téléphone: [numéro si disponible]
    
    ---
    
    Sois précis et réaliste. Si tu ne connais pas de vrais fournisseurs dans cette région, suggère des types de lieux où chercher (coopératives agricoles, magasins de jardinage, etc.) avec des adresses génériques mais plausibles.
    
    Réponds uniquement avec la liste des fournisseurs, sans introduction ni conclusion.`;
    
    try {
      let answer = '';
      const stream = await getChatResponseStream(prompt);
      for await (const chunk of stream) {
        answer += chunk.text;
        setLocalPartners(answer);
      }
    } catch (e) {
      console.error('Erreur lors de la recherche de partenaires:', e);
      setLocalPartners("Impossible de récupérer les suggestions de partenaires pour le moment. Veuillez réessayer plus tard.");
    } finally {
      setLoadingPartners(false);
    }
  };

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
  
  const triggerCameraInput = () => {
    if (isSpeaking) stop();
    fileInputCameraRef.current?.click();
  };
  const triggerGalleryInput = () => {
    if (isSpeaking) stop();
    fileInputGalleryRef.current?.click();
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
              <h4 className="font-bold text-lg text-brand-brown mb-2">Recommandation :</h4>
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
      {/* Inputs cachés */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputCameraRef}
        onChange={handleImageChange}
        className="hidden"
      />
      <input
        type="file"
        accept="image/*"
        ref={fileInputGalleryRef}
        onChange={handleImageChange}
        className="hidden"
      />
      {/* Zone d'aperçu */}
      <div className="relative w-full h-64 bg-gray-200 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-400 mb-6">
        {image ? (
          <img src={image} alt="Aperçu de la plante" className="object-cover h-full w-full" />
        ) : (
          <div className="text-center text-gray-500">
            <CameraIcon className="w-16 h-16 mx-auto" />
            <p className="mt-2 font-semibold">Votre photo s'affichera ici</p>
          </div>
        )}
      </div>
      {/* Boutons choix */}
      <div className="flex w-full gap-3 mb-4">
        <button
          type="button"
          onClick={triggerCameraInput}
          disabled={isLoading}
          className="flex-1 bg-brand-green hover:bg-brand-green-dark text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center text-base transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Prendre <br /> une photo
        </button>
        <button
          type="button"
          onClick={triggerGalleryInput}
          disabled={isLoading}
          className="flex-1 bg-amber-200 hover:bg-amber-300 text-brand-brown font-bold py-3 rounded-xl shadow-lg flex items-center justify-center text-base transition-all duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Choisir dans <br />  la galerie
        </button>
      </div>
      {/* Bouton analyse */}
      <motion.button
        onClick={image ? () => handleAnalyze(image) : undefined}
        disabled={isLoading || !image}
        className="w-full bg-brand-green hover:bg-brand-green-dark text-white font-bold py-4 px-4 rounded-xl shadow-lg flex items-center justify-center text-lg transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
      >
        {isLoading ? <Spinner /> : 'Lancer l\'analyse'}
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
      {/* Suggestions partenaires locaux */}
      {result && (
        <div className="w-full mt-6 bg-white rounded-2xl shadow-lg p-5">
          <h3 className="text-lg font-bold text-brand-green-dark mb-4">Où acheter / Partenaires locaux</h3>
          {loadingPartners ? (
            <div className="text-sm text-gray-500 animate-pulse">Recherche de partenaires locaux...</div>
          ) : (
            <div className="flex flex-col gap-4">
              {localPartners && localPartners.split(/Nom du fournisseur:/i).filter(Boolean).map((block, idx) => {
                // Parser chaque bloc pour extraire les champs de manière plus robuste
                const lines = block.split('\n').map(line => line.trim()).filter(line => line.length > 0);
                
                let nom = '';
                let produit = '';
                let adresse = '';
                let tel = '';
                
                for (const line of lines) {
                  if (line.startsWith('Nom du fournisseur:')) {
                    nom = line.replace('Nom du fournisseur:', '').trim();
                  } else if (line.startsWith('Produit ou traitement à acheter:')) {
                    produit = line.replace('Produit ou traitement à acheter:', '').trim();
                  } else if (line.startsWith('Adresse ou lieu précis:')) {
                    adresse = line.replace('Adresse ou lieu précis:', '').trim();
                  } else if (line.startsWith('Numéro de téléphone:')) {
                    tel = line.replace('Numéro de téléphone:', '').trim();
                  } else if (!nom && line.length > 0) {
                    // Si c'est la première ligne et qu'on n'a pas encore de nom, c'est probablement le nom
                    nom = line;
                  }
                }
                
                if (!nom) return null;
                
                return (
                  <div key={idx} className="p-4 rounded-2xl bg-green-50 border border-green-200 shadow flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg text-brand-green-dark">{nom}</span>
                      {produit && <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-1 rounded ml-2">{produit}</span>}
                    </div>
                    {adresse && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <span role="img" aria-label="Lieu">📍</span>
                        <span>{adresse}</span>
                      </div>
                    )}
                    {tel && (
                      <div className="flex items-center gap-2 text-blue-700">
                        <span role="img" aria-label="Téléphone">📞</span>
                        <a href={`tel:${tel.replace(/[^+\d]/g, '')}`} className="underline">{tel}</a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlantScanner;