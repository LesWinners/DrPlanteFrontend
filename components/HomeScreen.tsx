import React, { useEffect, useState } from 'react';
import { View } from '../types';
import {
  Camera,
  MessageCircle,
  BookOpen,
  BarChart2,
  CloudSun,
  Droplets,
  Thermometer,
  Search
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import clsx from 'clsx';

interface HomeScreenProps {
  onNavigate: (view: View) => void;
}

const stats = {
  totalAnalyses: 47,
  precisionRate: 94.2,
  weather: {
    temperature: 24,
    humidity: 65,
    condition: 'Ensoleillé'
  }
};

const scanHistory = [
  { id: 1, plant: 'Tomate', disease: 'Mildiou', date: '2024-01-15', confidence: 96 },
  { id: 2, plant: 'Maïs', disease: 'Sain', date: '2024-01-14', confidence: 98 },
  { id: 3, plant: 'Pomme de terre', disease: 'Mildiou', date: '2024-01-13', confidence: 92 },
  { id: 4, plant: 'Haricot', disease: 'Rouille', date: '2024-01-12', confidence: 89 },
];

const WeatherStat = () => {
  const [weather, setWeather] = useState<any>(null);
  useEffect(() => {
    fetch('https://api.weatherapi.com/v1/current.json?key=dc7e1a9793a249389c5151834251907&q=Abidjan&lang=fr')
      .then(res => res.json())
      .then(data => setWeather(data));
  }, []);
  if (!weather) return <div className="text-xs text-gray-400">Chargement météo...</div>;
  return (
    <div className="flex flex-col items-center">
      <img src={weather.current.condition.icon} alt={weather.current.condition.text} className="w-10 h-10 mb-1" />
      <span className="text-2xl font-bold text-brand-green-dark">{weather.current.temp_c}°C</span>
      <div className="text-base font-medium text-gray-700 mb-1">Météo</div>
      <div className="text-xs text-gray-500">{weather.current.condition.text}, {weather.current.humidity}% humidité</div>
    </div>
  );
};

const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  return (
    <div className="p-4 flex flex-col h-full overflow-y-auto animate-fade-in">
      {/* Header */}
      <div className="text-center p-6 mb-6 bg-white rounded-2xl shadow-lg animate-fade-in">
        <h1 className="text-2xl font-bold text-brand-green-dark">Bienvenue sur DrPlante</h1>
        <p className="text-gray-600 mt-2">Votre partenaire pour une agriculture saine.</p>
      </div>
      {/* Bouton principal Scanner */}
      <button
        onClick={() => onNavigate(View.Scanner)}
        className="w-full p-8 mb-6 rounded-2xl shadow-xl bg-brand-green-dark text-white flex flex-col items-center justify-center text-center transition-all duration-300 hover:bg-brand-green hover:scale-105 animate-in"
      >
        <Camera className="w-20 h-20 mb-2" />
        <h2 className="text-3xl font-bold mt-2">Scanner la Plante</h2>
        <p className="mt-2 text-lg text-white/80">Diagnostiquer une maladie en une photo.</p>
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
          <span className="text-sm font-bold text-amber-800">Mon Conseiller</span>
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
              <span className="text-2xl font-bold text-brand-green-dark">{stats.totalAnalyses}</span>
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
            {scanHistory.map((scan) => (
              <div key={scan.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-semibold text-gray-800">{scan.plant}</div>
                  <div className="text-sm text-gray-600">{scan.disease}</div>
                  <div className="text-xs text-gray-500">{new Date(scan.date).toLocaleDateString('fr-FR')}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="text-sm font-bold text-brand-green-dark">{scan.confidence}%</div>
                  <div className="text-xs text-gray-500">confiance</div>
                  <button className="text-xs text-blue-600 hover:underline mt-1 transition-colors">Voir détail</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;