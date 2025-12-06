
import React, { useState, useEffect } from 'react';
import { UserPreferences, Routine, ViewState, Difficulty, Goal, Duration, SessionRecord, TrainingPlan, Discomfort, PlanDay } from './types';
import { generateRoutine } from './services/routineEngine';
import { createPersonalizedPlan } from './services/planEngine';
import { PoseLibrary } from './components/PoseLibrary';
import { RoutinePlayer } from './components/RoutinePlayer';
import { Journey } from './components/Journey';
import { PlanEditor } from './components/PlanEditor';
import { RoutineEditor } from './components/RoutineEditor';
import { Button, Card, Badge } from './components/ui';
import { 
  LayoutDashboard, 
  Library, 
  Map, 
  Play, 
  Clock, 
  Zap, 
  Activity,
  Smile,
  Edit2,
  User,
  AlertCircle,
  ArrowRight,
  Check
} from 'lucide-react';

const App: React.FC = () => {
  // State
  const [view, setView] = useState<ViewState>('ONBOARDING');
  const [preferences, setPreferences] = useState<UserPreferences>({
    level: 'Iniciante',
    goal: 'Relaxamento',
    duration: 15,
    age: 30,
    weight: undefined,
    discomforts: [],
    hasOnboarded: false
  });
  
  // Custom Plan State (overrides default engine if set)
  const [customPlan, setCustomPlan] = useState<TrainingPlan | null>(null);

  // Initialize with some fake history for demonstration if empty
  const [history, setHistory] = useState<SessionRecord[]>(() => {
    // Generate some past data for the calendar demo
    const past = [];
    const today = new Date();
    for (let i = 1; i < 5; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - (i * 2));
      past.push({
        id: `past-${i}`,
        date: d.toISOString().split('T')[0],
        routineName: i % 2 === 0 ? 'Fluxo de Relaxamento' : 'Fluxo de Flexibilidade',
        duration: 15
      });
    }
    return past;
  });

  const [currentRoutine, setCurrentRoutine] = useState<Routine | null>(null);
  
  // Onboarding Step State
  const [onboardingStep, setOnboardingStep] = useState(0);

  const handleOnboardingComplete = () => {
    // Generate the personalized plan immediately upon finishing onboarding
    const generatedPlan = createPersonalizedPlan(preferences);
    setCustomPlan(generatedPlan);
    
    setPreferences(prev => ({ ...prev, hasOnboarded: true, startDate: new Date().toISOString() }));
    setView('DASHBOARD');
  };

  const handleGenerate = () => {
    const routine = generateRoutine(preferences);
    setCurrentRoutine(routine);
    // Instead of going straight to PLAYER, go to ROUTINE_EDITOR
    setView('ROUTINE_EDITOR');
  };

  const handleRoutineComplete = () => {
    if (currentRoutine) {
      const newRecord: SessionRecord = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        routineName: currentRoutine.name,
        duration: Math.round(currentRoutine.totalDuration / 60)
      };
      setHistory(prev => [newRecord, ...prev]);
    }
    setView('JOURNEY'); // Redirect to Journey (Calendar) after completion
  };

  // Function to update a specific day in the plan (swapping practice)
  const handleUpdateDay = (dayIndex: number, newDayData: PlanDay) => {
    // Ensure we have a mutable plan object based on current prefs if one doesn't exist specifically
    const activePlan = customPlan || createPersonalizedPlan(preferences);
    
    const newSchedule = [...activePlan.schedule];
    newSchedule[dayIndex] = newDayData;
    
    setCustomPlan({
      ...activePlan,
      schedule: newSchedule
    });
  };

  // --- Views ---

  const renderOnboarding = () => {
    // Steps definition
    // 0: Intro/Bio (Age, Weight)
    // 1: Discomforts
    // 2: Experience Level
    // 3: Goal
    // 4: Duration

    const nextStep = () => setOnboardingStep(prev => prev + 1);
    const prevStep = () => setOnboardingStep(prev => Math.max(0, prev - 1));

    const progress = ((onboardingStep + 1) / 5) * 100;

    return (
      <div className="min-h-screen bg-sage-50 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl p-8 animate-fade-in relative overflow-hidden">
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-sage-100">
            <div className="h-full bg-sage-600 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>

          <div className="mt-4">
            {/* Step 0: Bio Data */}
            {onboardingStep === 0 && (
              <div className="animate-fade-in">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-sage-100 rounded-full flex items-center justify-center">
                    <User size={32} className="text-sage-600" />
                  </div>
                </div>
                <h2 className="text-2xl font-medium text-center text-sage-900 mb-2">Sobre Você</h2>
                <p className="text-center text-stone-500 mb-8">Para personalizarmos sua jornada, precisamos conhecer um pouco sobre seu corpo.</p>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">Sua Idade</label>
                    <input 
                      type="number" 
                      value={preferences.age || ''}
                      onChange={(e) => setPreferences(prev => ({...prev, age: parseInt(e.target.value) || undefined}))}
                      className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-sage-400 focus:outline-none text-lg"
                      placeholder="Ex: 30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">Peso (kg) <span className="text-stone-400 font-normal">(Opcional)</span></label>
                    <input 
                      type="number" 
                      value={preferences.weight || ''}
                      onChange={(e) => setPreferences(prev => ({...prev, weight: parseInt(e.target.value) || undefined}))}
                      className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-sage-400 focus:outline-none text-lg"
                      placeholder="Ex: 70"
                    />
                  </div>
                </div>

                <Button onClick={nextStep} disabled={!preferences.age} className="w-full mt-8">
                  Continuar <ArrowRight size={18} />
                </Button>
              </div>
            )}

            {/* Step 1: Discomforts */}
            {onboardingStep === 1 && (
              <div className="animate-fade-in">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                    <AlertCircle size={32} className="text-orange-500" />
                  </div>
                </div>
                <h2 className="text-2xl font-medium text-center text-sage-900 mb-2">Áreas de Atenção</h2>
                <p className="text-center text-stone-500 mb-8">Você sente desconforto em alguma dessas áreas? Vamos adaptar as posturas para você.</p>
                
                <div className="grid grid-cols-2 gap-3">
                  {(['Lombar', 'Joelhos', 'Pescoço/Ombros', 'Punhos', 'Nenhum'] as Discomfort[]).map((option) => {
                     const isSelected = preferences.discomforts.includes(option);
                     const isNone = option === 'Nenhum';
                     
                     return (
                      <button
                        key={option}
                        onClick={() => {
                          if (isNone) {
                            setPreferences(prev => ({ ...prev, discomforts: ['Nenhum'] }));
                          } else {
                            setPreferences(prev => {
                              const newDiscomforts = prev.discomforts.filter(d => d !== 'Nenhum');
                              if (newDiscomforts.includes(option)) {
                                return { ...prev, discomforts: newDiscomforts.filter(d => d !== option) };
                              } else {
                                return { ...prev, discomforts: [...newDiscomforts, option] };
                              }
                            });
                          }
                        }}
                        className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 text-sm font-medium h-24
                          ${isSelected 
                            ? 'border-sage-500 bg-sage-50 text-sage-800' 
                            : 'border-stone-100 bg-white text-stone-600 hover:border-sage-200'
                          }
                        `}
                      >
                        {isSelected && <Check size={16} className="text-sage-600" />}
                        {option}
                      </button>
                     );
                  })}
                </div>

                <div className="flex gap-3 mt-8">
                  <Button variant="ghost" onClick={prevStep}>Voltar</Button>
                  <Button onClick={nextStep} className="flex-1">
                    Continuar <ArrowRight size={18} />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Level */}
            {onboardingStep === 2 && (
              <div className="animate-fade-in">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <Activity size={32} className="text-blue-500" />
                  </div>
                </div>
                <h2 className="text-2xl font-medium text-center text-sage-900 mb-2">Nível de Experiência</h2>
                <p className="text-center text-stone-500 mb-8">Como você descreveria sua prática atual?</p>
                
                <div className="space-y-3">
                  {(['Iniciante', 'Intermediário', 'Avançado'] as Difficulty[]).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setPreferences(prev => ({ ...prev, level: opt }));
                        nextStep();
                      }}
                      className="w-full p-4 bg-white rounded-xl shadow-sm border border-stone-200 hover:border-sage-400 hover:shadow-md transition-all text-left flex justify-between items-center group"
                    >
                      <span className="text-lg text-stone-700 font-medium group-hover:text-sage-700">{opt}</span>
                      <div className={`w-6 h-6 rounded-full border-2 ${preferences.level === opt ? 'bg-sage-600 border-sage-600' : 'border-stone-200'} group-hover:border-sage-500`} />
                    </button>
                  ))}
                </div>
                <div className="mt-6">
                  <Button variant="ghost" onClick={prevStep} className="w-full">Voltar</Button>
                </div>
              </div>
            )}

            {/* Step 3: Goal */}
            {onboardingStep === 3 && (
              <div className="animate-fade-in">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Zap size={32} className="text-yellow-600" />
                  </div>
                </div>
                <h2 className="text-2xl font-medium text-center text-sage-900 mb-2">Objetivo Principal</h2>
                <p className="text-center text-stone-500 mb-8">O que você busca alcançar com o YogaFlow?</p>
                
                <div className="space-y-3">
                  {(['Flexibilidade', 'Força', 'Relaxamento', 'Alívio de Dor'] as Goal[]).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setPreferences(prev => ({ ...prev, goal: opt }));
                        nextStep();
                      }}
                      className="w-full p-4 bg-white rounded-xl shadow-sm border border-stone-200 hover:border-sage-400 hover:shadow-md transition-all text-left flex justify-between items-center group"
                    >
                      <span className="text-lg text-stone-700 font-medium group-hover:text-sage-700">{opt}</span>
                      <div className={`w-6 h-6 rounded-full border-2 ${preferences.goal === opt ? 'bg-sage-600 border-sage-600' : 'border-stone-200'} group-hover:border-sage-500`} />
                    </button>
                  ))}
                </div>
                <div className="mt-6">
                  <Button variant="ghost" onClick={prevStep} className="w-full">Voltar</Button>
                </div>
              </div>
            )}

            {/* Step 4: Duration */}
            {onboardingStep === 4 && (
              <div className="animate-fade-in">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                    <Clock size={32} className="text-purple-500" />
                  </div>
                </div>
                <h2 className="text-2xl font-medium text-center text-sage-900 mb-2">Tempo Disponível</h2>
                <p className="text-center text-stone-500 mb-8">Quanto tempo você gostaria de dedicar por sessão?</p>
                
                <div className="space-y-3">
                  {([15, 30, 45] as Duration[]).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setPreferences(prev => ({ ...prev, duration: opt }));
                        // We need a slight delay or just handle completion here
                        const newPrefs = { ...preferences, duration: opt };
                        setPreferences(newPrefs);
                        // Trigger completion
                        // We'll call handleOnboardingComplete but we need to ensure state is updated.
                        // For safety, we can just button click.
                      }}
                      className={`w-full p-4 bg-white rounded-xl shadow-sm border transition-all text-left flex justify-between items-center group
                        ${preferences.duration === opt ? 'border-sage-500 ring-1 ring-sage-500' : 'border-stone-200 hover:border-sage-400'}
                      `}
                    >
                      <span className="text-lg text-stone-700 font-medium group-hover:text-sage-700">{opt} minutos</span>
                      <div className={`w-6 h-6 rounded-full border-2 ${preferences.duration === opt ? 'bg-sage-600 border-sage-600' : 'border-stone-200'} group-hover:border-sage-500`} />
                    </button>
                  ))}
                </div>

                <div className="flex gap-3 mt-8">
                  <Button variant="ghost" onClick={prevStep}>Voltar</Button>
                  <Button onClick={handleOnboardingComplete} className="flex-1">
                    Criar Meu Plano
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderDashboard = () => {
    return (
      <div className="pb-24 pt-8 px-6 max-w-4xl mx-auto animate-fade-in">
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-light text-sage-900 mb-2">Olá, Yogi</h1>
            <p className="text-stone-500">Pronto para encontrar seu centro hoje?</p>
          </div>
          <div className="hidden md:block">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-stone-100">
              <Smile size={20} className="text-orange-400" />
              <span className="text-sm font-medium text-stone-600">{history.length} Sessões Completadas</span>
            </div>
          </div>
        </header>

        {/* Hero Card: Routine of the Day */}
        <section className="mb-10">
          <div className="bg-gradient-to-br from-sage-600 to-sage-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
            {/* Abstract blobs */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4 text-sage-200">
                 <Zap size={18} />
                 <span className="text-sm font-medium tracking-wide uppercase">Recomendado para você</span>
              </div>
              <h2 className="text-3xl font-semibold mb-2">Fluxo de {preferences.goal}</h2>
              <p className="text-sage-100 mb-8 max-w-md">
                Uma sequência de {preferences.duration} minutos adaptada para {preferences.age} anos
                {preferences.discomforts.length > 0 && !preferences.discomforts.includes('Nenhum') 
                 ? ` com cuidado para ${preferences.discomforts.join(', ')}.` 
                 : '.'}
              </p>
              
              <div className="flex gap-4">
                <Button onClick={handleGenerate} className="bg-white text-sage-800 hover:bg-sage-50 shadow-none border-0">
                  <Play size={20} fill="currentColor" />
                  Iniciar Prática
                </Button>
                {/* Direct Customizer button also available in Dashboard now */}
                <Button variant="outline" onClick={handleGenerate} className="border-white/30 text-white hover:bg-white/10">
                  <Edit2 size={20} />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Settings */}
        <section className="mb-8">
           <h3 className="text-lg font-medium text-stone-700 mb-4">Ajustar Preferências</h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4 flex items-center justify-between cursor-pointer hover:border-sage-300 transition-colors" onClick={() => { setView('ONBOARDING'); setOnboardingStep(3); }}>
                 <div>
                    <p className="text-xs text-stone-400 uppercase font-bold">Objetivo</p>
                    <p className="text-sage-800 font-medium">{preferences.goal}</p>
                 </div>
                 <Zap size={20} className="text-stone-300" />
              </Card>
              <Card className="p-4 flex items-center justify-between cursor-pointer hover:border-sage-300 transition-colors" onClick={() => { setView('ONBOARDING'); setOnboardingStep(4); }}>
                 <div>
                    <p className="text-xs text-stone-400 uppercase font-bold">Duração</p>
                    <p className="text-sage-800 font-medium">{preferences.duration} Min</p>
                 </div>
                 <Clock size={20} className="text-stone-300" />
              </Card>
              <Card className="p-4 flex items-center justify-between cursor-pointer hover:border-sage-300 transition-colors" onClick={() => { setView('ONBOARDING'); setOnboardingStep(1); }}>
                 <div>
                    <p className="text-xs text-stone-400 uppercase font-bold">Foco Corporal</p>
                    <p className="text-sage-800 font-medium">
                       {preferences.discomforts.includes('Nenhum') || preferences.discomforts.length === 0 ? 'Geral' : 'Adaptado'}
                    </p>
                 </div>
                 <Activity size={20} className="text-stone-300" />
              </Card>
           </div>
        </section>
      </div>
    );
  };

  // --- Main Render Logic ---
  
  if (view === 'PLAYER' && currentRoutine) {
    return (
      <RoutinePlayer 
        routine={currentRoutine} 
        onExit={() => setView('DASHBOARD')}
        onComplete={handleRoutineComplete}
      />
    );
  }

  if (view === 'ROUTINE_EDITOR' && currentRoutine) {
    return (
      <RoutineEditor
        routine={currentRoutine}
        onCancel={() => setView('DASHBOARD')}
        onSaveAndPlay={(updatedRoutine) => {
          setCurrentRoutine(updatedRoutine);
          setView('PLAYER');
        }}
      />
    );
  }

  if (view === 'PLAN_EDITOR') {
    return (
      <PlanEditor
        initialPlan={customPlan || createPersonalizedPlan(preferences)}
        onCancel={() => setView('JOURNEY')}
        onSave={(updatedPlan) => {
          setCustomPlan(updatedPlan);
          setView('JOURNEY');
        }}
      />
    );
  }

  if (view === 'ONBOARDING' && !preferences.hasOnboarded) {
    return renderOnboarding();
  }

  // Allow re-entering onboarding to edit settings
  if (view === 'ONBOARDING') {
      return renderOnboarding();
  }

  return (
    <div className="min-h-screen bg-zen-offwhite text-stone-800 font-sans">
      {/* Dynamic Content */}
      <main className="min-h-screen">
        {view === 'DASHBOARD' && renderDashboard()}
        {view === 'LIBRARY' && <PoseLibrary />}
        {view === 'JOURNEY' && (
           <Journey 
             preferences={preferences} 
             history={history}
             customPlan={customPlan}
             onStartRoutine={handleGenerate} 
             onEditPlan={() => setView('PLAN_EDITOR')}
             onUpdateDay={handleUpdateDay}
           />
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 px-6 py-4 flex justify-between items-center z-40 md:justify-center md:gap-16">
        <button 
          onClick={() => setView('DASHBOARD')}
          className={`flex flex-col items-center gap-1 ${view === 'DASHBOARD' ? 'text-sage-600' : 'text-stone-400 hover:text-stone-600'}`}
        >
          <LayoutDashboard size={24} />
          <span className="text-[10px] font-medium tracking-wide">Hoje</span>
        </button>
        
        <button 
           onClick={handleGenerate}
           className="bg-sage-600 text-white p-4 rounded-full -mt-10 shadow-lg shadow-sage-200 border-4 border-zen-offwhite hover:scale-105 transition-transform"
        >
          <Play size={28} fill="currentColor" className="ml-1"/>
        </button>

        <button 
          onClick={() => setView('JOURNEY')}
          className={`flex flex-col items-center gap-1 ${view === 'JOURNEY' ? 'text-sage-600' : 'text-stone-400 hover:text-stone-600'}`}
        >
          <Map size={24} />
          <span className="text-[10px] font-medium tracking-wide">Jornada</span>
        </button>

        <button 
          onClick={() => setView('LIBRARY')}
          className={`flex flex-col items-center gap-1 ${view === 'LIBRARY' ? 'text-sage-600' : 'text-stone-400 hover:text-stone-600'}`}
        >
          <Library size={24} />
          <span className="text-[10px] font-medium tracking-wide">Biblioteca</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
