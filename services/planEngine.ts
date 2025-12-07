import { Goal, TrainingPlan, PlanDay, UserPreferences, Discomfort, Difficulty } from '../types';

// Banco de Focos por Objetivo para criar variedade nas 4 semanas
const FOCUS_POOLS: Record<Goal, { active: string[], restoration: string[] }> = {
  'Flexibilidade': {
    active: [
      'Abertura de Quadril Profunda', 'Mobilidade de Ombros', 'Espacate (Hanumanasana)', 
      'Flexão para Frente', 'Torções Detox', 'Abertura de Peito', 
      'Mobilidade da Coluna', 'Flexibilidade de Isquiotibiais', 'Fluxo de Água', 'Saudação à Lua'
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
    restoration: ['Yoga Nidra', 'Restaurativa com Almofadas', 'Meditação em Movimento', 'Sono Profundo']
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

const generateVariedWeek = (
  weekIndex: number,
  goal: Goal, 
  discomforts: Discomfort[], 
  level: Difficulty,
  usedFocuses: Set<string>
): PlanDay[] => {
  const days: PlanDay[] = new Array(7).fill(null);
  const theme = WEEK_THEMES[weekIndex];
  
  // Definição de Intensidade baseada na semana e nível
  let intensity = '';
  if (level === 'Iniciante') intensity = weekIndex === 2 ? 'Moderada' : 'Suave';
  if (level === 'Intermediário') intensity = weekIndex === 2 ? 'Alta' : 'Moderada';
  if (level === 'Avançado') intensity = weekIndex === 3 ? 'Flow' : 'Intensa';

  // Configuração Padrão dos Dias (Pode variar baseada na logica)
  // 0: Dom (Descanso/Leve), 1: Seg (Ativo), 2: Ter (Ativo), 3: Qua (Descanso/Rec), 4: Qui (Ativo), 5: Sex (Ativo/Desafio), 6: Sab (Restaurativo)
  
  const pool = FOCUS_POOLS[goal];
  
  // Selecionar 4 focos ativos únicos para essa semana
  const activePicks = pickUnique(pool.active, usedFocuses, 4);
  activePicks.forEach(p => usedFocuses.add(p));
  
  // Selecionar 1 foco restaurativo
  const restPicks = pickUnique(pool.restoration, usedFocuses, 1);
  
  // Modificadores de Desconforto
  const avoidWrists = discomforts.includes('Punhos');
  const avoidKnees = discomforts.includes('Joelhos');

  // Preenchendo a semana
  days.forEach((_, i) => {
    // Domingo (0): Descanso ou Leve
    if (i === 0) {
      days[i] = {
        dayOfWeek: 0,
        activityType: 'Rest',
        focus: 'Intenção da Semana',
        description: `Defina sua intenção para a fase de ${theme}.`
      };
    }
    // Quarta (3): Descanso Ativo
    else if (i === 3) {
      days[i] = {
        dayOfWeek: 3,
        activityType: 'Rest',
        focus: 'Descanso Ativo',
        description: 'Caminhada leve ou alongamento livre.'
      };
    }
    // Sábado (6): Restaurativo
    else if (i === 6) {
      days[i] = {
        dayOfWeek: 6,
        activityType: 'Active',
        focus: restPicks[0],
        description: `Prática de ${intensity.toLowerCase()} para fechar a semana.`
      };
    }
    // Dias Ativos (1, 2, 4, 5)
    else {
      let pickIndex = 0; // Seg
      if (i === 2) pickIndex = 1; // Ter
      if (i === 4) pickIndex = 2; // Qui
      if (i === 5) pickIndex = 3; // Sex

      let focusName = activePicks[pickIndex];
      let desc = `Sessão focada em ${focusName.toLowerCase()}.`;

      // Adaptação de Desconforto no texto
      if (avoidWrists && (focusName.includes('Braço') || focusName.includes('Plank'))) {
        focusName += ' (Sem Punhos)';
        desc += ' Adaptado para evitar pressão nas mãos.';
      }
      if (avoidKnees && (focusName.includes('Guerreiro') || focusName.includes('Perna'))) {
        desc += ' Com variações gentis para os joelhos.';
      }

      days[i] = {
        dayOfWeek: i,
        activityType: 'Active',
        focus: focusName,
        description: desc
      };
    }
  });

  return days;
};

export const createPersonalizedPlan = (prefs: UserPreferences): TrainingPlan => {
  const { goal, level, discomforts, duration } = prefs;
  
  // Gerar descrição geral
  let description = `Plano de 4 semanas focado em ${goal} (${level}).`;
  if (discomforts.length > 0 && !discomforts.includes('Nenhum')) {
    description += ` Cuidado especial com: ${discomforts.join(', ')}.`;
  }
  
  const reasoning: string[] = [
    `Objetivo: ${goal} - Foco em progressão gradual.`,
    `Nível: ${level} - Ritmo ajustado para sua experiência.`,
    `Duração: ${duration} min - Consistência sobre intensidade.`
  ];

  if (discomforts.length > 0) reasoning.push('As posturas serão sugeridas evitando sobrecarga nas áreas indicadas.');

  // Gerar 4 semanas distintas
  const usedFocuses = new Set<string>();
  const weeks: PlanDay[][] = [];

  for (let i = 0; i < 4; i++) {
    weeks.push(generateVariedWeek(i, goal, discomforts, level, usedFocuses));
  }

  return {
    id: `plan-${goal.toLowerCase()}-${Date.now()}`,
    name: `Jornada ${goal} ${level}`,
    description,
    durationWeeks: 4,
    schedule: weeks[0], // Fallback schedule
    weeks: weeks,
    reasoning: reasoning
  };
};

export const getTodaysPlan = (plan: TrainingPlan): PlanDay => {
  const todayIndex = new Date().getDay();
  // Simples retorno do schedule base, a lógica de data real está no componente Journey
  return plan.schedule[todayIndex];
};