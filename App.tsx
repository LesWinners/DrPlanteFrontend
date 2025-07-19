import React from 'react';
import TTSTest from "./components/TTSTest";
import { useState, useCallback } from 'react';
import { View } from './types';
import BottomNav from './components/BottomNav';
import HomeScreen from './components/HomeScreen';
import PlantScanner from './components/PlantScanner';
import AiAssistant from './components/AiAssistant';
import KnowledgeBase from './components/KnowledgeBase';
import Dashboard from './components/Dashboard';
import Header from './components/Header';
import { AnimatePresence, motion, type Transition } from 'framer-motion';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.Home);
  const [isOffline, setIsOffline] = useState<boolean>(false);

  const handleNavigation = useCallback((view: View) => {
    setCurrentView(view);
  }, []);
  
  const toggleOfflineMode = useCallback(() => {
    setIsOffline(prev => !prev);
  }, []);

  const pageVariants = {
    initial: { opacity: 0, x: -20 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: 20 },
  };

  const pageTransition: Transition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.5
  };

  const renderView = () => {
    switch (currentView) {
      case View.Home:
        return <HomeScreen onNavigate={handleNavigation} />;
      case View.Scanner:
        return <PlantScanner />;
      case View.Assistant:
        return <AiAssistant />;
      case View.Knowledge:
        return <KnowledgeBase />;
      case View.Dashboard:
        return <Dashboard />;
      default:
        return <HomeScreen onNavigate={handleNavigation} />;
    }
  };

  const getTitleForView = (view: View): string => {
    switch (view) {
      case View.Home:
        return "Dr Plante";
      case View.Scanner:
        return "Scanner une Plante";
      case View.Assistant:
        return "Mon Conseiller";
      case View.Knowledge:
        return "Base de Connaissances";
      case View.Dashboard:
        return "Tableau de Bord";
      default:
        return "DrPlante";
    }
  };

  return (
    <div className="flex flex-col h-screen font-sans bg-brand-beige text-brand-brown max-w-lg mx-auto shadow-2xl overflow-hidden">
      <Header 
        title={getTitleForView(currentView)} 
        isOffline={isOffline}
        onToggleOffline={toggleOfflineMode}
      />
      <main className="flex-grow overflow-y-auto pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomNav currentView={currentView} onNavigate={handleNavigation} />
    </div>
  );
};

export default App;