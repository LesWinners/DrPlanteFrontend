import React from 'react';
import { View } from '../types';
import { navigationItems, CameraIcon } from '../constants';
import { MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface BottomNavProps {
  currentView: View;
  onNavigate: (view: View) => void;
}

const customNavigationItems = navigationItems.map(item =>
  item.view === View.Assistant
    ? { ...item, icon: MessageCircle }
    : item
);

const BottomNav: React.FC<BottomNavProps> = ({ currentView, onNavigate }) => {
  const standardNavItems = customNavigationItems.filter(item => item.view !== View.Scanner);
  const leftItems = standardNavItems.slice(0, 2);
  const rightItems = standardNavItems.slice(2);

  const NavButton = ({ item, isActive }: { item: typeof navigationItems[0], isActive: boolean }) => {
    return (
      <motion.button
        onClick={() => onNavigate(item.view)}
        className="relative flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-brand-green-dark focus:outline-none"
        whileTap={{ scale: 0.95 }}
      >
        <item.icon className={`w-7 h-7 mb-1 transition-colors ${isActive ? 'text-brand-green-dark' : 'text-gray-500'}`} />
        <span className={`text-xs font-medium transition-colors ${isActive ? 'text-brand-green-dark font-bold' : 'text-gray-600'}`}>{item.label}</span>
        {isActive && (
          <motion.div
            layoutId="active-nav-indicator"
            className="absolute bottom-1 w-5 h-1 bg-brand-green-dark rounded-full"
            initial={false}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        )}
      </motion.button>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-50 bg-white/90 backdrop-blur-sm border-t border-gray-200/80 max-w-lg mx-auto z-10 grid grid-cols-5 items-center py-3">
      {/* 2 boutons à gauche */}
      <NavButton item={leftItems[0]} isActive={currentView === leftItems[0].view} />
      <NavButton item={leftItems[1]} isActive={currentView === leftItems[1].view} />

      {/* Bouton scan centré */}
      <div className="flex justify-center items-center">
        <motion.button
          onClick={() => onNavigate(View.Scanner)}
          className="w-20 h-20 bg-brand-green rounded-full shadow-xl flex items-center justify-center text-white border-4 border-white z-20 transition-all duration-200 hover:bg-brand-green-dark hover:shadow-2xl active:bg-brand-green-darker"
          aria-label="Scanner une plante"
        >
          <CameraIcon className="w-10 h-10"/>
        </motion.button>
      </div>

      {/* 2 boutons à droite */}
      <NavButton item={rightItems[0]} isActive={currentView === rightItems[0].view} />
      <NavButton item={rightItems[1]} isActive={currentView === rightItems[1].view} />
    </nav>
  );
};

export default BottomNav;