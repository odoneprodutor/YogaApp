
import { Goal, TrainingPlan, PlanDay, UserPreferences, Discomfort, Difficulty, SessionRecord } from '../types';

// Banco de Focos por Objetivo para criar variedade nas 4 semanas
const FOCUS_POOLS: Record<Goal, { active: string[], restoration: string[] }> = {
  'Flexibilidade': {
    active: [
      'Abertura de Quadril', 'Mobilidade de Ombros', 'Espacate (Hanumanasana)', 
      'Flexão para Frente', 'Torções Detox', 'Abertura de Peito', 
      'Mobilidade da Coluna', 'Isquiotibiais Profundos', 'Fluxo de Água', 'Saudação à Lua'
    ],
    restoration: ['Yin Yoga', 'Yoga para Fáscia', 'Soltura Articular', 'Alongamento Passivo']
  },
  'Força': {
    active: [
      'Core de Aço', 'Guerreiros Poderosos', 'Fortalecimento de Braços', 
      'Pernas e Glúteos', 'Equilíbrio e Foco', 'Power Vinyasa', 
      'Transições Fortes', 'Pranchas e Isometria', 'Resistência Total', 'Desafio de Inversão'
    ],
    restoration: ['Alongamento Ativo', 'Liberação Miofascial', 'Mobilidade Pós-Treino', 'Yoga para Atletas']
  },
  'Relaxamento': {
    active: [
      'Flow Suave (Gentle)', 'Respiração e Movimento', 'Saudação ao Sol Lenta', 
      'Yoga Anti-Stress', 'Conexão Mente-Corpo', 'Movimento Consciente', 
      'Equilíbrio Emocional', 'Yoga para Ansiedade', 'Grounding (Aterramento)', 'Fluxo de Gratidão'
    ],
    restoration: ['Yoga Nidra', 'Restaurativa (Props)', 'Meditação em Movimento', 'Sono Profundo']
  },
  'Alívio de Dor': {
    active: [
      'Saúde da Coluna', 'Postura Correta', 'Alívio de Pescoço', 
      'Quadril Sem Dor', 'Mobilidade de Tornozelos', 'Fortalecimento Lombar', 
      'Abertura de Ombros', 'Caminhada do Yoga', 'Alinhamento Pélvico', 'Yoga na Cadeira'
    ],
    restoration: ['Relaxamento Progressivo', 'Respiração Curativa', 'Alívio de Tensão', 'Suavidade Articular']
  }
};

const WEEK_THEMES = [
  'Fundação e Despertar',
  'Construção e Estabilidade',
  'Aprofundamento e Desafio',
  'Integração e Fluidez'
];

