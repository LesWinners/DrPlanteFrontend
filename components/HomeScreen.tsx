import React, { useEffect, useState } from 'react';
import { BACKEND_URL } from "../constants";
import { View } from '../types';
import {
  Camera,
  MessageCircle,
  BookOpen,
  BarChart2,
  CloudSun,
  Droplets,
  Thermometer,
  Search,
  X,
  Clock,
  Target,
  Leaf,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import clsx from 'clsx';

interface HomeScreenProps {
  onNavigate: (view: View) => void;
}

const WeatherStat = () => {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      fetchWeather('Abidjan');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        fetchWeather(`${latitude},${longitude}`);
      },
      (err) => {
        // Si refus ou erreur, fallback sur Abidjan
        fetchWeather('Abidjan');
      }
    );
  }, []);

  const fetchWeather = (q: string) => {
    fetch(`https://api.weatherapi.com/v1/current.json?key=dc7e1a9793a249389c5151834251907&q=${q}&lang=fr`)
      .then(res => res.json())
      .then(data => {
        setWeather(data);
        setLoading(false);
      });
  };

  if (loading) return <div className="text-xs text-gray-400">Chargement météo...</div>;
  if (!weather) return <div className="text-xs text-red-500">Erreur météo</div>;
  return (
    <div className="flex flex-col items-center">
      <img src={weather.current.condition.icon} alt={weather.current.condition.text} className="w-10 h-10 mb-1" />
      <span className="text-2xl font-bold text-brand-green-dark">{weather.current.temp_c}°C</span>
      <div className="text-base font-medium text-gray-700 mb-1">Météo</div>
      <div className="text-xs text-gray-500">{weather.location.name} — {weather.current.condition.text}, {weather.current.humidity}% humidité</div>
    </div>
  );
};

