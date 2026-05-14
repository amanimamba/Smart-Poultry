export type ProjectType = 'Ponte' | 'Chair' | 'Mixte';

export interface Project {
  id: string;
  name: string;
  type: ProjectType;
  chickCount: number;
  startDate: string;
  breed: string;
  origin: string;
  purchasePrice: number;
  budget: number;
  foodCost?: number;
  medsCost?: number;
  selectedFeedingStrategy: 'ideal' | 'average';
  ageInDaysAtStart: number;
  status: 'active' | 'completed';
}

export interface FeedPriceConfig {
  id: string;
  typeName: string;
  pricePerKg: number;
}

export interface MaintenanceTask {
  id: string;
  projectId: string;
  title: string;
  type: 'feeding' | 'cleaning' | 'vaccination';
  frequency: 'daily' | 'weekly' | 'custom';
  lastDoneAt?: string;
  nextScheduledAt: string;
  isDone: boolean;
}

export interface DailyLog {
  id: string;
  projectId: string;
  date: string;
  foodQuantity: number;
  waterQuantity: number;
  mortality: number;
  sickCount: number;
  symptoms: string[];
  medications: {
    name: string;
    dosage: string;
    type: 'med' | 'vitamin';
  }[];
  averageWeight?: number;
  notes?: string;
  timestamp: string;
}

export interface AIDetectionResult {
  diagnosis: string;
  urgency: 'Basse' | 'Moyenne' | 'Haute' | 'Critique';
  confidence: number;
  recommendations: string[];
  medications: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'user';
}
