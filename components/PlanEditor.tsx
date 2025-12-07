

import React, { useState } from 'react';
import { TrainingPlan, PlanDay } from '../types';
import { Button, Card } from './ui';
import { Save, X, Coffee, Zap, Edit3, CalendarRange } from 'lucide-react';

interface PlanEditorProps {
  initialPlan: TrainingPlan;
  onSave: (updatedPlan: TrainingPlan) => void;
  onCancel: () => void;
}

export const PlanEditor: React.FC<PlanEditorProps> = ({ initialPlan, onSave, onCancel }) => {
  const [planName, setPlanName] = useState(initialPlan.name);
  
  // Initialize full weeks structure. Ensure it exists.
  const initialWeeks = initialPlan.weeks || [initialPlan.schedule, initialPlan.schedule, initialPlan.schedule, initialPlan.schedule];
  const [allWeeks, setAllWeeks] = useState<PlanDay[][]>(initialWeeks);
  
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [activeDayIndex, setActiveDayIndex] = useState(1); // Start editing Monday (index 1) by default

  const weekDays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  // Helper to update a specific field of a specific day in the CURRENT week
  const handleDayUpdate = (index: number, field: keyof PlanDay, value: any) => {
    const updatedWeeks = [...allWeeks];
    const currentWeekSchedule = [...updatedWeeks[currentWeekIndex]];
    
    currentWeekSchedule[index] = { ...currentWeekSchedule[index], [field]: value };
    
    // Logic defaults
    if (field === 'activityType' && value === 'Rest') {
       currentWeekSchedule[index].focus = 'Descanso e Recuperação';
       currentWeekSchedule[index].description = 'Dia livre para recuperação física e mental.';
    }
    if (field === 'activityType' && value === 'Active' && !currentWeekSchedule[index].focus) {
        currentWeekSchedule[index].focus = 'Foco Personalizado';
        currentWeekSchedule[index].description = '';
    }

    updatedWeeks[currentWeekIndex] = currentWeekSchedule;
    setAllWeeks(updatedWeeks);
  };

  const currentDay = allWeeks[currentWeekIndex][activeDayIndex];

  const handleSave = () => {
      onSave({ 
          ...initialPlan, 
          name: planName, 
          weeks: allWeeks,
          schedule: allWeeks[0] // Ensure schedule is at least Week 1 for fallbacks
      });
  };

  return (
    <div className="pb-24 pt-8 px-4 max-w-4xl mx-auto animate-fade-in">
      {/* Header Actions */}
      <div className="flex justify-between items-center mb-8 sticky top-0 bg-zen-offwhite/95 backdrop-blur-sm z-10 py-4 border-b border-stone-100 -mx-4 px-4">
        <div>
          <h1 className="text-2xl font-light text-sage-900 flex items-center gap-2">
            <Edit3 size={24} className="text-sage-600"/> 
            Editar Plano
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
          <Button onClick={handleSave}>
            <Save size={18} /> Salvar
          </Button>
        </div>
      </div>

      {/* Plan Name Input */}
      <div className="mb-6 bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
        <label className="block text-xs font-bold text-stone-400 uppercase mb-2 tracking-wider">Nome da Jornada</label>
        <input 
          type="text" 
          value={planName}
          onChange={(e) => setPlanName(e.target.value)}
          className="w-full text-3xl font-light border-b-2 border-stone-100 focus:border-sage-500 bg-transparent py-2 focus:outline-none text-sage-900 transition-colors placeholder-stone-300"
          placeholder="Ex: Minha Jornada de Força"
        />
      </div>

      {/* Week Selector */}
      <div className="mb-6 overflow-x-auto pb-2">
         <div className="flex gap-2">
             {allWeeks.map((_, idx) => (
                 <button
                    key={idx}
                    onClick={() => setCurrentWeekIndex(idx)}
                    className={`
                        px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2
                        ${currentWeekIndex === idx 
                            ? 'bg-sage-600 text-white shadow-md' 
                            : 'bg-white text-stone-600 border border-stone-200 hover:border-sage-300'
                        }
                    `}
                 >
                     <CalendarRange size={16} /> Semana {idx + 1}
                 </button>
             ))}
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Sidebar: Day Selector */}
        <div className="md:col-span-4 flex flex-col gap-2">
           <h3 className="text-sm font-bold text-stone-500 uppercase mb-2 px-1">
               Semana {currentWeekIndex + 1}
           </h3>
           {weekDays.map((day, idx) => {
             const dayData = allWeeks[currentWeekIndex][idx];
             const isActive = activeDayIndex === idx;
             const isRest = dayData.activityType === 'Rest';

             return (
               <button
                 key={day}
                 onClick={() => setActiveDayIndex(idx)}
                 className={`p-3 rounded-xl text-left transition-all flex items-center justify-between border ${
                   isActive 
                    ? 'bg-sage-600 text-white border-sage-600 shadow-lg transform scale-[1.02]' 
                    : 'bg-white text-stone-600 border-stone-100 hover:border-sage-300 hover:bg-stone-50'
                 }`}
               >
                 <div>
                   <span className={`text-xs font-bold uppercase block ${isActive ? 'text-sage-200' : 'text-stone-400'}`}>{day.substring(0, 3)}</span>
                   <span className="font-medium text-lg">{day}</span>
                 </div>
                 <div className={`p-2 rounded-full ${isActive ? 'bg-white/20' : 'bg-stone-100'}`}>
                   {isRest ? 
                     <Coffee size={18} className={isActive ? 'text-white' : 'text-stone-400'}/> : 
                     <Zap size={18} className={isActive ? 'text-yellow-300' : 'text-sage-600'}/>
                   }
                 </div>
               </button>
             );
           })}
        </div>

        {/* Main Editor: Day Details */}
        <div className="md:col-span-8">
          <Card className="p-8 h-full min-h-[500px] flex flex-col">
            <div className="flex items-center justify-between mb-8 border-b border-stone-100 pb-6">
               <div>
                  <h3 className="text-2xl font-light text-sage-900">{weekDays[activeDayIndex]}</h3>
                  <p className="text-stone-500 text-sm">Semana {currentWeekIndex + 1}</p>
               </div>
               
               {/* Toggle Switch */}
               <div className="flex bg-stone-100 p-1 rounded-xl">
                 <button 
                   onClick={() => handleDayUpdate(activeDayIndex, 'activityType', 'Rest')}
                   className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                     currentDay.activityType === 'Rest' 
                       ? 'bg-white shadow-sm text-stone-800' 
                       : 'text-stone-500 hover:text-stone-700'
                   }`}
                 >
                   <Coffee size={16} /> Descanso
                 </button>
                 <button 
                   onClick={() => handleDayUpdate(activeDayIndex, 'activityType', 'Active')}
                   className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                     currentDay.activityType === 'Active' 
                       ? 'bg-white shadow-sm text-sage-700' 
                       : 'text-stone-500 hover:text-stone-700'
                   }`}
                 >
                   <Zap size={16} /> Prática
                 </button>
               </div>
            </div>

            {currentDay.activityType === 'Rest' ? (
              <div className="flex flex-col items-center justify-center flex-1 text-center animate-fade-in">
                 <div className="w-24 h-24 bg-stone-50 rounded-full flex items-center justify-center mb-6">
                   <Coffee size={48} className="text-stone-300" />
                 </div>
                 <h4 className="text-xl font-medium text-stone-700 mb-2">Dia de Recuperação</h4>
                 <p className="text-stone-500 max-w-sm mx-auto">
                   O descanso é uma parte crucial do progresso. Use este dia para meditação leve ou relaxamento total.
                 </p>
              </div>
            ) : (
              <div className="space-y-8 animate-fade-in flex-1">
                 <div>
                   <label className="block text-xs font-bold text-sage-600 uppercase mb-2 tracking-wider">Foco da Prática</label>
                   <input 
                     type="text" 
                     value={currentDay.focus || ''}
                     onChange={(e) => handleDayUpdate(activeDayIndex, 'focus', e.target.value)}
                     placeholder="Ex: Abertura de Quadril, Força Core..."
                     className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-sage-200 focus:outline-none text-lg text-sage-900 transition-shadow"
                   />
                   <p className="text-xs text-stone-400 mt-2">Este título aparecerá no seu calendário.</p>
                 </div>
                 
                 <div>
                   <label className="block text-xs font-bold text-sage-600 uppercase mb-2 tracking-wider">Descrição Detalhada / Notas</label>
                   <textarea 
                     value={currentDay.description || ''}
                     onChange={(e) => handleDayUpdate(activeDayIndex, 'description', e.target.value)}
                     placeholder="Ex: Prática focada em aliviar o stress do trabalho..."
                     className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-sage-200 focus:outline-none h-40 resize-none text-stone-600 transition-shadow"
                   />
                 </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};