const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [analysisCount, setAnalysisCount] = useState(0);
  const [analyses, setAnalyses] = useState([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [isDetailExpanded, setIsDetailExpanded] = useState(false);
  
  useEffect(() => {
    fetch(`${BACKEND_URL}/analyses/count`)
      .then(res => res.json())
      .then(data => setAnalysisCount(data.count))
      .catch(() => setAnalysisCount(0));
  }, []);

  useEffect(() => {
    fetch(`${BACKEND_URL}/analyses`)
      .then(res => res.json())
      .then(data => setAnalyses(data));
  }, []);

  const expandAnalysisDetail = (analysis) => {
    setSelectedAnalysis(analysis);
    setIsDetailExpanded(true);
  };

  const collapseAnalysisDetail = () => {
    setIsDetailExpanded(false);
    setTimeout(() => setSelectedAnalysis(null), 300); // Attendre la fin de l'animation
  };

  // Effet pour s'assurer que le scroll se fait quand les détails s'ouvrent
  useEffect(() => {
    if (isDetailExpanded) {
      // Attendre que le DOM soit mis à jour puis faire le scroll
      setTimeout(() => {
        const detailView = document.querySelector('.detail-view');
        if (detailView) {
          detailView.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 200);
    }
  }, [isDetailExpanded]);

  return (
    <div className="p-4 flex flex-col h-full overflow-y-auto animate-fade-in">
      {/* Header */}
      <div className="text-center p-6 mb-6 bg-white rounded-2xl shadow-lg animate-fade-in">
        <h1 className="text-xl font-bold text-brand-green-dark">Bienvenue chez Dr. Plante</h1>
        <p className="text-gray-600 mt-2 text-sm">Votre partenaire pour une agriculture saine.</p>
      </div>
      {/* Bouton principal Scanner */}
      <button
        onClick={() => onNavigate(View.Scanner)}
        className="w-full p-8 mb-6 rounded-2xl shadow-xl bg-brand-green-dark text-white flex flex-col items-center justify-center text-center transition-all duration-300 hover:bg-brand-green hover:scale-105 animate-in"
      >
        <Camera className="w-20 h-20 mb-2" />
        <h2 className="text-2xl font-bold mt-2">Scanner la Plante</h2>
        <p className="mt-2 text-md text-white/80">Diagnostiquer une maladie en une photo.</p>
      </button>
      {/* Boutons secondaires */}
      <div className="grid grid-cols-3 gap-4 mb-6 animate-fade-in">
        <button
          onClick={() => onNavigate(View.Assistant)}
          className={clsx(
            'p-4 rounded-2xl shadow-lg flex flex-col items-center justify-center text-center transition-all duration-200 bg-amber-100 hover:bg-amber-200',
            'hover:scale-105'
          )}
        >
          <MessageCircle className="w-10 h-10 mb-2 text-amber-800" />
          <span className="text-sm font-bold text-amber-800">Conseiller</span>
        </button>
        <button
          onClick={() => onNavigate(View.Knowledge)}
          className={clsx(
            'p-4 rounded-2xl shadow-lg flex flex-col items-center justify-center text-center transition-all duration-200 bg-sky-100 hover:bg-sky-200',
            'hover:scale-105'
          )}
        >
          <BookOpen className="w-10 h-10 mb-2 text-sky-800" />
          <span className="text-sm font-bold text-sky-800">Apprendre</span>
        </button>
        <button
          onClick={() => onNavigate(View.Dashboard)}
          className={clsx(
            'p-4 rounded-2xl shadow-lg flex flex-col items-center justify-center text-center transition-all duration-200 bg-rose-100 hover:bg-rose-200',
            'hover:scale-105'
          )}
        >
          <BarChart2 className="w-10 h-10 mb-2 text-rose-800" />
          <span className="text-sm font-bold text-rose-800">Suivi</span>
        </button>
      </div>
      {/* Statistiques */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 animate-fade-in">
        <h3 className="text-lg font-bold text-brand-green-dark mb-4">Statistiques</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Analyses */}
          <div className="flex flex-col items-center justify-between bg-green-50 rounded-xl py-6">
            <div className="flex flex-col items-center mb-2">
              <Search className="w-8 h-8 text-brand-green-dark mb-1" />
              <span className="text-2xl font-bold text-brand-green-dark">{analysisCount || 0}</span>
            </div>
            <div className="text-base font-medium text-gray-700 mb-1">Analyses</div>
            <div className="text-xs text-gray-500">Total réalisées</div>
          </div>
          {/* Météo Abidjan */}
          <div className="flex flex-col items-center justify-between bg-blue-50 rounded-xl py-6">
            <WeatherStat />
          </div>
        </div>
      </div>
      {/* Historique des scans (ancienne version, carte déroulante) */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-brand-green-dark">Historique des scans</h3>
          <button 
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            className="text-brand-green-dark hover:text-brand-green-darker transition-colors"
          >
            {isHistoryOpen ? 'Masquer' : 'Afficher'}
          </button>
        </div>
        <div
          style={{
            height: isHistoryOpen ? 'auto' : 0,
            opacity: isHistoryOpen ? 1 : 0,
            transition: 'all 0.3s',
            overflow: 'hidden',
          }}
        >
          <div className="space-y-3">
            {analyses.map((scan) => (
              <div key={scan.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-semibold text-gray-800">{scan.plantName}</div>
                  <div className="text-sm text-gray-600">{scan.diseaseName}</div>
                  <div className="text-xs text-gray-500">{new Date(scan.timestamp).toLocaleString('fr-FR')}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="text-sm font-bold text-brand-green-dark">{scan.confidence}%</div>
                  <div className="text-xs text-gray-500">confiance</div>
                  <button 
                    onClick={() => expandAnalysisDetail(scan)}
                    className="text-xs text-blue-600 hover:underline mt-1 transition-colors"
                  >
                    Voir détail
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Vue détaillée de l'analyse - remplace le modal */}
      {isDetailExpanded && selectedAnalysis && (
        <div className="fixed inset-0 bg-gradient-to-br from-green-50 to-blue-50 z-50 overflow-y-auto">

          {/* Contenu principal */}
          <div className="p-4 space-y-6 max-w-2xl mx-auto">
            {/* Carte principale avec image */}
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
              {selectedAnalysis.image && (
                <div className="relative">
                  <img 
                    src={selectedAnalysis.image} 
                    alt="Plante scannée" 
                    className="w-full h-64 object-cover"
                  />
                </div>
              )}
              
              {/* Informations principales */}
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Leaf className="w-6 h-6 text-brand-green-dark mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Plante identifiée</p>
                      <p className="text-xl font-bold text-brand-green-dark">{selectedAnalysis.plantName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                      {selectedAnalysis.confidence}% confiance
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <Target className="w-6 h-6 text-red-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Diagnostic</p>
                    <p className="text-lg font-semibold text-gray-800">{selectedAnalysis.diseaseName}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Clock className="w-6 h-6 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Analyse effectuée le</p>
                    <p className="text-sm font-medium text-gray-700">
                      {new Date(selectedAnalysis.timestamp).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section traitements */}
            {selectedAnalysis.recommendedTreatments && (
              <div className="bg-white rounded-3xl shadow-xl p-6">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <Target className="w-4 h-4 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">Traitements recommandés</h3>
                </div>
                
                <div className="space-y-3">
                  {selectedAnalysis.recommendedTreatments.split('\n').map((treatment, index) => (
                    treatment.trim() && (
                      <div key={index} className="flex items-start p-3 bg-green-50 rounded-xl">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <p className="text-sm text-gray-700 leading-relaxed">{treatment.trim()}</p>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* Bouton d'action */}
            <div className="text-center pb-6">
              <button 
                onClick={collapseAnalysisDetail}
                className="bg-brand-green-dark text-white px-8 py-3 rounded-full font-semibold hover:bg-brand-green transition-colors shadow-lg"
              >
                Fermer les détails
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeScreen;