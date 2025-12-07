

export type Difficulty = 'Iniciante' | 'Intermediário' | 'Avançado';
export type Category = 'Aquecimento' | 'Pé' | 'Sentado' | 'Inversão' | 'Restaurativa' | 'Core' | 'Finalização';
export type Goal = 'Flexibilidade' | 'Força' | 'Relaxamento' | 'Alívio de Dor';
export type Duration = 15 | 30 | 45;
export type Discomfort = 'Lombar' | 'Joelhos' | 'Pescoço/Ombros' | 'Punhos' | 'Nenhum';

export interface User {
  id: string;
  name: string;
  email: string;
}

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
  userId?: string; // Link preferences to a user
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
  userId?: string; // Link session to a user
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
  userId?: string; // Link plan to a user
  name: string;
  description: string;
  schedule: PlanDay[]; // Fallback / Current Display Schedule
  weeks?: PlanDay[][]; // Array of weekly schedules (e.g., 4 weeks)
  durationWeeks?: number;
  reasoning?: string[]; // Explicações do porquê este plano foi gerado
}

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string[]; // Array of paragraphs
  category: 'Filosofia' | 'Benefícios' | 'Inspiração' | 'Anatomia';
  readTime: string;
  imageUrl: string;
  author: string;
  isPremium?: boolean;
}

export type ViewState = 'AUTH' | 'ONBOARDING' | 'DASHBOARD' | 'PLAYER' | 'LIBRARY' | 'JOURNEY' | 'PLAN_EDITOR' | 'ROUTINE_EDITOR' | 'LEARNING';