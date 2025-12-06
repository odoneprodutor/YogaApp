
import React, { useState, useMemo } from 'react';
import { UserPreferences, SessionRecord, TrainingPlan, PlanDay } from '../types';
import { createPersonalizedPlan } from '../services/planEngine';
import { Calendar } from './Calendar';
import { Card, Badge, Button } from './ui';
import { Calendar as CalendarIcon, Target, Trophy, Clock, Check, Edit3, Repeat, Coffee, Zap, X, Activity } from 'lucide-react';

interface JourneyProps {
  preferences: UserPreferences;
  history: SessionRecord[];
  customPlan: TrainingPlan | null; // Receive the custom plan
  onStartRoutine: () => void;
  onEditPlan: () => void; // Trigger for editing whole plan
  onUpdateDay: (dayIndex: number, day: PlanDay) => void; // Update specific day
}

export const Journey: React.FC<JourneyProps> = ({ preferences, history, customPlan, onStartRoutine, onEditPlan, onUpdateDay }) => {
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(new Date().toISOString().split('T')[0]);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);

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

  const getDayPlan = (dateStr: string) => {
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay(); // 0-6
    return plan.schedule[dayOfWeek];
  };

  const selectedDayPlan = selectedDateStr ? getDayPlan(selectedDateStr) : null;
  const isToday = selectedDateStr === new Date().toISOString().split('T')[0];

  const handleSwapPractice = (type: 'Active' | 'Rest', focus?: string) => {
     if (!selectedDateStr) return;
     
     const date = new Date(selectedDateStr);
     const dayIndex = date.getDay();
     
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

     onUpdateDay(dayIndex, newDay);
     setIsSwapModalOpen(false);
  };

  const swapOptions = [
    { label: 'Flexibilidade', icon: <Activity size={18}/>, desc: 'Focar em alongamento' },
    { label: 'Força', icon: <Zap size={18}/>, desc: 'Focar em tonificação' },
    { label: 'Relaxamento', icon: <Coffee size={18}/>, desc: 'Focar em desestressar' },
    { label: 'Alívio de Dor', icon: <Target size={18}/>, desc: 'Focar em recuperação' },
  ];

  return (
    <div className="pb-24 pt-8 px-4 max-w-5xl mx-auto animate-fade-in relative">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-light text-sage-900">Sua Jornada</h1>
          <p className="text-stone-500">Acompanhe seu progresso e siga seu plano.</p>
        </div>
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
                   <div key={session.id} className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center">
                      <div>
                        <p className="font-medium text-sage-900">{session.routineName}</p>
                        <p className="text-xs text-stone-500 mt-1 flex items-center gap-1">
                          <Check size={12} className="text-green-500"/> Completado
                        </p>
                      </div>
                      <Badge color="green">{session.duration} min</Badge>
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
                 <button 
                  onClick={onEditPlan}
                  className="text-stone-400 hover:text-sage-600 transition-colors bg-white/50 p-2 rounded-full hover:bg-white"
                  title="Editar Plano Completo"
                 >
                   <Edit3 size={16} />
                 </button>
               </div>
               
               <h3 className="text-2xl font-light text-sage-900 mb-1">{plan.name}</h3>
               <p className="text-sm text-stone-500 mb-6 line-clamp-2">{plan.description}</p>

               <div className="bg-sage-50 rounded-xl p-5 mb-6 relative">
                 <div className="flex justify-between items-start mb-2">
                    <p className="text-xs font-bold text-sage-400 uppercase tracking-wider">
                    {isToday ? 'Foco de Hoje' : 'Foco deste dia'}
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

               {isToday && selectedDayPlan?.activityType === 'Active' && (
                 <Button onClick={onStartRoutine} className="w-full justify-center">
                   Iniciar Prática de Hoje
                 </Button>
               )}
             </div>
          </div>

          {/* Weekly Mini Schedule */}
          <div className="space-y-3">
             <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-stone-400 uppercase tracking-wider ml-1">Semana Típica</h4>
             </div>
             {plan.schedule.map((day, idx) => {
               const dayNames = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
               const isRest = day.activityType === 'Rest';
               return (
                 <div key={idx} className="flex items-center gap-4 text-sm">
                    <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${isRest ? 'bg-stone-100 text-stone-400' : 'bg-sage-100 text-sage-700'}`}>
                      {dayNames[idx]}
                    </div>
                    <div className="flex-1 border-b border-stone-100 pb-2">
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
           <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-fade-in">
              <div className="p-4 border-b border-stone-100 flex justify-between items-center">
                 <h3 className="text-lg font-medium text-sage-900">Trocar Prática do Dia</h3>
                 <button onClick={() => setIsSwapModalOpen(false)} className="p-2 hover:bg-stone-100 rounded-full text-stone-500">
                    <X size={20} />
                 </button>
              </div>
              
              <div className="p-6">
                 <p className="text-stone-500 text-sm mb-4">Escolha o que você gostaria de fazer hoje em vez da programação original.</p>
                 
                 <div className="grid grid-cols-1 gap-3">
                    {/* Rest Option */}
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

                    {/* Active Options */}
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
    </div>
  );
};