// Função auxiliar para selecionar itens sem repetição imediata
const pickUnique = (pool: string[], used: Set<string>, count: number): string[] => {
  const available = pool.filter(item => !used.has(item));
  // Se acabarem as opções, reseta (ou pega do pool total)
  const source = available.length >= count ? available : pool;
  
  // Shuffle simples
  const shuffled = [...source].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const getWeeklySchedulePattern = (frequency: number) => {
    // 0 = Dom, 1 = Seg, 2 = Ter, 3 = Qua, 4 = Qui, 5 = Sex, 6 = Sab
    // true = Active, false = Rest
    
    // Default safe fallback
    const safeFreq = Math.max(2, Math.min(7, frequency));
    
    switch (safeFreq) {
        case 2: return [false, true, false, false, true, false, false]; // Seg, Qui
        case 3: return [false, true, false, true, false, true, false]; // Seg, Qua, Sex
        case 4: return [false, true, true, false, true, true, false]; // Seg, Ter, Qui, Sex
        case 5: return [false, true, true, true, true, true, false]; // Seg a Sex
        case 6: return [false, true, true, true, true, true, true]; // Seg a Sab
        case 7: return [true, true, true, true, true, true, true]; // Todo dia
        default: return [false, true, false, true, false, true, false];
    }
};

const generateVariedWeek = (
  weekIndex: number,
  goal: Goal, 
  discomforts: Discomfort[], 
  level: Difficulty,
  frequency: number,
  usedFocuses: Set<string>
): PlanDay[] => {
  const days: PlanDay[] = new Array(7).fill(null);
  const theme = WEEK_THEMES[weekIndex];
  
  // Intensidade
  let intensity = '';
  if (level === 'Iniciante') intensity = weekIndex === 2 ? 'Moderada' : 'Suave';
  if (level === 'Intermediário') intensity = weekIndex === 2 ? 'Alta' : 'Moderada';
  if (level === 'Avançado') intensity = weekIndex === 3 ? 'Flow' : 'Intensa';

  const pool = FOCUS_POOLS[goal];
  const schedulePattern = getWeeklySchedulePattern(frequency);
  const activeDaysCount = schedulePattern.filter(Boolean).length;
  
  // Selecionar focos ativos suficientes para a semana
  const activePicks = pickUnique(pool.active, usedFocuses, activeDaysCount);
  activePicks.forEach(p => usedFocuses.add(p));

  // Modificadores de Desconforto
  const avoidWrists = discomforts.includes('Punhos');
  const avoidKnees = discomforts.includes('Joelhos');

  let activePickIndex = 0;

  // Preenchendo a semana
  days.forEach((_, i) => {
    const isActive = schedulePattern[i];
    
    if (isActive) {
        // Active Day
        let focusName = activePicks[activePickIndex % activePicks.length];
        activePickIndex++;

        let desc = `Sessão de ${intensity.toLowerCase()} focada em ${focusName.toLowerCase()}.`;

        if (avoidWrists && (focusName.includes('Braço') || focusName.includes('Plank'))) {
            focusName += ' (Adaptado)';
            desc += ' Foco reduzido nos punhos.';
        }
        if (avoidKnees && (focusName.includes('Guerreiro') || focusName.includes('Perna'))) {
            desc += ' Com suporte para os joelhos.';
        }

        days[i] = {
            dayOfWeek: i,
            activityType: 'Active',
            practiceName: focusName, // Nome da Prática
            focus: goal, // Foco é o Objetivo Geral (ex: Flexibilidade)
            description: desc
        };
    } else {
        // Rest Day
        let restFocus = "Descanso";
        let restDesc = "Dia livre para recuperação.";
        let restName = "Recuperação";

        // Special Sunday Logic (Day 0)
        if (i === 0) {
             restName = "Intenção da Semana";
             restFocus = "Mentalidade";
             restDesc = `Defina sua intenção para a fase de ${theme}.`;
        }
        // Special Wednesday Logic (Day 3) often active recovery if resting
        else if (i === 3) {
            restName = "Descanso Ativo";
            restFocus = "Movimento Leve";
            restDesc = "Caminhada leve ou alongamento livre.";
        }

        days[i] = {
            dayOfWeek: i,
            activityType: 'Rest',
            practiceName: restName,
            focus: restFocus,
            description: restDesc
        };
    }
  });

  return days;
};

export const createPersonalizedPlan = (prefs: UserPreferences): TrainingPlan => {
  const { goal, level, discomforts, duration, frequency } = prefs;
  
  // Gerar descrição geral
  let description = `Plano de 4 semanas focado em ${goal} (${level}).`;
  if (discomforts.length > 0 && !discomforts.includes('Nenhum')) {
    description += ` Cuidado especial com: ${discomforts.join(', ')}.`;
  }
  
  const reasoning: string[] = [
    `Objetivo: ${goal} - Foco em progressão gradual.`,
    `Frequência: ${frequency || 3} dias por semana para consistência.`,
    `Nível: ${level} - Ritmo ajustado para sua experiência.`,
  ];

  if (discomforts.length > 0) reasoning.push('As posturas serão sugeridas evitando sobrecarga nas áreas indicadas.');

  // Gerar 4 semanas distintas
  const usedFocuses = new Set<string>();
  const weeks: PlanDay[][] = [];

  // Default frequency to 3 if missing
  const freq = frequency || 3;

  for (let i = 0; i < 4; i++) {
    weeks.push(generateVariedWeek(i, goal, discomforts, level, freq, usedFocuses));
  }

  // Calculate total active sessions for progress tracking
  const totalActive = weeks.reduce((total, week) => {
      return total + week.filter(d => d.activityType === 'Active').length;
  }, 0);

  return {
    id: `plan-${goal.toLowerCase()}-${Date.now()}`,
    name: `Jornada ${goal} ${level}`,
    description,
    durationWeeks: 4,
    schedule: weeks[0], // Fallback schedule
    weeks: weeks,
    reasoning: reasoning,
    status: 'active',
    progress: 0,
    totalPlannedSessions: totalActive,
    completedSessions: 0
  };
};

export const getTodaysPlan = (plan: TrainingPlan): PlanDay => {
  const todayIndex = new Date().getDay();
  // Simples retorno do schedule base, a lógica de data real está no componente Journey
  return plan.schedule[todayIndex];
};

// --- EVOLUTION LOGIC ---

export const calculatePlanProgress = (plan: TrainingPlan, history: SessionRecord[]): TrainingPlan => {
    if (!plan.weeks) return plan;

    // Count sessions that belong to this plan
    // In this simplified version, we just count history entries that match this plan ID
    // If planID isn't in history (legacy), we might use date range, but let's stick to ID for new logic.
    const planSessions = history.filter(h => h.planId === plan.id);
    
    // Total planned active sessions
    let totalPlanned = 0;
    plan.weeks.forEach(week => {
        totalPlanned += week.filter(d => d.activityType === 'Active').length;
    });

    const completed = planSessions.length;
    // Cap at 100%
    const progress = Math.min(100, Math.round((completed / (totalPlanned || 1)) * 100));

    // Auto-complete if 95% done
    const status = progress >= 95 ? 'completed' : 'active';

    return {
        ...plan,
        progress,
        completedSessions: completed,
        totalPlannedSessions: totalPlanned,
        status: plan.status === 'archived' ? 'archived' : status
    };
};

export const createEvolutionPlan = (currentPlan: TrainingPlan, prefs: UserPreferences): TrainingPlan => {
    // Determine Next Level or Goal
    let newLevel = prefs.level;
    let newGoal = prefs.goal;
    let evolutionReason = "";

    if (prefs.level === 'Iniciante') {
        newLevel = 'Intermediário';
        evolutionReason = "Você dominou o básico! Agora vamos intensificar o fluxo.";
    } else if (prefs.level === 'Intermediário') {
        newLevel = 'Avançado';
        evolutionReason = "Hora de desafiar seus limites com posturas mais complexas.";
    } else {
        // Advanced user -> Switch focus to balance the body
        if (prefs.goal === 'Força') newGoal = 'Flexibilidade';
        else if (prefs.goal === 'Flexibilidade') newGoal = 'Força';
        else newGoal = 'Relaxamento';
        evolutionReason = `Como um praticante avançado, o segredo é o equilíbrio. Vamos focar em ${newGoal}.`;
    }

    const newPrefs = { ...prefs, level: newLevel, goal: newGoal };
    const nextPlan = createPersonalizedPlan(newPrefs);

    return {
        ...nextPlan,
        name: `Evolução: ${newGoal} ${newLevel}`,
        description: `Continuação da sua jornada anterior. ${evolutionReason}`,
        reasoning: [evolutionReason, ...nextPlan.reasoning!]
    };
};