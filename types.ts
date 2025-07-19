export enum View {
  Home = 'HOME',
  Scanner = 'SCANNER',
  Assistant = 'ASSISTANT',
  Knowledge = 'KNOWLEDGE',
  Dashboard = 'DASHBOARD',
  Community = 'COMMUNITY'
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: string;
}

export interface PlantScanResult {
  plantName: string;
  disease: string;
  confidence: number;
  treatment: string[];
  isCritical: boolean;
  imageUrl: string;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: 'Plantes' | 'Maladies' | 'Conseils';
  summary: string;
  imageUrl: string;
}