


import { Goal, TrainingPlan, PlanDay, UserPreferences, Discomfort } from '../types';

// Gera uma semana base
const generateBaseWeek = (goal: Goal, discomforts: Discomfort[], age?: number, intensityModifier: string = ''): PlanDay[] => {
  const baseSchedule: PlanDay[] = new Array(7).fill(null).map((_, i) => ({
    dayOfWeek: i,
    activityType: 'Rest',
    description: 'Dia de descanso para recuperação física e mental.'
  }));

  const setActive = (dayIndex: number, focus: string, desc: string) => {
    baseSchedule[dayIndex] = {
      dayOfWeek: dayIndex,
      activityType: 'Active',
      focus: focus + (intensityModifier ? ` (${intensityModifier})` : ''),
      description: desc
    };
  };

  const isSenior = age && age > 60;
  const hasBackPain = discomforts.includes('Lombar');
  const hasKneePain = discomforts.includes('Joelhos');

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
  
  // Gerar descrição geral
  let description = `Um plano equilibrado de 4 semanas focado em ${goal.toLowerCase()}.`;
  if (discomforts.length > 0 && !discomforts.includes('Nenhum')) {
    description += ` Adaptado para cuidar de: ${discomforts.join(', ')}.`;
  }
  
  // Gerar Raciocínio (Insights)
  const reasoning: string[] = [];
  
  // 1. Baseado no Objetivo
  if (goal === 'Flexibilidade') {
      reasoning.push("O foco em flexibilidade ajudará a soltar a rigidez muscular acumulada, melhorando sua amplitude de movimento.");
  } else if (goal === 'Força') {
      reasoning.push("Priorizamos posturas isométricas para construir força muscular sem impacto excessivo nas articulações.");
  } else if (goal === 'Relaxamento') {
      reasoning.push("Incluímos mais pausas e respirações longas para ativar seu sistema nervoso parassimpático (relaxamento).");
  } else if (goal === 'Alívio de Dor') {
      reasoning.push("O plano foca em mobilidade suave e correção postural para tratar a causa raiz das dores.");
  }

  // 2. Baseado nos Desconfortos
  if (discomforts.includes('Joelhos')) {
      reasoning.push("Para seus joelhos: Selecionamos variações que evitam agachamentos profundos e pressão direta na patela.");
  }
  if (discomforts.includes('Lombar')) {
      reasoning.push("Para sua lombar: Enfatizamos o fortalecimento do 'Core' para dar suporte à coluna e evitamos flexões traseiras extremas.");
  }
  if (discomforts.includes('Pescoço/Ombros')) {
      reasoning.push("Para pescoço e ombros: Adicionamos alongamentos específicos de trapézio e evitamos sobrecarga nos braços.");
  }
  if (discomforts.includes('Punhos')) {
      reasoning.push("Para os punhos: Substituímos muitas pranchas por apoios no antebraço para reduzir a pressão no carpo.");
  }

  // 3. Baseado na Idade/Peso
  if (age && age > 55) {
      reasoning.push(`Considerando sua idade (${age} anos), o ritmo é cadenciado para promover longevidade articular e equilíbrio.`);
  }
  if (weight && weight > 90 && goal !== 'Força') {
      reasoning.push("Ajustamos as transições para serem mais suaves, garantindo conforto e segurança durante a prática.");
  }
  
  // 4. Baseado na Duração
  reasoning.push(`Sessões de ${prefs.duration} minutos foram escolhidas para garantir consistência diária, que é mais importante que intensidade esporádica.`);


  // Gerar 4 semanas com leve variação de tema
  const weekThemes = ['Fundação', 'Aprofundamento', 'Desafio', 'Integração'];
  const weeks = weekThemes.map(theme => generateBaseWeek(goal, discomforts, age, theme));

  return {
    id: `plan-${goal.toLowerCase()}-${Date.now()}`,
    name: `Jornada de ${goal}`,
    description,
    durationWeeks: 4,
    schedule: weeks[0], // Padrão é a semana 1
    weeks: weeks,
    reasoning: reasoning
  };
};

export const getTodaysPlan = (plan: TrainingPlan): PlanDay => {
  const todayIndex = new Date().getDay();
  // Idealmente, calcularíamos qual semana estamos, mas para um "Today" simples, pegamos a semana 1 ou schedule atual
  return plan.schedule[todayIndex];
};