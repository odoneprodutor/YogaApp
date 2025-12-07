import React, { useState, useMemo, useEffect } from 'react';
import { UserPreferences, SessionRecord, TrainingPlan, PlanDay, Memory } from '../types';
import { createPersonalizedPlan } from '../services/planEngine';
import { Calendar } from './Calendar';
import { Card, Badge, Button } from './ui';
import { Calendar as CalendarIcon, Target, Trophy, Clock, Check, Edit3, Repeat, Coffee, Zap, X, Activity, Play, CheckCircle, Lightbulb, Info, Trash2, CalendarRange, List, Plus, Flame, Heart, Droplets, wind, Mountain } from 'lucide-react';

interface JourneyProps {
  preferences: UserPreferences;
  history: SessionRecord[];
  customPlan: TrainingPlan | null; // Currently active plan
  plans?: TrainingPlan[]; // All available plans (optional for backward compatibility)
  activePlanId?: string | null;
  onSwitchPlan?: (planId: string) => void;
  onCreateNewPlan?: () => void;
  onDeletePlan?: (planId: string) => void;
  onStartRoutine: () => void;
  onEditPlan: () => void; // Trigger for editing whole plan
  onUpdateDay: (weekIndex: number, dayIndex: number, day: PlanDay) => void; // Updated to support weekIndex
  onMarkComplete: (dateStr: string, planDay: PlanDay) => void;
  onStartCheckin: (type: 'WEEKLY_CHECKIN' | 'WEEKLY_REVIEW') => void; // Trigger for weekly stories
}

const STORAGE_KEY_MEMORIES = 'yogaflow_memories';

