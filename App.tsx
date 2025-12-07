



import React, { useState, useEffect } from 'react';
import { UserPreferences, Routine, ViewState, Difficulty, Goal, Duration, SessionRecord, TrainingPlan, Discomfort, PlanDay, User, FeedbackRecord, StoryType } from './types';
import { generateRoutine } from './services/routineEngine';
import { createPersonalizedPlan } from './services/planEngine';
import { authService } from './services/auth';
import { PoseLibrary } from './components/PoseLibrary';
import { RoutinePlayer } from './components/RoutinePlayer';
import { Journey } from './components/Journey';
import { PlanEditor } from './components/PlanEditor';
import { RoutineEditor } from './components/RoutineEditor';
import { AuthScreen } from './components/AuthScreen';
import { LearningHub } from './components/LearningHub';
import { StoriesOverlay } from './components/StoriesOverlay';
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
  User as UserIcon,
  AlertCircle,
  ArrowRight,
  Check,
  LogOut,
  BookOpen,
  X,
  Save,
  Star
} from 'lucide-react';

// Storage keys helper
const getPrefsKey = (userId: string) => `yogaflow_prefs_${userId}`;
const getPlanKey = (userId: string) => `yogaflow_plan_${userId}`;
const getHistoryKey = (userId: string) => `yogaflow_history_${userId}`;
const getWeeklyContextKey = (userId: string) => `yogaflow_weekly_ctx_${userId}`;

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // App State
  const [view, setView] = useState<ViewState>('AUTH'); // Start at Auth check
  const [preferences, setPreferences] = useState<UserPreferences>({
    level: 'Iniciante',
    goal: 'Relaxamento',
    duration: 15,
    age: 30,
    weight: undefined,
    discomforts: [],
    hasOnboarded: false
  });
  
  const [customPlan, setCustomPlan] = useState<TrainingPlan | null>(null);
  const [history, setHistory] = useState<SessionRecord[]>([]);
  const [currentRoutine, setCurrentRoutine] = useState<Routine | null>(null);
  const [onboardingStep, setOnboardingStep] = useState(0);
  
  // Dashboard Prefs Editor State
  const [editingPrefs, setEditingPrefs] = useState<UserPreferences | null>(null);

  // Stories State
  const [storyType, setStoryType] = useState<StoryType>('POST_PRACTICE');
  const [weeklyContext, setWeeklyContext] = useState<FeedbackRecord | null>(null);
  const [weeklyReport, setWeeklyReport] = useState<{intention: string, result: string, insight: string} | null>(null);

  // --- Auth & Data Loading Effects ---

  // 1. Check Session on Mount
  useEffect(() => {
    const checkAuth = async () => {
      const savedUser = authService.getCurrentUser();
      if (savedUser) {
        handleUserAuthenticated(savedUser);
      } else {
        setView('AUTH');
        setIsAuthChecking(false);
      }
    };
    checkAuth();
  }, []);

  // 2. Load Data when User Changes
  const handleUserAuthenticated = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    
    // Load User Data from LocalStorage
    const prefsStr = localStorage.getItem(getPrefsKey(authenticatedUser.id));
    const planStr = localStorage.getItem(getPlanKey(authenticatedUser.id));
    const historyStr = localStorage.getItem(getHistoryKey(authenticatedUser.id));
    const weeklyCtxStr = localStorage.getItem(getWeeklyContextKey(authenticatedUser.id));

    if (prefsStr) {
      const loadedPrefs = JSON.parse(prefsStr);
      setPreferences(loadedPrefs);
      
      if (loadedPrefs.hasOnboarded) {
        setView('DASHBOARD');
      } else {
        setView('ONBOARDING');
      }
    } else {
      // New user data
      setPreferences({ ...preferences, userId: authenticatedUser.id, hasOnboarded: false });
      setView('ONBOARDING');
    }

    if (planStr) setCustomPlan(JSON.parse(planStr));
    
    if (historyStr) {
      setHistory(JSON.parse(historyStr));
    } else {
      // Demo history for new users just to show UI (optional, remove for prod)
      setHistory([]);
    }

    if (weeklyCtxStr) {
        setWeeklyContext(JSON.parse(weeklyCtxStr));
    }

    setIsAuthChecking(false);
  };

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
    setPreferences({
      level: 'Iniciante',
      goal: 'Relaxamento',
      duration: 15,
      discomforts: [],
      hasOnboarded: false
    });
    setHistory([]);
    setCustomPlan(null);
    setView('AUTH');
  };

  // --- Persistence Helpers ---

  const savePreferences = (newPrefs: UserPreferences) => {
    setPreferences(newPrefs);
    if (user) {
      localStorage.setItem(getPrefsKey(user.id), JSON.stringify(newPrefs));
    }
  };

  const saveCustomPlan = (newPlan: TrainingPlan) => {
    setCustomPlan(newPlan);
    if (user) {
      localStorage.setItem(getPlanKey(user.id), JSON.stringify(newPlan));
    }
  };

  const saveHistory = (newHistory: SessionRecord[]) => {
    setHistory(newHistory);
    if (user) {
      localStorage.setItem(getHistoryKey(user.id), JSON.stringify(newHistory));
    }
  };
  
  const saveWeeklyContext = (context: FeedbackRecord | null) => {
      setWeeklyContext(context);
      if (user) {
          if (context) localStorage.setItem(getWeeklyContextKey(user.id), JSON.stringify(context));
          else localStorage.removeItem(getWeeklyContextKey(user.id));
      }
  };

  // --- Handlers ---

  const handleOnboardingComplete = () => {
    const generatedPlan = createPersonalizedPlan(preferences);
    saveCustomPlan(generatedPlan);
    
    const finalPrefs = { 
      ...preferences, 
      hasOnboarded: true, 
      startDate: new Date().toISOString() 
    };
    savePreferences(finalPrefs);
    setView('DASHBOARD');
  };
  
  // Handler for Quick Edit Modal on Dashboard
  const handleOpenPrefsEditor = () => {
      setEditingPrefs({ ...preferences });
  };
  
  const handleSavePrefsEditor = () => {
      if (!editingPrefs) return;
      
      savePreferences(editingPrefs);
      
      // Regenerate plan to reflect new preferences
      const newPlan = createPersonalizedPlan(editingPrefs);
      saveCustomPlan(newPlan);
      
      setEditingPrefs(null);
  };

  const handleGenerate = () => {
    const routine = generateRoutine(preferences);
    setCurrentRoutine(routine);
    setView('ROUTINE_EDITOR');
  };

  const handleRoutineComplete = () => {
    // Instead of finishing immediately, we trigger the Post Practice Story
    setStoryType('POST_PRACTICE');
    setView('STORIES');
  };

  const handleMarkDayComplete = (dateStr: string, planDay: PlanDay) => {
    const newRecord: SessionRecord = {
      id: Date.now().toString(),
      userId: user?.id,
      date: dateStr,
      routineName: planDay.focus || `Prática de ${preferences.goal}`,
      duration: preferences.duration // Assume user did the standard duration
    };
    saveHistory([newRecord, ...history]);
  };

  const handleUpdateDay = (dayIndex: number, newDayData: PlanDay) => {
    const activePlan = customPlan || createPersonalizedPlan(preferences);
    const newSchedule = [...activePlan.schedule];
    newSchedule[dayIndex] = newDayData;
    
    saveCustomPlan({
      ...activePlan,
      schedule: newSchedule
    });
  };

  const handleStoriesComplete = (feedback: FeedbackRecord) => {
    // 1. Post Practice Logic
    if (feedback.type === 'POST_PRACTICE' && currentRoutine) {
        const newRecord: SessionRecord = {
            id: Date.now().toString(),
            userId: user?.id,
            date: new Date().toISOString().split('T')[0],
            routineName: currentRoutine.name,
            duration: Math.round(currentRoutine.totalDuration / 60),
            feedback: feedback
        };
        saveHistory([newRecord, ...history]);
        
        // --- ADAPTATION LOGIC ---
        // Check difficulty feedback
        const difficultyResponse = feedback.responses.find(r => r.question.includes("intensidade"));
        if (difficultyResponse && difficultyResponse.score !== undefined) {
             if (difficultyResponse.score === -1) {
                 // Too Hard -> Decrease level if possible
                 if (preferences.level === 'Avançado') savePreferences({...preferences, level: 'Intermediário'});
                 else if (preferences.level === 'Intermediário') savePreferences({...preferences, level: 'Iniciante'});
             } else if (difficultyResponse.score === 1) {
                 // Too Easy -> Increase level if possible
                 if (preferences.level === 'Iniciante') savePreferences({...preferences, level: 'Intermediário'});
                 else if (preferences.level === 'Intermediário') savePreferences({...preferences, level: 'Avançado'});
             }
        }
    } 
    // 2. Weekly Checkin (Start of Week)
    else if (feedback.type === 'WEEKLY_CHECKIN') {
        saveWeeklyContext(feedback);
        console.log("Weekly Intention Set:", feedback);
    }
    // 3. Weekly Review (End of Week) -> GENERATE RESULT
    else if (feedback.type === 'WEEKLY_REVIEW') {
        const intention = weeklyContext?.responses.find(r => r.question.includes('intenção'))?.answer || "Não definida";
        const reality = feedback.responses.find(r => r.question.includes('intenção'))?.answer || "Não informado"; // Did you meet it?
        const feeling = feedback.responses.find(r => r.question.includes('sentimento'))?.answer || "Neutro";

        // Generate Insight
        let insight = "";
        if (reality.includes("Sim")) {
            insight = "Sua dedicação foi recompensada! Você conseguiu alinhar sua mente com suas ações. Mantenha esse foco para a próxima semana.";
        } else if (reality.includes("Parcialmente")) {
            insight = "Progresso não é linear. Você deu passos importantes, mesmo que o caminho tenha mudado. O importante é a constância.";
        } else {
            insight = "Tudo bem mudar de rota. Escutar o que o corpo precisa é mais valioso do que seguir um plano rígido. Recomece com gentileza.";
        }

        setWeeklyReport({
            intention,
            result: `${reality} - ${feeling}`,
            insight
        });
        
        // Reset context for next week
        saveWeeklyContext(null);
    }

    // Return to Journey
    setView('JOURNEY');
  };

  const handleStartCheckin = (type: 'WEEKLY_CHECKIN' | 'WEEKLY_REVIEW') => {
      setStoryType(type);
      setView('STORIES');
  };

  // --- Views ---

  const renderOnboarding = () => {
    // Steps definition: 0: Intro/Bio, 1: Discomforts, 2: Experience Level, 3: Goal, 4: Duration
    const nextStep = () => setOnboardingStep(prev => prev + 1);
    const prevStep = () => setOnboardingStep(prev => Math.max(0, prev - 1));
    const progress = ((onboardingStep + 1) / 5) * 100;

    // Helper wrapper to update state and auto save to LS for draft resilience
    const updatePrefs = (updates: Partial<UserPreferences>) => {
      setPreferences(prev => ({...prev, ...updates}));
    };

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
                    <UserIcon size={32} className="text-sage-600" />
                  </div>
                </div>
                <h2 className="text-2xl font-medium text-center text-sage-900 mb-2">Sobre Você</h2>
                <p className="text-center text-stone-500 mb-8">Olá {user?.name.split(' ')[0]}, precisamos conhecer um pouco sobre seu corpo.</p>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">Sua Idade</label>
                    <input 
                      type="number" 
                      value={preferences.age || ''}
                      onChange={(e) => updatePrefs({ age: parseInt(e.target.value) || undefined })}
                      className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-sage-400 focus:outline-none text-lg"
                      placeholder="Ex: 30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">Peso (kg) <span className="text-stone-400 font-normal">(Opcional)</span></label>
                    <input 
                      type="number" 
                      value={preferences.weight || ''}
                      onChange={(e) => updatePrefs({ weight: parseInt(e.target.value) || undefined })}
                      className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-sage-400 focus:outline-none text-lg"
                      placeholder="Ex: 70"
                    />
                  </div>
                </div>

                <Button onClick={nextStep} disabled={!preferences.age} className="w-full mt-8">
                  Continuar <ArrowRight size={18} />
                </Button>
                
                <div className="mt-4 text-center">
                  <button onClick={handleLogout} className="text-sm text-stone-400 hover:text-stone-600">Sair da conta</button>
                </div>
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
                            updatePrefs({ discomforts: ['Nenhum'] });
                          } else {
                            const current = preferences.discomforts.filter(d => d !== 'Nenhum');
                            const newDiscomforts = current.includes(option)
                              ? current.filter(d => d !== option)
                              : [...current, option];
                            updatePrefs({ discomforts: newDiscomforts });
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
                        updatePrefs({ level: opt });
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
                        updatePrefs({ goal: opt });
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
                        // Immediately update and finish
                        const newPrefs = { ...preferences, duration: opt };
                        // We need to call the final saver manually here because of state batching issues if we just relied on updatePrefs
                        setPreferences(newPrefs);
                        // Trigger completion flow next tick
                        setTimeout(() => handleOnboardingComplete(), 50);
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
            <h1 className="text-4xl font-light text-sage-900 mb-2">Olá, {user?.name.split(' ')[0]}</h1>
            <p className="text-stone-500">Pronto para encontrar seu centro hoje?</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="hidden md:flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-stone-100">
              <Smile size={20} className="text-orange-400" />
              <span className="text-sm font-medium text-stone-600">{history.length} Sessões Completadas</span>
            </div>
            <button onClick={handleLogout} className="text-xs text-stone-400 hover:text-red-500 flex items-center gap-1">
               <LogOut size={12} /> Sair
            </button>
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
              <Card className="p-4 flex items-center justify-between cursor-pointer hover:border-sage-300 transition-colors" onClick={handleOpenPrefsEditor}>
                 <div>
                    <p className="text-xs text-stone-400 uppercase font-bold">Objetivo</p>
                    <p className="text-sage-800 font-medium">{preferences.goal}</p>
                 </div>
                 <Zap size={20} className="text-stone-300" />
              </Card>
              <Card className="p-4 flex items-center justify-between cursor-pointer hover:border-sage-300 transition-colors" onClick={handleOpenPrefsEditor}>
                 <div>
                    <p className="text-xs text-stone-400 uppercase font-bold">Duração</p>
                    <p className="text-sage-800 font-medium">{preferences.duration} Min</p>
                 </div>
                 <Clock size={20} className="text-stone-300" />
              </Card>
              <Card className="p-4 flex items-center justify-between cursor-pointer hover:border-sage-300 transition-colors" onClick={handleOpenPrefsEditor}>
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

        {/* PREFERENCES EDITOR MODAL */}
        {editingPrefs && (
           <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
                 <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50 rounded-t-3xl">
                    <h3 className="text-xl font-light text-sage-900 flex items-center gap-2">
                       <Edit2 size={20} /> Editar Preferências do Plano
                    </h3>
                    <button onClick={() => setEditingPrefs(null)} className="text-stone-400 hover:text-stone-600">
                       <X size={24} />
                    </button>
                 </div>
                 
                 <div className="overflow-y-auto p-6 flex-1 space-y-8">
                    
                    {/* Goal Section */}
                    <div className="space-y-3">
                       <h4 className="text-sm font-bold text-stone-500 uppercase">Objetivo Principal</h4>
                       <div className="grid grid-cols-2 gap-3">
                          {(['Flexibilidade', 'Força', 'Relaxamento', 'Alívio de Dor'] as Goal[]).map((g) => (
                             <button
                               key={g}
                               onClick={() => setEditingPrefs({...editingPrefs, goal: g})}
                               className={`p-3 rounded-xl border-2 transition-all text-sm font-medium
                                 ${editingPrefs.goal === g 
                                   ? 'border-sage-500 bg-sage-50 text-sage-800' 
                                   : 'border-stone-100 bg-white text-stone-600 hover:border-sage-200'
                                 }
                               `}
                             >
                               {g}
                             </button>
                          ))}
                       </div>
                    </div>

                    {/* Level Section */}
                    <div className="space-y-3">
                       <h4 className="text-sm font-bold text-stone-500 uppercase">Nível de Experiência</h4>
                       <div className="grid grid-cols-3 gap-3">
                          {(['Iniciante', 'Intermediário', 'Avançado'] as Difficulty[]).map((l) => (
                             <button
                               key={l}
                               onClick={() => setEditingPrefs({...editingPrefs, level: l})}
                               className={`p-3 rounded-xl border-2 transition-all text-sm font-medium
                                 ${editingPrefs.level === l
                                   ? 'border-sage-500 bg-sage-50 text-sage-800' 
                                   : 'border-stone-100 bg-white text-stone-600 hover:border-sage-200'
                                 }
                               `}
                             >
                               {l}
                             </button>
                          ))}
                       </div>
                    </div>

                    {/* Duration Section */}
                    <div className="space-y-3">
                       <h4 className="text-sm font-bold text-stone-500 uppercase">Duração (Minutos)</h4>
                       <div className="grid grid-cols-3 gap-3">
                          {([15, 30, 45] as Duration[]).map((d) => (
                             <button
                               key={d}
                               onClick={() => setEditingPrefs({...editingPrefs, duration: d})}
                               className={`p-3 rounded-xl border-2 transition-all text-sm font-medium
                                 ${editingPrefs.duration === d
                                   ? 'border-sage-500 bg-sage-50 text-sage-800' 
                                   : 'border-stone-100 bg-white text-stone-600 hover:border-sage-200'
                                 }
                               `}
                             >
                               {d} min
                             </button>
                          ))}
                       </div>
                    </div>

                    {/* Discomforts Section */}
                    <div className="space-y-3">
                       <h4 className="text-sm font-bold text-stone-500 uppercase">Áreas de Atenção</h4>
                       <div className="grid grid-cols-2 gap-3">
                          {(['Lombar', 'Joelhos', 'Pescoço/Ombros', 'Punhos', 'Nenhum'] as Discomfort[]).map((option) => {
                             const isSelected = editingPrefs.discomforts.includes(option);
                             const isNone = option === 'Nenhum';
                             return (
                               <button
                                 key={option}
                                 onClick={() => {
                                   if (isNone) {
                                     setEditingPrefs({...editingPrefs, discomforts: ['Nenhum']});
                                   } else {
                                     const current = editingPrefs.discomforts.filter(d => d !== 'Nenhum');
                                     const newDiscomforts = current.includes(option)
                                       ? current.filter(d => d !== option)
                                       : [...current, option];
                                     setEditingPrefs({...editingPrefs, discomforts: newDiscomforts});
                                   }
                                 }}
                                 className={`p-3 rounded-xl border-2 transition-all text-sm font-medium flex items-center justify-center gap-2
                                   ${isSelected 
                                     ? 'border-sage-500 bg-sage-50 text-sage-800' 
                                     : 'border-stone-100 bg-white text-stone-600 hover:border-sage-200'
                                   }
                                 `}
                               >
                                 {isSelected && <Check size={14} className="text-sage-600" />}
                                 {option}
                               </button>
                             );
                          })}
                       </div>
                    </div>

                    {/* Bio Data (Small) */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Idade</label>
                           <input 
                              type="number"
                              value={editingPrefs.age || ''}
                              onChange={(e) => setEditingPrefs({...editingPrefs, age: parseInt(e.target.value) || undefined})}
                              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-300"
                           />
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Peso (kg)</label>
                           <input 
                              type="number"
                              value={editingPrefs.weight || ''}
                              onChange={(e) => setEditingPrefs({...editingPrefs, weight: parseInt(e.target.value) || undefined})}
                              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-300"
                           />
                        </div>
                    </div>

                 </div>

                 <div className="p-6 border-t border-stone-100 flex justify-end gap-3 rounded-b-3xl bg-white">
                    <Button variant="ghost" onClick={() => setEditingPrefs(null)}>Cancelar</Button>
                    <Button onClick={handleSavePrefsEditor}>
                       <Save size={18} /> Salvar & Atualizar Plano
                    </Button>
                 </div>
              </div>
           </div>
        )}
      </div>
    );
  };

  // --- Main Render Logic ---

  if (view === 'AUTH') {
    return <AuthScreen onSuccess={handleUserAuthenticated} />;
  }
  
  // Guard check (should be handled by view state logic but safety first)
  if (!user && view !== 'AUTH') {
      setView('AUTH');
      return null;
  }

  if (view === 'STORIES') {
      return (
          <StoriesOverlay 
            type={storyType}
            onComplete={handleStoriesComplete}
            onClose={() => setView('JOURNEY')}
          />
      );
  }
  
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
          saveCustomPlan(updatedPlan);
          setView('JOURNEY');
        }}
      />
    );
  }

  if (view === 'ONBOARDING') {
    return renderOnboarding();
  }

  return (
    <div className="min-h-screen bg-zen-offwhite text-stone-800 font-sans relative">
      {/* Dynamic Content */}
      <main className="min-h-screen">
        {view === 'DASHBOARD' && renderDashboard()}
        {view === 'LIBRARY' && <PoseLibrary />}
        {view === 'LEARNING' && <LearningHub />}
        {view === 'JOURNEY' && (
           <Journey 
             preferences={preferences} 
             history={history}
             customPlan={customPlan}
             onStartRoutine={handleGenerate} 
             onEditPlan={() => setView('PLAN_EDITOR')}
             onUpdateDay={handleUpdateDay}
             onMarkComplete={handleMarkDayComplete}
             onStartCheckin={handleStartCheckin}
           />
        )}
      </main>

      {/* Weekly Report Result Modal */}
      {weeklyReport && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-fade-in text-center p-8 relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                   
                   <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-6">
                       <Star size={32} className="text-purple-500" fill="currentColor"/>
                   </div>

                   <h2 className="text-2xl font-bold text-sage-900 mb-2">Sua Semana em Resumo</h2>
                   <p className="text-stone-500 mb-8">Conectando sua intenção com sua realidade.</p>
                   
                   <div className="grid grid-cols-2 gap-4 mb-8 text-left">
                       <div className="bg-stone-50 p-4 rounded-xl">
                           <p className="text-xs font-bold text-stone-400 uppercase">Intenção Inicial</p>
                           <p className="text-lg font-medium text-sage-800">{weeklyReport.intention}</p>
                       </div>
                       <div className="bg-stone-50 p-4 rounded-xl">
                           <p className="text-xs font-bold text-stone-400 uppercase">Resultado Real</p>
                           <p className="text-lg font-medium text-sage-800">{weeklyReport.result}</p>
                       </div>
                   </div>

                   <div className="bg-indigo-50 p-6 rounded-xl text-indigo-900 italic mb-8 relative">
                        <span className="absolute top-2 left-2 text-4xl text-indigo-200 font-serif leading-none">"</span>
                        {weeklyReport.insight}
                        <span className="absolute bottom-[-10px] right-4 text-4xl text-indigo-200 font-serif leading-none">"</span>
                   </div>

                   <Button onClick={() => setWeeklyReport(null)} className="w-full">
                       Iniciar Nova Semana
                   </Button>
              </div>
          </div>
      )}

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 px-2 py-4 flex justify-between items-center z-40 md:justify-center md:gap-8">
        <button 
          onClick={() => setView('DASHBOARD')}
          className={`flex flex-col items-center gap-1 w-16 ${view === 'DASHBOARD' ? 'text-sage-600' : 'text-stone-400 hover:text-stone-600'}`}
        >
          <LayoutDashboard size={24} />
          <span className="text-[10px] font-medium tracking-wide">Hoje</span>
        </button>

        <button 
          onClick={() => setView('JOURNEY')}
          className={`flex flex-col items-center gap-1 w-16 ${view === 'JOURNEY' ? 'text-sage-600' : 'text-stone-400 hover:text-stone-600'}`}
        >
          <Map size={24} />
          <span className="text-[10px] font-medium tracking-wide">Jornada</span>
        </button>
        
        <button 
           onClick={handleGenerate}
           className="bg-sage-600 text-white p-4 rounded-full -mt-10 shadow-lg shadow-sage-200 border-4 border-zen-offwhite hover:scale-105 transition-transform"
        >
          <Play size={28} fill="currentColor" className="ml-1"/>
        </button>

        <button 
          onClick={() => setView('LEARNING')}
          className={`flex flex-col items-center gap-1 w-16 ${view === 'LEARNING' ? 'text-sage-600' : 'text-stone-400 hover:text-stone-600'}`}
        >
          <BookOpen size={24} />
          <span className="text-[10px] font-medium tracking-wide">Aprender</span>
        </button>

        <button 
          onClick={() => setView('LIBRARY')}
          className={`flex flex-col items-center gap-1 w-16 ${view === 'LIBRARY' ? 'text-sage-600' : 'text-stone-400 hover:text-stone-600'}`}
        >
          <Library size={24} />
          <span className="text-[10px] font-medium tracking-wide">Biblioteca</span>
        </button>
      </nav>
    </div>
  );
};

export default App;