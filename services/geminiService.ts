import { GoogleGenAI, Chat, GenerateContentResponse, Type } from "@google/genai";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

let chat: Chat;

const getChat = (): Chat => {
    if (!chat) {
        chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: `Tu es "DrPlante", un assistant IA spécialisé en agriculture pour les fermiers en Afrique. 
                Fournis des réponses claires, simples et concises. Utilise un langage facile à comprendre, même pour quelqu'un qui n'est pas un expert. 
                Adapte tes conseils au contexte africain (climat, types de sol, cultures courantes). 
                Sois encourageant et positif.`,
            },
        });
    }
    return chat;
};

export const getChatResponseStream = async (message: string) => {
    const currentChat = getChat();
    const result = await currentChat.sendMessageStream({ message });
    return result;
};

export const analyzePlantImage = async (base64Image: string): Promise<any> => {
    const imagePart = {
        inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image,
        },
    };

    const textPart = {
        text: `Analyse cette image d'une plante. L'utilisateur est un agriculteur en Afrique. Réponds en français. Identifie la plante, la maladie (ou si elle est saine), ton niveau de confiance, et propose un traitement simple avec des ressources locales.`
    };
    
    const schema = {
        type: Type.OBJECT,
        properties: {
            plantName: {
                type: Type.STRING,
                description: 'Le nom de la plante identifiée.',
            },
            disease: {
                type: Type.STRING,
                description: 'Le nom de la maladie suspectée, ou "Saine" si rien n\'est détecté.',
            },
            confidence: {
                type: Type.INTEGER,
                description: 'Le niveau de confiance du diagnostic en pourcentage (ex: 85).',
            },
            treatment: {
                type: Type.ARRAY,
                description: 'Un conseil de traitement simple en plusieurs étapes courtes.',
                items: {
                  type: Type.STRING
                }
            },
        }
    };

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            }
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Error analyzing image with Gemini:", error);
        throw new Error("Failed to communicate with the AI for image analysis.");
    }
};