import React, { useState, useMemo } from 'react';
import { knowledgeArticles } from '../constants';
import { KnowledgeArticle } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { SpeakerOnIcon, SpeakerOffIcon } from '../constants';


const ArticleCard = ({ article }: { article: KnowledgeArticle }) => {
  const textToSpeak = `${article.title}. Catégorie: ${article.category}. Résumé: ${article.summary}`;
  const { isSpeaking, speak, stop } = useTextToSpeech(textToSpeak);

  return (
    <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col"
    >
      <img src={article.imageUrl} alt={article.title} className="w-full h-40 object-cover" />
      <div className="p-4 flex-grow">
        <div className="flex justify-between items-center">
            <span className="text-xs font-semibold bg-brand-green-light text-brand-green-dark px-2 py-1 rounded-full">{article.category}</span>
            <button onClick={isSpeaking ? stop : speak} className="p-2 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0">
               {isSpeaking ? <SpeakerOffIcon className="w-5 h-5 text-brand-green-dark" /> : <SpeakerOnIcon className="w-5 h-5 text-gray-500" />}
            </button>
        </div>
        <h3 className="mt-2 text-lg font-bold text-brand-brown">{article.title}</h3>
        <p className="mt-1 text-sm text-gray-600">{article.summary}</p>
      </div>
       <div className="p-4 bg-gray-50 border-t">
           <button className="w-full text-center text-brand-green-dark font-semibold hover:underline">
              Lire la suite
           </button>
       </div>
    </motion.div>
  )
}


const KnowledgeBase: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Plantes' | 'Maladies' | 'Conseils'>('All');

  const categories: ('All' | 'Plantes' | 'Maladies' | 'Conseils')[] = ['All', 'Plantes', 'Maladies', 'Conseils'];

  const filteredArticles = useMemo(() => {
    return knowledgeArticles.filter(article => {
      const matchesCategory = selectedCategory === 'All' || article.category === selectedCategory;
      const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) || article.summary.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchTerm, selectedCategory]);

  return (
    <div className="p-4">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Rechercher un article..."
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors shadow-sm ${
              selectedCategory === category
                ? 'bg-brand-green text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {category === 'All' ? 'Tous' : category}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <AnimatePresence>
            {filteredArticles.length > 0 ? (
              filteredArticles.map((article: KnowledgeArticle) => (
                <ArticleCard key={article.id} article={article} />
              ))
            ) : (
              <p className="text-center text-gray-500 pt-10">Aucun article ne correspond à votre recherche.</p>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default KnowledgeBase;