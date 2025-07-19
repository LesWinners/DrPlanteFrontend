import React from 'react';
import { CloudIcon, CloudSlashIcon, LeafIcon } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
  title: string;
  isOffline: boolean;
  onToggleOffline: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, isOffline, onToggleOffline }) => {
  return (
    <header className="bg-white p-4 flex justify-between items-center sticky top-0 z-10 border-b border-gray-200">
      <div className="flex items-center space-x-3">
        <LeafIcon className="w-7 h-7 text-brand-green"/>
        <h1 className="text-xl font-bold text-brand-green-dark">{title}</h1>
      </div>
      <motion.button 
        onClick={onToggleOffline} 
        className="p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none"
        whileTap={{ scale: 0.9 }}
        title={isOffline ? 'Mode hors ligne' : 'Mode en ligne'}
      >
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={isOffline ? 'offline' : 'online'}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2 }}
          >
            {isOffline ? (
              <CloudSlashIcon className="w-6 h-6 text-red-500" />
            ) : (
              <CloudIcon className="w-6 h-6 text-green-500" />
            )}
          </motion.div>
        </AnimatePresence>
      </motion.button>
    </header>
  );
};

export default Header;