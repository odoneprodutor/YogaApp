
import React, { useState, useEffect } from 'react';
import { Pose, Category, Difficulty } from '../types';
import { poseStore } from '../services/poseStore';
import { Card, Badge, Button } from './ui';
import { Search, Filter, Settings, Edit, Link as LinkIcon, Save, X, RotateCcw, Plus, Image as ImageIcon } from 'lucide-react';

export const PoseLibrary: React.FC = () => {
  const [poses, setPoses] = useState<Pose[]>([]);
  const [filterCategory, setFilterCategory] = useState<Category | 'Todos'>('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPoseId, setSelectedPoseId] = useState<string | null>(null);
  
  // Admin State
  const [isAdminMode, setIsAdminMode] = useState(false);
  
  // Edit State
  const [editingPose, setEditingPose] = useState<Pose | null>(null);
  const [videoUrlInput, setVideoUrlInput] = useState('');

  // Add State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newPoseData, setNewPoseData] = useState<Partial<Pose>>({
      difficulty: 'Iniciante',
      category: 'Aquecimento',
      durationDefault: 60,
      benefits: []
  });
  const [newPoseBenefitsInput, setNewPoseBenefitsInput] = useState('');

  // Load poses from store on mount
  useEffect(() => {
    refreshPoses();
  }, []);

  const refreshPoses = () => {
    setPoses(poseStore.getAll());
  };

  const filteredPoses = poses.filter(pose => {
    const matchesCategory = filterCategory === 'Todos' || pose.category === filterCategory;
    const matchesSearch = pose.portugueseName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          pose.sanskritName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories: Category[] = ['Aquecimento', 'Pé', 'Core', 'Sentado', 'Inversão', 'Restaurativa', 'Finalização'];
  const difficulties: Difficulty[] = ['Iniciante', 'Intermediário', 'Avançado'];

  const handleEditClick = (e: React.MouseEvent, pose: Pose) => {
    e.stopPropagation(); // Previne que o clique selecione o card
    setEditingPose(pose);
    setVideoUrlInput(pose.media.videoEmbedUrl);
  };

  const handleCardClick = (poseId: string) => {
    // Alterna a seleção (se clicar no mesmo, deseleciona)
    setSelectedPoseId(prev => prev === poseId ? null : poseId);
  };

  const handleSaveVideo = () => {
    if (editingPose && videoUrlInput) {
      poseStore.updateVideoUrl(editingPose.id, videoUrlInput);
      refreshPoses();
      setEditingPose(null);
    }
  };

  const handleResetVideo = () => {
    if (editingPose) {
        poseStore.resetToDefault(editingPose.id);
        refreshPoses();
        setEditingPose(null);
    }
  };

  const handleAddPose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPoseData.portugueseName || !newPoseData.sanskritName || !newPoseData.media?.thumbnailUrl) {
        alert("Preencha os campos obrigatórios.");
        return;
    }

    const benefitsArray = newPoseBenefitsInput.split(',').map(b => b.trim()).filter(b => b.length > 0);

    const poseToAdd: Pose = {
        id: Date.now().toString(),
        portugueseName: newPoseData.portugueseName,
        sanskritName: newPoseData.sanskritName,
        difficulty: newPoseData.difficulty as Difficulty,
        category: newPoseData.category as Category,
        description: newPoseData.description || '',
        durationDefault: newPoseData.durationDefault || 60,
        benefits: benefitsArray,
        media: {
            thumbnailUrl: newPoseData.media.thumbnailUrl,
            videoEmbedUrl: newPoseData.media.videoEmbedUrl || 'https://www.youtube.com/embed/v7AYKMP6rOE'
        }
    };

    poseStore.addPose(poseToAdd);
    refreshPoses();
    setIsAddModalOpen(false);
    // Reset form
    setNewPoseData({ difficulty: 'Iniciante', category: 'Aquecimento', durationDefault: 60, benefits: [] });
    setNewPoseBenefitsInput('');
  };

  return (
    <div className="pb-24 pt-6 px-4 max-w-5xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
            <h2 className="text-3xl font-light text-sage-800 mb-2">Biblioteca de Asanas</h2>
            <p className="text-stone-500">Explore nossa coleção de {poses.length} posturas.</p>
        </div>
        <div className="flex gap-2">
            {isAdminMode && (
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-sage-600 text-white rounded-full hover:bg-sage-700 transition-colors shadow-md"
                >
                    <Plus size={18} /> Nova Postura
                </button>
            )}
            <button 
                onClick={() => setIsAdminMode(!isAdminMode)}
                className={`p-2 rounded-full transition-colors ${isAdminMode ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-400 hover:text-sage-600'}`}
                title="Modo Admin"
            >
                <Settings size={20} />
            </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 sticky top-0 bg-zen-offwhite/95 backdrop-blur-md z-10 py-4 -mx-4 px-4 border-b border-stone-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nome (Português ou Sânscrito)..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          <button 
            onClick={() => setFilterCategory('Todos')}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${filterCategory === 'Todos' ? 'bg-sage-600 text-white' : 'bg-white border border-stone-200 text-stone-600'}`}
          >
            Todos
          </button>
          {categories.map(cat => (
             <button 
             key={cat}
             onClick={() => setFilterCategory(cat)}
             className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${filterCategory === cat ? 'bg-sage-600 text-white' : 'bg-white border border-stone-200 text-stone-600'}`}
           >
             {cat}
           </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPoses.map(pose => {
          const isSelected = selectedPoseId === pose.id;
          
          return (
            <Card 
                key={pose.id} 
                onClick={() => handleCardClick(pose.id)}
                className={`
                    transition-all duration-200 group relative cursor-pointer
                    ${isSelected 
                        ? 'border-2 border-sage-500 bg-sage-50 shadow-md ring-1 ring-sage-100 scale-[1.01]' 
                        : 'hover:shadow-md border border-stone-100 bg-white'
                    }
                `}
            >
              <div className="relative h-48 bg-stone-100 overflow-hidden">
                 <img src={pose.media.thumbnailUrl} alt={pose.portugueseName} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                 <div className="absolute top-2 right-2">
                   <Badge color={pose.difficulty === 'Iniciante' ? 'green' : pose.difficulty === 'Intermediário' ? 'blue' : 'orange'}>
                     {pose.difficulty}
                   </Badge>
                 </div>
                 
                 {/* Admin Edit Overlay */}
                 {isAdminMode && (
                     <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <Button onClick={(e) => handleEditClick(e, pose)} className="bg-white text-sage-800 hover:bg-sage-50">
                             <Edit size={16} /> Editar Vídeo
                         </Button>
                     </div>
                 )}
              </div>
              <div className="p-4">
                <h3 className={`font-semibold text-lg flex items-center gap-2 transition-colors ${isSelected ? 'text-sage-700' : 'text-sage-900'}`}>
                    {pose.portugueseName}
                </h3>
                <p className="text-xs text-sage-600 font-medium italic mb-2">{pose.sanskritName}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                   {pose.benefits.slice(0, 3).map(b => (
                     <span key={b} className={`text-[10px] px-1.5 py-0.5 rounded ${isSelected ? 'bg-sage-100 text-sage-700' : 'bg-stone-100 text-stone-600'}`}>{b}</span>
                   ))}
                </div>
                <p className="text-sm text-stone-500 line-clamp-2">{pose.description}</p>
              </div>
            </Card>
          );
        })}
      </div>
      
      {filteredPoses.length === 0 && (
        <div className="text-center py-20 text-stone-400">
          <p>Nenhuma postura encontrada para estes filtros.</p>
        </div>
      )}

      {/* Edit Video Modal */}
      {editingPose && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium text-sage-900">Editar Vídeo: {editingPose.portugueseName}</h3>
                    <button onClick={() => setEditingPose(null)} className="text-stone-400 hover:text-stone-600">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Link do YouTube</label>
                        <div className="relative">
                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                            <input 
                                type="text" 
                                value={videoUrlInput}
                                onChange={(e) => setVideoUrlInput(e.target.value)}
                                placeholder="https://www.youtube.com/watch?v=..."
                                className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-300"
                            />
                        </div>
                        <p className="text-xs text-stone-400 mt-2">
                            Cole o link completo do vídeo. Nós formataremos automaticamente para exibição.
                        </p>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-700">
                        <span className="font-bold">Nota:</span> A alteração afetará todas as futuras rotinas que usarem esta postura.
                    </div>

                    {/* Responsive Footer Actions */}
                    <div className="flex flex-col-reverse sm:flex-row gap-3 mt-4 pt-4 border-t border-stone-100 sm:items-center">
                        <Button variant="outline" onClick={handleResetVideo} className="text-red-500 hover:bg-red-50 border-red-200 w-full sm:w-auto justify-center">
                            <RotateCcw size={18} /> <span className="truncate">Restaurar Padrão</span>
                        </Button>
                        <div className="hidden sm:block flex-1"></div>
                        <div className="flex gap-3 w-full sm:w-auto">
                            <Button variant="ghost" onClick={() => setEditingPose(null)} className="flex-1 sm:flex-none justify-center">Cancelar</Button>
                            <Button onClick={handleSaveVideo} className="flex-1 sm:flex-none justify-center">
                                <Save size={18} /> Salvar
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* ADD POSE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50 rounded-t-3xl">
                  <h3 className="text-xl font-light text-sage-900">Adicionar Nova Postura</h3>
                  <button onClick={() => setIsAddModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                      <X size={24} />
                  </button>
              </div>

              <div className="overflow-y-auto p-6 flex-1">
                 <form id="add-pose-form" onSubmit={handleAddPose} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div>
                          <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Nome em Português *</label>
                          <input 
                            required
                            type="text" 
                            className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-300"
                            placeholder="Ex: Guerreiro I"
                            value={newPoseData.portugueseName || ''}
                            onChange={(e) => setNewPoseData({...newPoseData, portugueseName: e.target.value})}
                          />
                       </div>
                       <div>
                          <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Nome em Sânscrito *</label>
                          <input 
                            required
                            type="text" 
                            className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-300"
                            placeholder="Ex: Virabhadrasana I"
                            value={newPoseData.sanskritName || ''}
                            onChange={(e) => setNewPoseData({...newPoseData, sanskritName: e.target.value})}
                          />
                       </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                       <div>
                          <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Categoria</label>
                          <select 
                             className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-300"
                             value={newPoseData.category}
                             onChange={(e) => setNewPoseData({...newPoseData, category: e.target.value as Category})}
                          >
                             {categories.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                       </div>
                       <div>
                          <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Dificuldade</label>
                          <select 
                             className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-300"
                             value={newPoseData.difficulty}
                             onChange={(e) => setNewPoseData({...newPoseData, difficulty: e.target.value as Difficulty})}
                          >
                             {difficulties.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                       </div>
                       <div>
                          <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Duração (s)</label>
                          <input 
                            type="number"
                            className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-300"
                            value={newPoseData.durationDefault}
                            onChange={(e) => setNewPoseData({...newPoseData, durationDefault: parseInt(e.target.value)})}
                          />
                       </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Imagem de Capa (URL) *</label>
                        <div className="relative">
                            <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                            <input 
                                required
                                type="text" 
                                className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-300"
                                placeholder="https://..."
                                value={newPoseData.media?.thumbnailUrl || ''}
                                onChange={(e) => setNewPoseData({...newPoseData, media: { ...newPoseData.media!, thumbnailUrl: e.target.value }})}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Link do Vídeo (YouTube)</label>
                        <div className="relative">
                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                            <input 
                                type="text" 
                                className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-300"
                                placeholder="https://youtube.com/..."
                                value={newPoseData.media?.videoEmbedUrl || ''}
                                onChange={(e) => setNewPoseData({...newPoseData, media: { ...newPoseData.media!, videoEmbedUrl: e.target.value }})}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Benefícios (separados por vírgula)</label>
                        <input 
                            type="text" 
                            className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-300"
                            placeholder="Ex: Coluna, Relaxamento, Força"
                            value={newPoseBenefitsInput}
                            onChange={(e) => setNewPoseBenefitsInput(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Descrição</label>
                        <textarea 
                            className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-300 h-24"
                            placeholder="Instruções de como realizar a postura..."
                            value={newPoseData.description}
                            onChange={(e) => setNewPoseData({...newPoseData, description: e.target.value})}
                        />
                    </div>
                 </form>
              </div>

              <div className="p-6 border-t border-stone-100 flex justify-end gap-3 rounded-b-3xl bg-white">
                  <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>Cancelar</Button>
                  <Button type="submit" form="add-pose-form">Salvar Postura</Button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
