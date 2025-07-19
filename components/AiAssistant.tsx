import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage } from '../types';
import { getChatResponseStreamWithImage, getChatResponseStream } from '../services/geminiService';
import { GoogleGenAI } from '@google/genai';
import Spinner from './Spinner';
import { motion, AnimatePresence } from 'framer-motion';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import {
  User,
  Bot,
  Image as ImageIcon,
  Mic,
  Send,
  Loader2,
  Volume2
} from 'lucide-react';
import TTSTest from './TTSTest';

// Bulle de chat stylée
const ChatBubble = ({ side, avatar, message, time, imageUrl, isLoading, onSpeak, isSpeaking }: any) => (
  <div className={`flex items-end ${side === 'right' ? 'justify-end' : 'justify-start'}`}>
    {side === 'left' && (
      <div className="mr-2">{avatar}</div>
    )}
    <div className={`max-w-xs lg:max-w-md flex flex-col ${side === 'right' ? 'items-end' : 'items-start'}`}>
      <div className={`px-4 py-3 rounded-2xl shadow ${side === 'right' ? 'bg-brand-green text-white rounded-br-none' : 'bg-white text-brand-brown rounded-bl-none'} relative`}>
        {imageUrl && (
          <img src={imageUrl} alt="envoyée" className="mb-2 rounded-xl max-w-[180px] max-h-[180px] object-cover border" />
        )}
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        ) : (
          <span>{message}</span>
        )}
        {onSpeak && (
          <button onClick={onSpeak} className="absolute bottom-1 right-1 p-1 rounded-full hover:bg-gray-100">
            <Volume2 className={isSpeaking ? "w-4 h-4 text-brand-green-dark animate-pulse" : "w-4 h-4 text-gray-400"} />
          </button>
        )}
      </div>
      {time && <span className="text-xs text-gray-400 mt-1">{time}</span>}
    </div>
    {side === 'right' && (
      <div className="ml-2">{avatar}</div>
    )}
  </div>
);

// Composant de test reconnaissance vocale
const VoiceTest = () => {
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const recognitionRef = useRef<any>(null);
  const start = () => {
    setError('');
    setResult('');
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setError("La reconnaissance vocale n'est pas supportée sur ce navigateur.");
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = 'fr-FR';
    recognitionRef.current.interimResults = false;
    recognitionRef.current.maxAlternatives = 1;
    recognitionRef.current.onresult = (event: any) => {
      setResult(event.results[0][0].transcript);
    };
    recognitionRef.current.onerror = () => setError('Erreur de reconnaissance vocale');
    recognitionRef.current.onend = () => {};
    recognitionRef.current.start();
  };
  return (
    <div className="mb-2 p-2 bg-yellow-50 rounded">
      <button onClick={start} className="px-3 py-1 bg-brand-green text-white rounded">Test micro</button>
      {result && <span className="ml-2 text-green-700">Reconnu : {result}</span>}
      {error && <span className="ml-2 text-red-600">{error}</span>}
    </div>
  );
};

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
  
};

