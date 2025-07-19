import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage } from '../types';
import { getChatResponseStream } from '../services/geminiService';
import Spinner from './Spinner';
import { motion, AnimatePresence } from 'framer-motion';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { SpeakerOnIcon, SpeakerOffIcon } from '../constants';


const AIMessage = ({ message }: { message: ChatMessage }) => {
  const { isSpeaking, speak, stop } = useTextToSpeech(message.text);

  return (
    <div className="flex items-end space-x-2">
      <div className={`px-4 py-3 rounded-2xl max-w-xs lg:max-w-md shadow bg-white text-brand-brown rounded-bl-none`}>
        {message.text ? message.text : <Spinner />}
      </div>
       {message.text && (
         <button onClick={isSpeaking ? stop : speak} className="p-2 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0">
           {isSpeaking ? <SpeakerOffIcon className="w-5 h-5 text-brand-green-dark" /> : <SpeakerOnIcon className="w-5 h-5 text-gray-500" />}
         </button>
       )}
    </div>
  )
}

const AiAssistant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  useEffect(() => {
    setMessages([
        { id: 'init', text: 'Bonjour, je suis Docteur Plante ! Comment puis-je vous aider aujourd\'hui ? Posez-moi une question sur vos cultures, le sol, ou la météo.', sender: 'ai', timestamp: new Date().toISOString() }
    ]);
  }, []);

  const handleSend = useCallback(async (prompt?: string) => {
    const textToSend = prompt || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: textToSend,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const aiMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: aiMessageId, text: '', sender: 'ai', timestamp: new Date().toISOString() }]);

    try {
      const stream = await getChatResponseStream(textToSend);
      for await (const chunk of stream) {
        const chunkText = chunk.text;
        setMessages(prev =>
          prev.map(msg =>
            msg.id === aiMessageId ? { ...msg, text: msg.text + chunkText } : msg
          )
        );
      }
    } catch (error) {
      console.error("Failed to get chat response:", error);
      setMessages(prev => 
        prev.map(msg => 
            msg.id === aiMessageId ? {...msg, text: "Désolé, une erreur est survenue. Veuillez réessayer."} : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading]);

  const suggestedPrompts = [
    "Quel est le meilleur moment pour planter du maïs ?",
    "Comment traiter le mildiou sur les tomates ?",
    "Ma terre est très argileuse, que puis-je cultiver ?"
  ];

  return (
    <div className="flex flex-col h-full bg-brand-beige">
      <div className="flex-grow p-4 overflow-y-auto space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
             <motion.div
              key={msg.id}
              className={`flex items-end ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {msg.sender === 'user' ? (
                <div className="px-4 py-3 rounded-2xl max-w-xs lg:max-w-md shadow bg-brand-green text-white rounded-br-none">
                  {msg.text}
                </div>
              ) : (
                <AIMessage message={msg} />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>
      
      {!isLoading && messages.length <= 1 && (
        <div className="p-4 pt-0">
            <h3 className="text-sm font-bold text-gray-500 mb-2">Suggestions :</h3>
            <div className="flex flex-col space-y-2">
                {suggestedPrompts.map(prompt => (
                    <motion.button 
                        key={prompt}
                        onClick={() => handleSend(prompt)}
                        className="text-left text-sm p-3 bg-white rounded-lg shadow hover:bg-gray-50 transition"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {prompt}
                    </motion.button>
                ))}
            </div>
        </div>
      )}

      <div className="p-4 bg-white/80 backdrop-blur-sm border-t border-gray-200/80">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Écrivez votre message..."
            className="flex-grow p-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-green"
            disabled={isLoading}
          />
          <motion.button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="bg-brand-green text-white p-3 rounded-full disabled:bg-gray-400 transition-transform"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
              <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086L2.289 16.761a.75.75 0 00.826.95l14.433-5.38a.75.75 0 000-1.417L3.105 2.289z" />
            </svg>
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default AiAssistant;