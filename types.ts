
export type Difficulty = 'Iniciante' | 'Intermediário' | 'Avançado';
export type Category = 'Aquecimento' | 'Pé' | 'Sentado' | 'Inversão' | 'Restaurativa' | 'Core' | 'Finalização';
export type Goal = 'Flexibilidade' | 'Força' | 'Relaxamento' | 'Alívio de Dor';
export type Duration = 15 | 30 | 45;
export type Discomfort = 'Lombar' | 'Joelhos' | 'Pescoço/Ombros' | 'Punhos' | 'Nenhum';

export interface Media {
  thumbnailUrl: string;
  videoEmbedUrl: string;
}

export interface Pose {
  id: string;
  sanskritName: string;
  portugueseName: string;
  difficulty: Difficulty;
  category: Category;
  benefits: string[];
  media: Media;
  durationDefault: number; // in seconds
  description: string;
}

export interface UserPreferences {
  level: Difficulty;
  goal: Goal;
  duration: Duration;
  age?: number;
  weight?: number;
  discomforts: Discomfort[];
  hasOnboarded: boolean;
  startDate?: string; // ISO Date string of when they started the plan
}

export interface Routine {
  id: string;
  name: string;
  poses: Pose[];
  totalDuration: number;
  createdAt: Date;
}

// New Types for Calendar and Plan
export interface SessionRecord {
  id: string;
  date: string; // ISO String YYYY-MM-DD
  routineName: string;
  duration: number; // minutes
  mood?: 'happy' | 'calm' | 'tired' | 'energized';
}

export interface PlanDay {
  dayOfWeek: number; // 0 (Sun) - 6 (Sat)
  activityType: 'Rest' | 'Active';
  focus?: string;
  description?: string;
}

export interface TrainingPlan {
  id: string;
  name: string;
  description: string;
  schedule: PlanDay[]; // 7 items, index 0 is Sunday
}

export type ViewState = 'ONBOARDING' | 'DASHBOARD' | 'PLAYER' | 'LIBRARY' | 'JOURNEY' | 'PLAN_EDITOR' | 'ROUTINE_EDITOR';
