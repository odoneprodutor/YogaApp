
import { Goal, TrainingPlan, PlanDay, UserPreferences, Discomfort } from '../types';

const generateSchedule = (goal: Goal, discomforts: Discomfort[], age?: number): PlanDay[] => {
  // Inicializa a semana inteira como Descanso
  const baseSchedule: PlanDay[] = new Array(7).fill(null).map((_, i) => ({
    dayOfWeek: i,
    activityType: 'Rest',
    description: 'Dia de descanso para recuperação física e mental.'
  }));

  // Função auxiliar para definir dias ativos
  const setActive = (dayIndex: number, focus: string, desc: string) => {
    baseSchedule[dayIndex] = {
      dayOfWeek: dayIndex,
      activityType: 'Active',
      focus,
      description: desc
    };
  };

  const isSenior = age && age > 60;
  const hasBackPain = discomforts.includes('Lombar');
  const hasKneePain = discomforts.includes('Joelhos');

  // Define a lógica baseada no objetivo
  switch (goal) {
    case 'Flexibilidade':
      setActive(1, hasBackPain ? 'Saúde da Coluna' : 'Abertura de Quadril', hasBackPain ? 'Foco em aliviar tensão lombar com segurança.' : 'Foco em soltar as tensões do quadril.');
      setActive(3, 'Alongamento de Coluna', 'Torções e flexões para mobilidade da coluna.');
      setActive(5, 'Corpo Inteiro', 'Fluxo contínuo para flexibilidade geral.');
      setActive(6, isSenior ? 'Mobilidade Suave' : 'Yin Yoga', isSenior ? 'Movimentos gentis para articulações.' : 'Posturas de longa duração para tecidos profundos.');
      break;
    
    case 'Força':
      setActive(1, 'Core e Estabilidade', 'Fortalecimento do centro do corpo com segurança.');
      setActive(3, hasKneePain ? 'Pernas sem Impacto' : 'Pernas e Guerreiros', hasKneePain ? 'Fortalecimento de pernas evitando pressão nos joelhos.' : 'Série de posturas em pé para resistência.');
      setActive(5, 'Braços e Inversões', 'Desafios de equilíbrio e força superior.');
      if (!isSenior) {
        setActive(0, 'Alongamento Ativo', 'Recuperação ativa para soltar a musculatura.');
      }
      break;

    case 'Relaxamento':
      setActive(1, 'Anti-Stress', 'Respiração e movimentos suaves para começar a semana.');
      setActive(2, 'Flow Suave', 'Movimento contínuo como meditação em movimento.');
      setActive(4, 'Restaurativa', 'Uso de apoios para relaxamento profundo.');
      setActive(6, 'Yoga Nidra', 'Relaxamento profundo guiado para o sistema nervoso.');
      break;

    case 'Alívio de Dor':
      setActive(1, 'Saúde das Costas', 'Alívio para dores lombares e posturais.');
      setActive(3, 'Pescoço e Ombros', 'Soltando a tensão acumulada na parte superior.');
      setActive(5, 'Mobilidade Articular', 'Movimentos gentis para lubrificar as articulações.');
      break;
  }

  return baseSchedule;
};

export const createPersonalizedPlan = (prefs: UserPreferences): TrainingPlan => {
  const { goal, age, weight, discomforts } = prefs;
  
  let description = `Um plano equilibrado de 4 semanas focado em ${goal.toLowerCase()}.`;
  
  if (discomforts.length > 0 && !discomforts.includes('Nenhum')) {
    description += ` Adaptado para cuidar de: ${discomforts.join(', ')}.`;
  }
  
  if (age && age > 55) {
    description += ` Com ritmo ajustado para vitalidade e longevidade.`;
  }

  return {
    id: `plan-${goal.toLowerCase()}-${Date.now()}`,
    name: `Jornada de ${goal}`,
    description,
    schedule: generateSchedule(goal, discomforts, age)
  };
};

export const getTodaysPlan = (plan: TrainingPlan): PlanDay => {
  const todayIndex = new Date().getDay();
  return plan.schedule[todayIndex];
};