const AiAssistant: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Scroll auto en bas (corrigé pour forcer le scroll après chaque render)
  useEffect(() => { scrollToBottom(); }, [messages, isLoading]);
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Message d'accueil
  useEffect(() => {
    setMessages([
      { id: 'init', text: 'Bonjour, je suis Docteur Plante ! Comment puis-je vous aider aujourd\'hui ? Posez-moi une question sur vos cultures, le sol, ou la météo.', sender: 'ai', timestamp: new Date().toISOString() }
    ]);
  }, []);

  // Gemini instance pour generateContent
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Gestion envoi message
  const handleSend = useCallback(async (prompt?: string, imageToSend?: string | null) => {
    const textToSend = prompt || input;
    if ((!textToSend.trim() && !imageToSend) || isLoading) return;
    const userMessage = {
      id: Date.now().toString(),
      text: textToSend,
      sender: 'user',
      timestamp: new Date().toISOString(),
      imageUrl: imageToSend || null
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setImage(null);
    setIsLoading(true);
    const aiMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: aiMessageId, text: '', sender: 'ai', timestamp: new Date().toISOString() }]);
    try {
      if (imageToSend) {
        // Envoi image + texte à Gemini (non-stream)
        const base64 = imageToSend.split(',')[1];
        const imagePart = {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64,
          },
        };
        const textPart = { text: textToSend || 'Analyse cette image.' };
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: { parts: [imagePart, textPart] },
        });
        const answer = response.text?.trim() || 'Aucune réponse.';
        setMessages(prev => prev.map(msg => msg.id === aiMessageId ? { ...msg, text: answer } : msg));
      } else {
        // Texte seul : streaming
        const stream = await getChatResponseStream(textToSend);
        for await (const chunk of stream) {
          const chunkText = chunk.text;
          setMessages(prev =>
            prev.map(msg =>
              msg.id === aiMessageId ? { ...msg, text: msg.text + chunkText } : msg
            )
          );
        }
      }
    } catch (error) {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === aiMessageId ? { ...msg, text: "Désolé, une erreur est survenue. Veuillez réessayer." } : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading]);

  // Suggestions
  const suggestedPrompts = [
    "Quel est le meilleur moment pour planter du maïs ?",
    "Comment traiter le mildiou sur les tomates ?",
    "Ma terre est très argileuse, que puis-je cultiver ?"
  ];

  // Gestion image
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Gestion commande vocale (speech-to-text via Web Speech API)
  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert("La reconnaissance vocale n'est pas supportée sur ce navigateur.");
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'fr-FR';
      recognitionRef.current.interimResults = false;
      recognitionRef.current.maxAlternatives = 1;
    }
    recognitionRef.current.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
      // Envoi automatique du message dicté
      setTimeout(() => handleSend(transcript), 100);
    };
    recognitionRef.current.onerror = () => {
      setIsListening(false);
      alert('Erreur de reconnaissance vocale.');
    };
    recognitionRef.current.onend = () => {
      setIsListening(false);
    };
    setIsListening(true);
    recognitionRef.current.start();
  };

  // Avatars
  const AvatarAssistant = () => (
    <div className="w-9 h-9 rounded-full bg-brand-green flex items-center justify-center shadow">
      <Bot className="w-6 h-6 text-white" />
    </div>
  );
  const AvatarUser = () => (
    <div className="w-9 h-9 rounded-full bg-gray-300 flex items-center justify-center shadow">
      <User className="w-6 h-6 text-brand-brown" />
    </div>
  );

  // Lecture vocale sur bulle IA
  const TTSBubble = (msg: any) => {
    const { isSpeaking, speak, stop } = useTextToSpeech(msg.text);
    return (
      <ChatBubble
        side="left"
        avatar={<AvatarAssistant />}
        message={msg.text}
        time={new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        imageUrl={msg.imageUrl}
        isLoading={!msg.text}
        onSpeak={msg.text ? (isSpeaking ? stop : speak) : undefined}
        isSpeaking={isSpeaking}
      />
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 max-w-lg mx-auto">
      <TTSTest />
      {/* Zone de messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {msg.sender === 'ai'
                ? <TTSBubble {...msg} />
                : <ChatBubble
                    side="right"
                    avatar={<AvatarUser />}
                    message={msg.text}
                    time={new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    imageUrl={msg.imageUrl}
                  />
              }
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>
      {/* Suggestions si aucun message utilisateur */}
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
      {/* Barre d’envoi fixée en bas */}
      <form
        className="bg-white p-3 flex items-center gap-2 border-t shadow z-10"
        onSubmit={e => {
          e.preventDefault();
          handleSend(undefined, image);
        }}
      >
        {/* Bouton image */}
        <button
          type="button"
          className="p-2 rounded-full hover:bg-gray-100"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon className="w-6 h-6 text-brand-green-dark" />
        </button>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageChange}
          className="hidden"
        />
        {/* Preview image */}
        {image && (
          <img src={image} alt="Aperçu" className="w-12 h-12 object-cover rounded-xl border mr-2" />
        )}
        {/* Champ texte */}
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={isListening ? "Parlez..." : "Dites-moi ce que vous amène..."}
          className="flex-1 p-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-green"
          disabled={isLoading || isListening}
        />
        {/* Bouton micro */}
        <button
          type="button"
          className={`p-2 rounded-full hover:bg-gray-100 ${isListening ? 'bg-brand-green/10 animate-pulse' : ''}`}
          onClick={handleVoiceInput}
          disabled={isListening}
        >
          <Mic className={`w-6 h-6 ${isListening ? 'text-brand-green-dark' : 'text-gray-400'}`} />
        </button>
        {/* Bouton envoi */}
        <button
          type="submit"
          className="p-2 rounded-full bg-brand-green text-white hover:bg-brand-green-dark disabled:bg-gray-400 transition"
          disabled={isLoading || (!input.trim() && !image)}
        >
          <Send className="w-6 h-6" />
        </button>
      </form>
    </div>
  );
};

export default AiAssistant;