export const Journey: React.FC<JourneyProps> = ({ 
    preferences, 
    history, 
    customPlan, 
    plans = [], 
    activePlanId,
    onSwitchPlan,
    onCreateNewPlan,
    onDeletePlan,
    onStartRoutine, 
    onEditPlan, 
    onUpdateDay, 
    onMarkComplete, 
    onStartCheckin 
}) => {
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(new Date().toISOString().split('T')[0]);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [isManagePlansModalOpen, setIsManagePlansModalOpen] = useState(false);
  const [showInsights, setShowInsights] = useState(true);

  // Week Selector State
  const [activeWeekTab, setActiveWeekTab] = useState(0);

  // Memories/Gallery State (View Only now)
  const [memories, setMemories] = useState<Memory[]>([]);

  // Load Memories
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY_MEMORIES);
    if (saved) {
        try {
            setMemories(JSON.parse(saved));
        } catch (e) { console.error(e); }
    }
  }, []);

  const saveMemories = (entries: Memory[]) => {
      setMemories(entries);
      localStorage.setItem(STORAGE_KEY_MEMORIES, JSON.stringify(entries));
  };

  const handleDeleteMemory = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (confirm('Tem certeza que deseja apagar esta memória?')) {
          const filtered = memories.filter(m => m.id !== id);
          saveMemories(filtered);
      }
  };

  // Use custom plan if available, otherwise derive from goals
  const plan = useMemo(() => {
    return customPlan || createPersonalizedPlan(preferences);
  }, [preferences, customPlan]);
  
  // Calculate progress
  const totalSessions = history.length;
  const totalMinutes = history.reduce((acc, curr) => acc + curr.duration, 0);

  // Get selected day details
  const selectedDayHistory = selectedDateStr 
    ? history.filter(h => h.date === selectedDateStr)
    : [];

  const getWeekIndexForDate = (dateStr: string) => {
    if (!preferences.startDate || !plan.weeks) return 0;
    
    const start = new Date(preferences.startDate);
    start.setHours(0,0,0,0);
    const current = new Date(dateStr);
    current.setHours(0,0,0,0);
    const diffTime = current.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 0;
    return Math.floor(diffDays / 7) % plan.weeks.length;
  };

  const getDayPlan = (dateStr: string) => {
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay(); // 0-6
    const weekIndex = getWeekIndexForDate(dateStr);

    if (plan.weeks && plan.weeks.length > weekIndex) {
        return {
            ...plan.weeks[weekIndex][dayOfWeek],
            weekLabel: weekIndex + 1
        };
    }
    return plan.schedule[dayOfWeek];
  };

  const selectedDayPlan: (PlanDay & { weekLabel?: number }) | null = selectedDateStr ? getDayPlan(selectedDateStr) : null;
  const isToday = selectedDateStr === new Date().toISOString().split('T')[0];

  // Logic to determine Check-in or Review Availability
  const checkinStatus = useMemo(() => {
      if (!preferences.startDate) return 'CHECKIN'; // New users see it initially on Day 1 (today)
      
      const start = new Date(preferences.startDate);
      start.setHours(0,0,0,0);
      const today = new Date();
      today.setHours(0,0,0,0);
      
      const diffTime = today.getTime() - start.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      const dayOfCycle = diffDays % 7;
      
      // Day 0 = Start of week (Check-in)
      // Day 6 = End of week (Review)
      if (dayOfCycle === 0) return 'CHECKIN';
      if (dayOfCycle === 6) return 'REVIEW';
      return null;
  }, [preferences.startDate]);

  // Sync active week tab with selected date if user clicks calendar
  useEffect(() => {
      if (selectedDateStr) {
          const weekIdx = getWeekIndexForDate(selectedDateStr);
          setActiveWeekTab(weekIdx);
      }
  }, [selectedDateStr]);

  const handleSwapPractice = (type: 'Active' | 'Rest', focus?: string) => {
     if (!selectedDateStr) return;
     const date = new Date(selectedDateStr);
     const dayIndex = date.getDay();
     const weekIndex = getWeekIndexForDate(selectedDateStr);

     let newDay: PlanDay;

     if (type === 'Rest') {
        newDay = {
            dayOfWeek: dayIndex,
            activityType: 'Rest',
            focus: 'Descanso',
            description: 'Dia de recuperação escolhido por você.'
        };
     } else {
        newDay = {
            dayOfWeek: dayIndex,
            activityType: 'Active',
            focus: focus || 'Prática Livre',
            description: 'Sessão personalizada trocada manualmente.'
        };
     }
     
     // IMPORTANT: Pass weekIndex to ensure we update the specific week
     onUpdateDay(weekIndex, dayIndex, newDay);
     setIsSwapModalOpen(false);
  };
  
  const handleCreateNew = () => {
      if (onCreateNewPlan) {
          onCreateNewPlan();
          setIsManagePlansModalOpen(false);
      }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if(confirm("Tem certeza que deseja apagar este plano? O histórico de sessões será mantido.")) {
          if(onDeletePlan) onDeletePlan(id);
      }
  };

  // Expanded swap options as requested (5 new ones added)
  const swapOptions = [
    { label: 'Flexibilidade', icon: <Activity size={18}/>, desc: 'Focar em alongamento' },
    { label: 'Força', icon: <Zap size={18}/>, desc: 'Focar em tonificação' },
    { label: 'Relaxamento', icon: <Coffee size={18}/>, desc: 'Focar em desestressar' },
    { label: 'Alívio de Dor', icon: <Target size={18}/>, desc: 'Focar em recuperação' },
    // 5 New Options below
    { label: 'Core Blast', icon: <Flame size={18}/>, desc: 'Foco abdominal intenso' },
    { label: 'Cardio Yoga', icon: <Heart size={18}/>, desc: 'Fluxo rápido para suar' },
    { label: 'Detox Twist', icon: <Droplets size={18}/>, desc: 'Torções para digestão' },
    { label: 'Respiração Profunda', icon: <wind size={18}/>, desc: 'Pranayamas e calma' },
    { label: 'Equilíbrio & Foco', icon: <Mountain size={18}/>, desc: 'Posturas de pé e concentração' },
  ];

  return (
    <div className="pb-24 pt-8 px-4 max-w-5xl mx-auto animate-fade-in relative">
      <div className="mb-6">
        <h1 className="text-3xl font-light text-sage-900">Sua Jornada</h1>
        <p className="text-stone-500">Acompanhe seu progresso e siga seu plano.</p>
      </div>

      {/* --- STORIES & MEMORIES BAR --- */}
      <div className="flex gap-4 overflow-x-auto pb-6 mb-2 no-scrollbar items-start">
        
        {/* 1. Weekly Checkin / Review (Conditional) */}
        {checkinStatus && (
            <button 
                onClick={() => onStartCheckin(checkinStatus === 'CHECKIN' ? 'WEEKLY_CHECKIN' : 'WEEKLY_REVIEW')}
                className="group flex flex-col items-center gap-2 min-w-[72px] cursor-pointer"
            >
                <div className={`w-16 h-16 rounded-full p-[3px] bg-gradient-to-tr ${checkinStatus === 'CHECKIN' ? 'from-yellow-400 via-orange-500 to-red-500' : 'from-indigo-400 via-purple-500 to-pink-500'} group-hover:scale-105 transition-transform shadow-sm`}>
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden border-[3px] border-white text-xs text-center font-bold text-stone-600 leading-tight">
                        {checkinStatus === 'CHECKIN' ? 'Início Semana' : 'Review Final'}
                    </div>
                </div>
                <span className="text-[11px] font-medium text-stone-600 truncate max-w-full">
                    {checkinStatus === 'CHECKIN' ? 'Intenção' : 'Resultado'}
                </span>
            </button>
        )}

        {/* 2. Memories Gallery (Display Only) */}
        {memories.map(memory => (
            <div 
                key={memory.id}
                className="group flex flex-col items-center gap-2 min-w-[72px] cursor-pointer animate-fade-in relative"
            >
                <div className="w-16 h-16 rounded-full p-[2px] bg-stone-200 group-hover:scale-105 transition-transform shadow-sm overflow-hidden relative">
                    <img 
                        src={memory.mediaUrl} 
                        className="w-full h-full object-cover rounded-full border-2 border-white" 
                        alt="Memória" 
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=Error';
                        }}
                    />
                    {memory.type === 'video' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <Play size={16} className="text-white fill-current" />
                        </div>
                    )}
                </div>
                <span className="text-[11px] font-medium text-stone-600 truncate max-w-[80px] text-center px-1">
                    {new Date(memory.date).toLocaleDateString(undefined, {day: '2-digit', month: '2-digit'})}
                </span>
                
                {/* Delete Button (visible on hover) */}
                <button 
                    onClick={(e) => handleDeleteMemory(memory.id, e)}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity scale-75 shadow-md"
                >
                    <Trash2 size={12} />
                </button>
            </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Calendar & History */}
        <div className="lg:col-span-7 space-y-8">
          <Calendar 
            history={history}
            currentDate={currentCalendarDate}
            onMonthChange={setCurrentCalendarDate}
            onDateSelect={setSelectedDateStr}
            selectedDateStr={selectedDateStr}
          />

          {/* Details for Selected Date */}
          <div className="bg-stone-50 rounded-2xl p-6 border border-stone-100">
             <h4 className="font-medium text-stone-700 mb-4 flex items-center gap-2">
               <CalendarIcon size={18} />
               {selectedDateStr ? new Date(selectedDateStr).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long'}) : 'Selecione uma data'}
             </h4>

             {selectedDayHistory.length > 0 ? (
               <div className="space-y-3">
                 {selectedDayHistory.map(session => (
                   <div key={session.id} className="bg-white p-4 rounded-xl shadow-sm flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <div>
                            <p className="font-medium text-sage-900">{session.routineName}</p>
                            <p className="text-xs text-stone-500 mt-1 flex items-center gap-1">
                            <Check size={12} className="text-green-500"/> Completado
                            </p>
                        </div>
                        <Badge color="green">{session.duration} min</Badge>
                      </div>
                      
                      {/* Show feedback summary if available */}
                      {session.feedback && (
                         <div className="mt-2 pt-2 border-t border-stone-50 flex gap-2 overflow-x-auto no-scrollbar">
                            {session.feedback.responses.map((r, i) => (
                                <span key={i} className="text-[10px] bg-stone-100 px-2 py-1 rounded-md text-stone-600 whitespace-nowrap">
                                    {r.answer}
                                </span>
                            ))}
                         </div>
                      )}
                   </div>
                 ))}
               </div>
             ) : (
               <div className="text-center py-6 text-stone-400">
                 <p>Nenhuma prática registrada neste dia.</p>
               </div>
             )}
          </div>
        </div>

        {/* Right Column: The Plan & Stats */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-4">
             <Card className="p-4 flex flex-col items-center justify-center text-center py-6">
                <Trophy size={24} className="text-yellow-500 mb-2" />
                <span className="text-2xl font-bold text-sage-800">{totalSessions}</span>
                <span className="text-xs text-stone-500 uppercase tracking-wide">Sessões</span>
             </Card>
             <Card className="p-4 flex flex-col items-center justify-center text-center py-6">
                <Clock size={24} className="text-blue-400 mb-2" />
                <span className="text-2xl font-bold text-sage-800">{totalMinutes}</span>
                <span className="text-xs text-stone-500 uppercase tracking-wide">Minutos</span>
             </Card>
          </div>

          {/* The Plan Card */}
          <div className="bg-white rounded-3xl p-6 shadow-xl shadow-sage-100/50 border border-sage-100 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-sage-50 rounded-full translate-x-1/2 -translate-y-1/2" />
             
             <div className="relative z-10">
               <div className="flex items-center justify-between mb-4">
                 <Badge color="blue">Plano Atual</Badge>
                 <div className="flex gap-2">
                    {/* Switch Plan Button */}
                    <button
                        onClick={() => setIsManagePlansModalOpen(true)}
                        className="text-stone-400 hover:text-sage-600 transition-colors bg-white/50 p-2 rounded-full hover:bg-white"
                        title="Trocar Jornada"
                    >
                        <List size={16} />
                    </button>
                    {/* Edit Current Plan Button */}
                    <button 
                        onClick={onEditPlan}
                        className="text-stone-400 hover:text-sage-600 transition-colors bg-white/50 p-2 rounded-full hover:bg-white"
                        title="Editar Plano Completo"
                    >
                        <Edit3 size={16} />
                    </button>
                 </div>
               </div>
               
               <h3 className="text-2xl font-light text-sage-900 mb-1">{plan.name}</h3>
               <p className="text-sm text-stone-500 mb-6 line-clamp-2">{plan.description}</p>

               <div className="bg-sage-50 rounded-xl p-5 mb-6 relative">
                 <div className="flex justify-between items-start mb-2">
                    <p className="text-xs font-bold text-sage-400 uppercase tracking-wider flex items-center gap-2">
                        {isToday ? 'Foco de Hoje' : 'Foco deste dia'}
                        {selectedDayPlan?.weekLabel && <span className="text-sage-300 text-[10px] bg-white px-1.5 py-0.5 rounded-full border border-sage-100">Semana {selectedDayPlan.weekLabel}</span>}
                    </p>
                    {/* Swap Button */}
                    {selectedDateStr && (
                        <button 
                        onClick={() => setIsSwapModalOpen(true)}
                        className="text-sage-600 hover:text-sage-800 bg-white hover:bg-sage-100 p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium shadow-sm"
                        >
                        <Repeat size={14} /> Trocar
                        </button>
                    )}
                 </div>

                 {selectedDayPlan?.activityType === 'Rest' ? (
                   <div className="flex items-center gap-3 text-stone-500">
                     <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center">
                       <span className="text-lg">☕</span>
                     </div>
                     <div>
                       <p className="font-medium text-stone-700">Descanso</p>
                       <p className="text-xs">Recupere suas energias.</p>
                     </div>
                   </div>
                 ) : (
                   <div className="flex items-center gap-3 text-sage-800">
                     <div className="w-10 h-10 rounded-full bg-sage-200 flex items-center justify-center">
                       <Target size={20} className="text-sage-700"/>
                     </div>
                     <div>
                       <p className="font-medium">{selectedDayPlan?.focus}</p>
                       <p className="text-xs text-stone-500 line-clamp-1">{selectedDayPlan?.description}</p>
                     </div>
                   </div>
                 )}
               </div>

               {selectedDayPlan?.activityType === 'Active' && (
                  <div className="flex flex-col gap-3">
                     {isToday && (
                       <Button onClick={onStartRoutine} className="w-full justify-center">
                         <Play size={20} fill="currentColor" /> Iniciar Agora
                       </Button>
                     )}
                     <Button 
                        variant={isToday ? "outline" : "primary"}
                        onClick={() => {
                           if(selectedDateStr && selectedDayPlan) {
                              onMarkComplete(selectedDateStr, selectedDayPlan);
                           }
                        }}
                        className={`w-full justify-center ${!isToday ? 'mt-2' : ''}`}
                     >
                       <CheckCircle size={20} />
                       {isToday ? "Já fiz hoje" : "Marcar como Concluído"}
                     </Button>
                  </div>
               )}
             </div>
          </div>
          
          {/* Plan Insights / Reasoning Section */}
          {plan.reasoning && plan.reasoning.length > 0 && (
              <div className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm">
                  <button 
                     onClick={() => setShowInsights(!showInsights)}
                     className="flex items-center justify-between w-full text-left mb-2"
                  >
                     <div className="flex items-center gap-2 text-sage-800 font-medium">
                        <Lightbulb size={20} className="text-yellow-500" />
                        Entenda seu Plano
                     </div>
                  </button>
                  
                  {showInsights && (
                      <div className="animate-fade-in mt-3 space-y-3">
                          {plan.reasoning.map((reason, idx) => (
                              <div key={idx} className="flex gap-3 text-sm text-stone-600 bg-sage-50/50 p-3 rounded-lg">
                                  <Info size={16} className="text-sage-500 flex-shrink-0 mt-0.5" />
                                  <p>{reason}</p>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          )}

          {/* Weekly Schedule with Tabs */}
          <div className="space-y-3">
             <div className="flex justify-between items-center overflow-x-auto pb-2 no-scrollbar gap-2">
                {plan.weeks && plan.weeks.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setActiveWeekTab(idx)}
                        className={`
                            px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors
                            ${activeWeekTab === idx 
                                ? 'bg-sage-600 text-white' 
                                : 'bg-white border border-stone-200 text-stone-400 hover:text-stone-600'}
                        `}
                    >
                        Semana {idx + 1}
                    </button>
                ))}
                {!plan.weeks && (
                    <span className="text-sm font-bold text-stone-400 uppercase tracking-wider ml-1">Semana Atual</span>
                )}
             </div>
             
             {/* Render Weekly Items */}
             {(plan.weeks ? plan.weeks[activeWeekTab] : plan.schedule).map((day, idx) => {
               const dayNames = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
               const isRest = day.activityType === 'Rest';
               // Highlight selected day if it matches current viewed week view
               const isSelected = selectedDateStr && new Date(selectedDateStr).getDay() === idx && (selectedDayPlan?.weekLabel === (activeWeekTab + 1));

               return (
                 <div key={idx} className={`flex items-center gap-4 text-sm p-1 rounded-lg transition-colors ${isSelected ? 'bg-sage-50 border border-sage-100' : ''}`}>
                    <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${isRest ? 'bg-stone-100 text-stone-400' : 'bg-sage-100 text-sage-700'}`}>
                      {dayNames[idx]}
                    </div>
                    <div className="flex-1 border-b border-stone-100 pb-2 border-none">
                      <span className={isRest ? 'text-stone-400' : 'text-stone-700 font-medium'}>
                        {isRest ? 'Descanso' : day.focus}
                      </span>
                    </div>
                 </div>
               )
             })}
          </div>

        </div>
      </div>

      {/* Swap Practice Modal */}
      {isSwapModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-fade-in flex flex-col max-h-[80vh]">
              <div className="p-4 border-b border-stone-100 flex justify-between items-center">
                 <h3 className="text-lg font-medium text-sage-900">Trocar Prática do Dia</h3>
                 <button onClick={() => setIsSwapModalOpen(false)} className="p-2 hover:bg-stone-100 rounded-full text-stone-500">
                    <X size={20} />
                 </button>
              </div>
              
              <div className="p-6 overflow-y-auto">
                 <p className="text-stone-500 text-sm mb-4">Escolha o que você gostaria de fazer hoje em vez da programação original.</p>
                 
                 <div className="grid grid-cols-1 gap-3">
                    <button 
                       onClick={() => handleSwapPractice('Rest')}
                       className="flex items-center gap-4 p-4 rounded-xl border border-stone-200 hover:border-sage-400 hover:bg-stone-50 transition-all text-left group"
                    >
                       <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-stone-500 group-hover:bg-white group-hover:text-stone-700">
                          <Coffee size={20} />
                       </div>
                       <div>
                          <p className="font-medium text-stone-800">Tirar o Dia de Folga</p>
                          <p className="text-xs text-stone-400">Marcar como dia de descanso</p>
                       </div>
                    </button>

                    <div className="my-2 border-t border-stone-100"></div>

                    {swapOptions.map(opt => (
                       <button 
                         key={opt.label}
                         onClick={() => handleSwapPractice('Active', opt.label)}
                         className="flex items-center gap-4 p-3 rounded-xl hover:bg-sage-50 transition-all text-left group"
                       >
                          <div className="w-10 h-10 bg-sage-100 rounded-full flex items-center justify-center text-sage-600 group-hover:bg-sage-200">
                             {opt.icon}
                          </div>
                          <div>
                             <p className="font-medium text-sage-900">{opt.label}</p>
                             <p className="text-xs text-stone-500">{opt.desc}</p>
                          </div>
                       </button>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* MANAGE PLANS MODAL */}
      {isManagePlansModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-fade-in flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-stone-100 flex justify-between items-center">
                    <h3 className="text-lg font-medium text-sage-900">Minhas Jornadas</h3>
                    <button onClick={() => setIsManagePlansModalOpen(false)} className="p-2 hover:bg-stone-100 rounded-full text-stone-500">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-4 overflow-y-auto flex-1">
                    <p className="text-sm text-stone-500 mb-4">
                        Gerencie seus planos salvos. Você pode ter múltiplas jornadas com focos diferentes.
                    </p>

                    <div className="space-y-3">
                        {plans.map(p => {
                            const isActive = p.id === activePlanId;
                            return (
                                <div 
                                    key={p.id}
                                    onClick={() => onSwitchPlan && onSwitchPlan(p.id)}
                                    className={`
                                        relative p-4 rounded-xl border-2 transition-all cursor-pointer group
                                        ${isActive 
                                            ? 'border-sage-500 bg-sage-50 shadow-sm' 
                                            : 'border-stone-100 bg-white hover:border-sage-300'
                                        }
                                    `}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className={`font-medium ${isActive ? 'text-sage-900' : 'text-stone-700'}`}>
                                                {p.name}
                                            </h4>
                                            <p className="text-xs text-stone-500 mt-1 line-clamp-1">{p.description}</p>
                                        </div>
                                        {isActive && (
                                            <div className="bg-sage-200 text-sage-800 p-1 rounded-full">
                                                <Check size={14} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Delete button (only show if active plan count > 1 OR it's not the active one - allowing deletion of non-actives always) */}
                                    {/* Actually, user can delete the active one, logic in App handles setting new active. */}
                                    <button
                                        onClick={(e) => handleDelete(p.id, e)}
                                        className="absolute bottom-2 right-2 p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                        title="Excluir Plano"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="p-4 border-t border-stone-100 bg-stone-50 rounded-b-2xl">
                    <Button onClick={handleCreateNew} className="w-full justify-center">
                        <Plus size={18} /> Criar Nova Jornada
                    </Button>
                    <p className="text-[10px] text-stone-400 text-center mt-2">
                        Será criada com base nas suas preferências atuais do Dashboard.
                    </p>
                </div>
            </div>
          </div>
      )}
    </div>
  );
};